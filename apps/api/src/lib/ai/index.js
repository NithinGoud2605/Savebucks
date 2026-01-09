/**
 * AI Orchestrator
 * Main entry point for AI chat functionality
 * Coordinates cache, classification, tools, and response generation
 * 
 * @version 2.0.0
 * @author SaveBucks Team
 */

import { v4 as uuidv4 } from 'uuid';
import { AI_CONFIG, validateConfig, LIMITS, INTENTS } from './config.js';
import { createChatCompletion, parseStream, AIError, ERROR_CODES } from './client.js';
import { classifyIntent, selectModel } from './classifier.js';
import { TOOL_DEFINITIONS, executeToolCalls } from './tools.js';
import { getCache } from './cache.js';
import {
    SYSTEM_PROMPT,
    INTENT_PROMPTS,
    ERROR_RESPONSES,
    formatDealsForContext,
    formatCouponsForContext
} from './prompts.js';

// ═══════════════════════════════════════════════════════════════════════════════
// AI Orchestrator Class
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main AI Orchestrator
 * Handles the complete AI chat flow including classification, tool execution, and response generation
 */
class AIOrchestrator {
    constructor() {
        this.cache = getCache();
        this.enabled = AI_CONFIG.features.enabled && validateConfig();

        if (!this.enabled) {
            console.warn('[AI Orchestrator] ⚠️ AI features disabled (missing configuration)');
        } else {
            console.log('[AI Orchestrator] ✅ Initialized successfully');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Main Chat Method (Non-Streaming)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Process a chat message (non-streaming)
     * 
     * @param {Object} options - Chat options
     * @param {string} options.message - User message
     * @param {string} [options.userId] - User ID (null for guests)
     * @param {Array} [options.history] - Conversation history
     * @param {Object} [options.context] - Additional context
     * @returns {Promise<Object>} Chat response
     */
    async chat({ message, userId, history = [], context = {} }) {
        const startTime = Date.now();
        const requestId = uuidv4();

        // Validate
        if (!this.enabled) {
            return this.createErrorResponse('AI features are currently unavailable.', requestId);
        }

        if (!message || typeof message !== 'string') {
            return this.createErrorResponse(ERROR_RESPONSES.invalidInput, requestId);
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length > LIMITS.maxInputLength) {
            return this.createErrorResponse(ERROR_RESPONSES.tooLong, requestId);
        }

        // Check rate limit
        const userKey = this.getUserKey(userId, context);
        const rateCheck = await this.cache.checkRateLimit(userKey);
        if (rateCheck.limited) {
            return this.createErrorResponse(rateCheck.message, requestId, 429);
        }

        try {
            // Check cache first
            const cached = await this.cache.get(trimmedMessage, 'exact');
            if (cached) {
                console.log(`[AI] ⚡ Cache hit: "${trimmedMessage.slice(0, 50)}..."`);
                return { ...cached, requestId, cached: true, latencyMs: Date.now() - startTime };
            }

            // Classify intent
            const classification = await classifyIntent(trimmedMessage);
            console.log(`[AI] 🎯 Intent: ${classification.intent} (${classification.complexity})`);

            // Handle FAQ responses (no LLM needed)
            if (classification.faqResponse) {
                const response = this.createResponse({
                    content: classification.faqResponse,
                    intent: classification.intent,
                    requestId,
                    startTime,
                    cached: false,
                    tokensUsed: 0,
                    cost: 0
                });
                await this.cache.set(trimmedMessage, response, 'exact');
                return response;
            }

            // Select model and build messages
            const model = selectModel(classification);
            const messages = this.buildMessages(trimmedMessage, history, classification);

            // Call OpenAI with tools
            let toolResults = null;
            let totalTokens = 0;
            let totalCost = 0;

            const firstResponse = await createChatCompletion({
                model,
                messages,
                tools: TOOL_DEFINITIONS,
                maxTokens: LIMITS.maxTokensSimple,
                temperature: 0.7
            });

            totalTokens = firstResponse.usage?.totalTokens || 0;
            totalCost = firstResponse.cost || 0;
            let finalContent = firstResponse.content;

            // Execute tool calls if any
            if (firstResponse.toolCalls && firstResponse.toolCalls.length > 0) {
                console.log(`[AI] 🔧 Executing ${firstResponse.toolCalls.length} tool(s)`);
                toolResults = await executeToolCalls(firstResponse.toolCalls);

                // Get final response with tool results
                const toolMessages = this.buildToolResultMessages(firstResponse.toolCalls, toolResults);
                const finalResponse = await createChatCompletion({
                    model,
                    messages: [
                        ...messages,
                        { role: 'assistant', content: null, tool_calls: firstResponse.toolCalls },
                        ...toolMessages
                    ],
                    maxTokens: LIMITS.maxTokensComplex,
                    temperature: 0.7
                });

                finalContent = finalResponse.content;
                totalTokens += finalResponse.usage?.totalTokens || 0;
                totalCost += finalResponse.cost || 0;
            }

            // Build and cache response
            const response = this.createResponse({
                content: finalContent,
                intent: classification.intent,
                entities: classification.entities,
                toolResults,
                requestId,
                startTime,
                cached: false,
                tokensUsed: totalTokens,
                cost: totalCost,
                model
            });

            await this.cache.set(trimmedMessage, response, 'exact');
            await this.incrementRateLimits(userKey);

            return response;

        } catch (error) {
            console.error('[AI] ❌ Chat error:', error.message);

            if (error instanceof AIError) {
                return this.createErrorResponse(error.message, requestId, error.statusCode);
            }

            return this.handleFallback(trimmedMessage, requestId, startTime, error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Streaming Chat Method
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Process a chat message with streaming
     * 
     * @param {Object} options - Chat options
     * @param {Function} onChunk - Callback for each chunk { type: 'text'|'deals'|'coupons'|'done'|'error', ... }
     * @returns {Promise<Object>} Final response
     */
    async chatStream({ message, userId, history = [], context = {} }, onChunk) {
        const startTime = Date.now();
        const requestId = uuidv4();

        // Validate
        if (!this.enabled) {
            onChunk({ type: 'error', error: 'AI features are currently unavailable.' });
            return { content: '', error: 'AI disabled' };
        }

        const trimmedMessage = message?.trim();
        if (!trimmedMessage || trimmedMessage.length > LIMITS.maxInputLength) {
            onChunk({ type: 'error', error: ERROR_RESPONSES.invalidInput });
            return { content: '', error: ERROR_RESPONSES.invalidInput };
        }

        // Check rate limit
        const userKey = this.getUserKey(userId, context);
        const rateCheck = await this.cache.checkRateLimit(userKey);
        if (rateCheck.limited) {
            onChunk({ type: 'error', error: rateCheck.message });
            return { content: '', error: rateCheck.message };
        }



        // Send start event IMMEDIATELY to keep connection alive
        onChunk({ type: 'start', requestId });

        try {
            // Check cache
            const cached = await this.cache.get(trimmedMessage, 'exact');
            if (cached) {
                console.log(`[AI] ⚡ Cache hit (stream): "${trimmedMessage.slice(0, 30)}..."`);
                onChunk({ type: 'text', content: cached.content });
                if (cached.deals) onChunk({ type: 'deals', deals: cached.deals });
                if (cached.coupons) onChunk({ type: 'coupons', coupons: cached.coupons });
                onChunk({ type: 'done', cached: true });
                return { content: cached.content, cached: true, deals: cached.deals, coupons: cached.coupons };
            }

            // Classify intent
            const classification = await classifyIntent(trimmedMessage);
            console.log(`[AI] 🎯 Intent: ${classification.intent}`);

            // Handle FAQ
            if (classification.faqResponse) {
                onChunk({ type: 'text', content: classification.faqResponse });
                onChunk({ type: 'done', cached: false, tokensUsed: 0 });
                return { content: classification.faqResponse, cached: false, tokensUsed: 0, cost: 0 };
            }

            // Select model and build messages
            const model = selectModel(classification);
            const messages = this.buildMessages(trimmedMessage, history, classification);

            // Determine if this intent needs tools
            const toolNeededIntents = [INTENTS.SEARCH, INTENTS.COUPON, INTENTS.TRENDING];
            const needsTools = toolNeededIntents.includes(classification.intent);

            // For intents that don't need tools (COMPARE, ADVICE, GENERAL, HELP), stream directly
            if (!needsTools) {
                return await this.streamDirectResponse(messages, model, onChunk, userKey);
            }

            // For tool-needing intents, execute tools first, then stream
            return await this.streamWithTools(messages, model, onChunk, userKey, classification);

        } catch (error) {
            console.error('[AI] ❌ Stream error:', error.message);

            // Surface specific error messages
            let errorMessage = 'Something went wrong. Please try again.';
            if (error instanceof AIError) {
                if (error.code === ERROR_CODES.RATE_LIMIT) {
                    errorMessage = 'AI is busy right now. Please wait a moment and try again.';
                } else if (error.code === ERROR_CODES.TIMEOUT) {
                    errorMessage = 'Request took too long. Please try again.';
                }
            }

            onChunk({ type: 'error', error: errorMessage });
            return { content: '', error: error.message };
        }
    }

    /**
     * Stream response directly without tool execution
     */
    async streamDirectResponse(messages, model, onChunk, userKey) {
        const streamResult = await createChatCompletion({
            model,
            messages,
            stream: true
        });

        if (!streamResult?.stream) {
            onChunk({ type: 'error', error: 'Failed to initialize stream. Please try again.' });
            return { content: '', error: 'Stream initialization failed' };
        }

        const streamed = await parseStream(streamResult, onChunk);

        if (streamed.dealIds?.length > 0) {
            onChunk({ type: 'dealIds', dealIds: streamed.dealIds });
        }

        onChunk({ type: 'done', cached: false });
        await this.incrementRateLimits(userKey);

        return {
            content: streamed.content,
            dealIds: streamed.dealIds || [],
            cached: false,
            usage: { totalTokens: 0 },
            cost: 0,
            model
        };
    }

    /**
     * Execute tools first, then stream the final response
     */
    async streamWithTools(messages, model, onChunk, userKey, classification) {
        // First call to get tool calls
        const firstResponse = await createChatCompletion({
            model,
            messages,
            tools: TOOL_DEFINITIONS,
            stream: false
        });

        let totalTokens = firstResponse.usage?.totalTokens || 0;
        let totalCost = firstResponse.cost || 0;
        let toolResults = null;
        let allDeals = [];  // Store all deals for later filtering
        let sentDeals = []; // Track which deals were actually sent

        // Handle tool calls
        if (firstResponse.toolCalls?.length > 0) {
            console.log(`[AI] 🔧 Executing ${firstResponse.toolCalls.length} tool(s)`);
            toolResults = await executeToolCalls(firstResponse.toolCalls);

            // Collect deals/coupons from tool results (but don't send yet - wait for AI to pick specific ones)
            let dealsForContext = [];
            let couponsToSend = [];
            for (const [, result] of Object.entries(toolResults)) {
                if (result.deals?.length > 0) {
                    dealsForContext.push(...result.deals);
                    allDeals.push(...result.deals);
                }
                if (result.coupons?.length > 0) {
                    couponsToSend.push(...result.coupons);
                    // Send coupons immediately (no filtering needed)
                    onChunk({ type: 'coupons', coupons: result.coupons });
                }
            }

            // Add context to messages for final response
            if (dealsForContext.length > 0) {
                const lastMessage = messages[messages.length - 1];
                lastMessage.content += `\n\nDEALS FOUND:\n${formatDealsForContext(dealsForContext)}`;
            }

            // Stream final response with tool results
            const toolMessages = this.buildToolResultMessages(firstResponse.toolCalls, toolResults);
            const streamResult = await createChatCompletion({
                model,
                messages: [
                    ...messages,
                    { role: 'assistant', content: null, tool_calls: firstResponse.toolCalls },
                    ...toolMessages
                ],
                stream: true
            });

            if (!streamResult?.stream) {
                onChunk({ type: 'error', error: 'Failed to initialize stream. Please try again.' });
                return { content: '', error: 'Stream initialization failed' };
            }

            const streamed = await parseStream(streamResult, onChunk);

            // AUTO-SEND DEALS: If tools found deals, send them!
            // Don't rely solely on AI to return dealIds correctly, as it sometimes forgets or hallucinates
            if (allDeals.length > 0) {
                // If AI selected specific deals, try to filter
                if (streamed.dealIds?.length > 0) {
                    const filteredDeals = allDeals.filter(deal =>
                        streamed.dealIds.includes(deal.id)
                    );

                    if (filteredDeals.length > 0) {
                        console.log(`[AI] 📦 Sending ${filteredDeals.length} AI-selected deals`);
                        sentDeals = filteredDeals;
                        onChunk({ type: 'deals', deals: filteredDeals });
                    } else {
                        // AI returned IDs that don't match -> Send all deals as fallback
                        console.log(`[AI] ⚠️ AI returned invalid dealIds, sending all ${allDeals.length} found deals`);
                        sentDeals = allDeals;
                        onChunk({ type: 'deals', deals: allDeals });
                    }
                } else {
                    // AI didn't return any IDs -> Send all deals found by tools
                    console.log(`[AI] 📦 Sending all ${allDeals.length} found deals (AI didn't select specific ones)`);
                    sentDeals = allDeals;
                    onChunk({ type: 'deals', deals: allDeals });
                }
            }



            // Send done event
            onChunk({ type: 'done', cached: false });

            return {
                content: streamed.content,
                cached: false,
                deals: sentDeals, // Return actual deals for DB persistence
                coupons: couponsToSend, // Return actual coupons for DB persistence
                toolResults,
                usage: { totalTokens },
                cost: totalCost,
                model
            };
        }

        // No tool calls, send content directly
        onChunk({ type: 'text', content: firstResponse.content || '' });
        onChunk({ type: 'done', cached: false });
        await this.incrementRateLimits(userKey);

        return {
            content: firstResponse.content || '',
            cached: false,
            usage: { totalTokens },
            cost: totalCost,
            model
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get user key for rate limiting
     */
    getUserKey(userId, context) {
        return userId ? `u:${userId}` : `ip:${context.ip || 'unknown'}`;
    }

    /**
     * Increment rate limit counters
     */
    async incrementRateLimits(userKey) {
        await Promise.all([
            this.cache.incrementQueryCount(userKey, 'day'),
            this.cache.incrementQueryCount(userKey, 'minute')
        ]);
    }

    /**
     * Build messages array for LLM
     */
    buildMessages(message, history, classification) {
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        // Add intent-specific prompt
        const intentPrompt = INTENT_PROMPTS[classification.intent];
        if (intentPrompt) {
            messages[0].content += '\n\n' + intentPrompt.trim();
        }

        // Add JSON format reminder
        messages[0].content += '\n\nIMPORTANT: Return ONLY valid JSON starting with { and ending with }. No explanations.';

        // Add relevant history with deal context
        const relevantHistory = history
            .filter(msg => msg?.content?.trim())
            .slice(-LIMITS.maxConversationHistory);

        for (const msg of relevantHistory) {
            let content = msg.content;

            // Inject deal context for AI to reference in follow-ups
            if (msg.role === 'assistant' && msg.deals?.length > 0) {
                const dealSummary = msg.deals.map((d, i) =>
                    `${i + 1}. ${d.title} ($${d.price}${d.store ? ` at ${d.store}` : ''})`
                ).join(', ');
                content += `\n[Previously suggested deals: ${dealSummary}]`;
            }

            messages.push({ role: msg.role, content });
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        return messages;
    }

    /**
     * Build tool result messages for follow-up call
     */
    buildToolResultMessages(toolCalls, toolResults) {
        return toolCalls.map(call => {
            const result = toolResults[call.id];
            let content = '';

            if (result.deals) {
                content = formatDealsForContext(result.deals);
            } else if (result.coupons) {
                content = formatCouponsForContext(result.coupons);
            } else if (result.deal) {
                content = formatDealsForContext([result.deal]);
            } else if (result.store) {
                content = JSON.stringify(result.store, null, 2);
            } else {
                content = JSON.stringify(result, null, 2);
            }

            return { role: 'tool', tool_call_id: call.id, content };
        });
    }

    /**
     * Create standardized response object
     */
    createResponse({ content, intent, entities, toolResults, requestId, startTime, cached, tokensUsed, cost, model }) {
        const response = {
            success: true,
            content,
            intent,
            requestId,
            latencyMs: Date.now() - startTime,
            cached,
            usage: { tokensUsed, estimatedCost: cost }
        };

        // Extract deals/coupons from tool results
        if (toolResults) {
            for (const result of Object.values(toolResults)) {
                if (result.deals) response.deals = result.deals;
                if (result.coupons) response.coupons = result.coupons;
                if (result.store) response.store = result.store;
            }
        }

        return response;
    }

    /**
     * Create error response
     */
    createErrorResponse(message, requestId, statusCode = 500) {
        return { success: false, error: message, requestId, statusCode };
    }

    /**
     * Handle fallback when AI fails
     */
    async handleFallback(message, requestId, startTime, originalError) {
        console.log('[AI] 🔄 Attempting fallback...');

        try {
            const classification = await classifyIntent(message);
            const query = classification.entities?.query || message;
            const { executeTool } = await import('./tools.js');
            const searchResult = await executeTool('search_deals', { query, sort_by: 'popular' });

            if (searchResult.success && searchResult.deals?.length > 0) {
                return {
                    success: true,
                    content: ERROR_RESPONSES.apiError,
                    deals: searchResult.deals,
                    intent: 'search',
                    requestId,
                    latencyMs: Date.now() - startTime,
                    fallback: true
                };
            }
        } catch (fallbackError) {
            console.error('[AI] ❌ Fallback failed:', fallbackError.message);
        }

        return this.createErrorResponse(ERROR_RESPONSES.apiError, requestId);
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.enabled) return { healthy: false, reason: 'AI disabled' };

        try {
            const { healthCheck } = await import('./client.js');
            const result = await healthCheck();
            return {
                healthy: result.healthy,
                cache: this.cache.getStats(),
                latencyMs: result.latencyMs,
                reason: result.healthy ? 'OK' : result.error
            };
        } catch (error) {
            return { healthy: false, reason: error.message };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════════

let orchestratorInstance = null;

/**
 * Get the orchestrator singleton instance
 * @returns {AIOrchestrator}
 */
export function getOrchestrator() {
    if (!orchestratorInstance) {
        orchestratorInstance = new AIOrchestrator();
    }
    return orchestratorInstance;
}

export { AIOrchestrator };
export default { getOrchestrator, AIOrchestrator };
