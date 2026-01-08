/**
 * AI Orchestrator
 * Main entry point for AI chat functionality
 * Coordinates cache, classification, tools, and response generation
 */

import { v4 as uuidv4 } from 'uuid';
import { AI_CONFIG, validateConfig } from './config.js';
import { createChatCompletion, parseStream, AIError } from './client.js';
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

/**
 * AI Orchestrator class
 * Handles the complete AI chat flow
 */
class AIOrchestrator {
    constructor() {
        this.cache = getCache();
        this.enabled = AI_CONFIG.features.enabled && validateConfig();

        if (!this.enabled) {
            console.warn('[AI Orchestrator] AI features disabled (missing config)');
        }
    }

    /**
     * Process a chat message
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
        if (trimmedMessage.length > AI_CONFIG.limits.maxInputLength) {
            return this.createErrorResponse(ERROR_RESPONSES.tooLong, requestId);
        }

        // Check rate limit
        const userKey = userId ? `u:${userId}` : `ip:${context.ip || 'unknown'}`;
        const rateCheck = await this.cache.checkRateLimit(userKey);
        if (rateCheck.limited) {
            return this.createErrorResponse(rateCheck.message, requestId, 429);
        }

        try {
            // Check cache first
            const cached = await this.cache.get(trimmedMessage, 'exact');
            if (cached) {
                console.log(`[AI] Cache hit for query: "${trimmedMessage.slice(0, 50)}..."`);
                return {
                    ...cached,
                    requestId,
                    cached: true,
                    latencyMs: Date.now() - startTime
                };
            }

            // Classify intent
            const classification = await classifyIntent(trimmedMessage);
            console.log(`[AI] Classified: ${classification.intent} (${classification.complexity})`);

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

            // Select model based on complexity
            const model = selectModel(classification);
            console.log(`[AI] Using model: ${model}`);

            // Build messages array
            const messages = this.buildMessages(trimmedMessage, history, classification);

            // First LLM call - may include tool calls
            let injectedContext = '';
            let toolResults = null;
            let finalContent = null;
            let totalTokens = 0;
            let totalCost = 0;

            // Check if model is tool-compatible (OpenRouter DeepSeek R1 often fails with native tools)
            const isToolCompatible = !model.includes('deepseek') && !model.includes(':free');

            // Manual tool execution for incompatible models or simple intents
            if (!isToolCompatible && (
                classification.intent === AI_CONFIG.intents.SEARCH ||
                classification.intent === AI_CONFIG.intents.COUPON ||
                classification.intent === AI_CONFIG.intents.TRENDING ||
                classification.intent === AI_CONFIG.intents.COMPARE
            )) {
                console.log(`[AI] Manual tool execution for intent: ${classification.intent}`);
                const { executeTool } = await import('./tools.js');
                let manualResult = null;

                try {
                    if (classification.intent === AI_CONFIG.intents.SEARCH) {
                        const query = classification.entities.query || trimmedMessage;
                        manualResult = await executeTool('search_deals', {
                            query,
                            max_price: classification.entities.maxPrice
                        });
                    } else if (classification.intent === AI_CONFIG.intents.COUPON) {
                        manualResult = await executeTool('get_coupons', {
                            store: classification.entities.store || classification.entities.query || trimmedMessage
                        });
                    } else if (classification.intent === AI_CONFIG.intents.TRENDING) {
                        manualResult = await executeTool('get_trending_deals', { limit: 5 });
                    }

                    if (manualResult && manualResult.success) {
                        toolResults = { 'manual_exec': manualResult };

                        // Create context for LLM
                        if (manualResult.deals && manualResult.deals.length > 0) {
                            injectedContext = `\n\nDEALS FOUND (extract Deal IDs and include in your JSON response's "dealIds" array):\n${formatDealsForContext(manualResult.deals)}\n\nRemember: Return ONLY JSON with message and dealIds array containing the Deal IDs listed above.`;
                        } else if (manualResult.coupons && manualResult.coupons.length > 0) {
                            injectedContext = `\n\nI have found the following coupons for you to discuss:\n${formatCouponsForContext(manualResult.coupons)}`;
                        } else {
                            injectedContext = `\n\nI searched but found no specific results matching the criteria.`;
                        }

                        // Augment the user message with this context
                        messages[messages.length - 1].content += injectedContext;
                    }
                } catch (toolError) {
                    console.error('[AI] Manual tool execution failed:', toolError);
                }
            }

            const firstResponse = await createChatCompletion({
                model,
                messages,
                tools: isToolCompatible ? TOOL_DEFINITIONS : null,
                maxTokens: model === AI_CONFIG.models.complex
                    ? AI_CONFIG.limits.maxTokensComplex
                    : AI_CONFIG.limits.maxTokensSimple,
                temperature: 0.7
            });

            finalContent = firstResponse.content;
            totalTokens = firstResponse.usage?.totalTokens || 0;
            totalCost = firstResponse.cost || 0;

            // Execute tool calls if any (only for compatible models)
            if (firstResponse.toolCalls && firstResponse.toolCalls.length > 0) {
                console.log(`[AI] Executing ${firstResponse.toolCalls.length} tool(s)`);

                const newToolResults = await executeToolCalls(firstResponse.toolCalls);
                toolResults = { ...toolResults, ...newToolResults };

                // Add tool results to messages and get final response
                const toolMessages = this.buildToolResultMessages(firstResponse.toolCalls, newToolResults);

                const finalResponse = await createChatCompletion({
                    model,
                    messages: [...messages,
                    { role: 'assistant', content: null, tool_calls: firstResponse.toolCalls },
                    ...toolMessages
                    ],
                    maxTokens: AI_CONFIG.limits.maxTokensComplex,
                    temperature: 0.7
                });

                finalContent = finalResponse.content;
                totalTokens += finalResponse.usage?.totalTokens || 0;
                totalCost += finalResponse.cost || 0;
            }

            // Build response
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

            // Cache the response
            await this.cache.set(trimmedMessage, response, 'exact');

            // Increment rate limit counter
            await this.cache.incrementQueryCount(userKey, 'day');
            await this.cache.incrementQueryCount(userKey, 'minute');

            return response;

        } catch (error) {
            console.error('[AI] Chat error:', error);

            if (error instanceof AIError) {
                return this.createErrorResponse(error.message, requestId, error.statusCode);
            }

            // Try fallback
            return this.handleFallback(trimmedMessage, requestId, startTime, error);
        }
    }

    /**
     * Process a chat message with streaming
     * @param {Object} options - Chat options
     * @param {Function} onChunk - Callback for each chunk
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
        if (!trimmedMessage || trimmedMessage.length > AI_CONFIG.limits.maxInputLength) {
            onChunk({ type: 'error', error: ERROR_RESPONSES.invalidInput });
            return { content: '', error: ERROR_RESPONSES.invalidInput };
        }

        // Check rate limit
        const userKey = userId ? `u:${userId}` : `ip:${context.ip || 'unknown'}`;
        const rateCheck = await this.cache.checkRateLimit(userKey);
        if (rateCheck.limited) {
            onChunk({ type: 'error', error: rateCheck.message });
            return { content: '', error: rateCheck.message };
        }

        // Send start event
        onChunk({ type: 'start', requestId });

        try {
            // Check cache
            const cached = await this.cache.get(trimmedMessage, 'exact');
            if (cached) {
                onChunk({ type: 'text', content: cached.content });
                if (cached.deals) onChunk({ type: 'deals', deals: cached.deals });
                if (cached.coupons) onChunk({ type: 'coupons', coupons: cached.coupons });
                onChunk({ type: 'done', cached: true });
                return {
                    content: cached.content,
                    cached: true,
                    deals: cached.deals,
                    coupons: cached.coupons,
                    usage: cached.usage,
                    cost: cached.cost
                };
            }

            // Classify
            const classification = await classifyIntent(trimmedMessage);

            // Handle FAQ
            if (classification.faqResponse) {
                onChunk({ type: 'text', content: classification.faqResponse });
                onChunk({ type: 'done', cached: false, tokensUsed: 0 });
                return {
                    content: classification.faqResponse,
                    cached: false,
                    tokensUsed: 0,
                    cost: 0
                };
            }

            // Select model
            const model = selectModel(classification);

            // Check if model is tool-compatible
            const isToolCompatible = !model.includes('deepseek') && !model.includes(':free');

            // Manual tool execution for stream
            let injectedContext = '';
            let toolResults = null;

            if (!isToolCompatible && (
                classification.intent === AI_CONFIG.intents.SEARCH ||
                classification.intent === AI_CONFIG.intents.COUPON ||
                classification.intent === AI_CONFIG.intents.TRENDING
            )) {
                console.log(`[AI] Manual tool execution (stream) for intent: ${classification.intent}`);
                const { executeTool } = await import('./tools.js');
                let manualResult = null;

                try {
                    if (classification.intent === AI_CONFIG.intents.SEARCH) {
                        const query = classification.entities.query || trimmedMessage;
                        manualResult = await executeTool('search_deals', {
                            query,
                            max_price: classification.entities.maxPrice
                        });
                    } else if (classification.intent === AI_CONFIG.intents.COUPON) {
                        manualResult = await executeTool('get_coupons', {
                            store: classification.entities.store || classification.entities.query || trimmedMessage
                        });
                    } else if (classification.intent === AI_CONFIG.intents.TRENDING) {
                        manualResult = await executeTool('get_trending_deals', { limit: 5 });
                    }

                    if (manualResult && manualResult.success) {
                        toolResults = { 'manual_exec': manualResult };

                        // Send data chunk immediately to frontend
                        if (manualResult.deals && manualResult.deals.length > 0) {
                            onChunk({ type: 'deals', deals: manualResult.deals });
                            injectedContext = `\n\nDEALS FOUND (extract Deal IDs and include in your JSON response's "dealIds" array):\n${formatDealsForContext(manualResult.deals)}\n\nRemember: Return ONLY JSON with message and dealIds array containing the Deal IDs listed above.`;
                        } else if (manualResult.coupons && manualResult.coupons.length > 0) {
                            onChunk({ type: 'coupons', coupons: manualResult.coupons });
                            injectedContext = `\n\nI have found the following coupons for you to discuss:\n${formatCouponsForContext(manualResult.coupons)}`;
                        } else {
                            injectedContext = `\n\nI searched but found no specific results matching the criteria.`;
                        }
                    }
                } catch (e) {
                    console.error('[AI] Manual tool exec failed (stream):', e);
                }
            }

            // Build messages with injected context
            const messages = this.buildMessages(trimmedMessage, history, classification);
            if (injectedContext) {
                messages[messages.length - 1].content += injectedContext;
            }
            
            // Add strict JSON format instruction to system message
            if (messages[0]?.role === 'system') {
                messages[0].content += '\n\nCRITICAL REMINDER: Your response must be ONLY valid JSON starting with { and ending with }. DO NOT include any thinking, reasoning, explanations, or text before/after the JSON. DO NOT write "We are given" or "According to" - just return the JSON object directly.';
            }

            // If we're not tool compatible, we stream immediately
            if (!isToolCompatible) {
                const streamResult = await createChatCompletion({
                    model,
                    messages,
                    stream: true
                });

                if (!streamResult || !streamResult.stream) {
                    console.error('[AI] Stream result is invalid:', streamResult);
                    onChunk({ type: 'error', error: 'Failed to initialize stream. Please try again.' });
                    return { content: '', error: 'Stream initialization failed' };
                }

                const streamed = await parseStream(streamResult, (chunk) => {
                    onChunk(chunk);
                });

                // Send dealIds if present in the parsed response
                if (streamed.dealIds && streamed.dealIds.length > 0) {
                    onChunk({ type: 'dealIds', dealIds: streamed.dealIds });
                }

                onChunk({ type: 'done', cached: false });

                // Update rate limits since we return early
                await this.cache.incrementQueryCount(userKey, 'day');
                await this.cache.incrementQueryCount(userKey, 'minute');

                return {
                    content: streamed.content,
                    dealIds: streamed.dealIds || [],
                    cached: false,
                    toolResults,
                    usage: { totalTokens: 0 },
                    cost: 0,
                    model
                };
            }

            // First call (non-streaming to handle tools)
            const firstResponse = await createChatCompletion({
                model,
                messages,
                tools: TOOL_DEFINITIONS,
                stream: false
            });

            let totalContent = '';
            let totalTokens = firstResponse.usage?.totalTokens || 0;
            let totalCost = firstResponse.cost || 0;

            // Handle tool calls
            if (firstResponse.toolCalls && firstResponse.toolCalls.length > 0) {
                toolResults = await executeToolCalls(firstResponse.toolCalls);

                // Send deal/coupon data
                let dealsForContext = [];
                for (const [id, result] of Object.entries(toolResults)) {
                    if (result.deals && result.deals.length > 0) {
                        onChunk({ type: 'deals', deals: result.deals });
                        dealsForContext.push(...result.deals);
                    }
                    if (result.coupons && result.coupons.length > 0) {
                        onChunk({ type: 'coupons', coupons: result.coupons });
                    }
                }

                // Add deals context to messages for final response
                if (dealsForContext.length > 0) {
                    const dealsContext = `\n\nDEALS FOUND (extract Deal IDs and include in your JSON response's "dealIds" array):\n${formatDealsForContext(dealsForContext)}\n\nRemember: Return ONLY JSON with message and dealIds array containing the Deal IDs listed above.`;
                    messages[messages.length - 1].content += dealsContext;
                }

                // Stream final response
                const toolMessages = this.buildToolResultMessages(firstResponse.toolCalls, toolResults);

                const streamResult = await createChatCompletion({
                    model,
                    messages: [...messages,
                    { role: 'assistant', content: null, tool_calls: firstResponse.toolCalls },
                    ...toolMessages
                    ],
                    stream: true
                });

                if (!streamResult || !streamResult.stream) {
                    console.error('[AI] Stream result is invalid:', streamResult);
                    onChunk({ type: 'error', error: 'Failed to initialize stream. Please try again.' });
                    return { content: totalContent, error: 'Stream initialization failed' };
                }

                // Parse stream and accumulate content
                const streamed = await parseStream(streamResult, (chunk) => {
                    onChunk(chunk);
                });

                // Send dealIds if present in the parsed response
                if (streamed.dealIds && streamed.dealIds.length > 0) {
                    onChunk({ type: 'dealIds', dealIds: streamed.dealIds });
                }

                totalContent = streamed.content || '';
            } else {
                // No tools, just send the response
                totalContent = firstResponse.content || '';
                onChunk({ type: 'text', content: totalContent });
            }

            onChunk({ type: 'done', cached: false });

            // Update rate limits
            await this.cache.incrementQueryCount(userKey, 'day');
            await this.cache.incrementQueryCount(userKey, 'minute');

            // Return accumulated content for logging
            return {
                content: totalContent,
                cached: false,
                toolResults,
                usage: { totalTokens },
                cost: totalCost,
                model
            };

        } catch (error) {
            console.error('[AI] Stream error:', error);
            onChunk({ type: 'error', error: 'Something went wrong. Please try again.' });
            return { content: '', error: error.message };
        }
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

        // Add relevant history (limited), filtering out empty/null content
        const relevantHistory = history
            .filter(msg => msg && msg.content && typeof msg.content === 'string' && msg.content.trim())
            .slice(-AI_CONFIG.limits.maxConversationHistory);

        for (const msg of relevantHistory) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        return messages;
    }

    /**
     * Build tool result messages
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

            return {
                role: 'tool',
                tool_call_id: call.id,
                content
            };
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
            usage: {
                tokensUsed,
                estimatedCost: cost
            }
        };

        // Extract deals/coupons from tool results for frontend
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
        return {
            success: false,
            error: message,
            requestId,
            statusCode
        };
    }

    /**
     * Handle fallback when AI fails
     */
    async handleFallback(message, requestId, startTime, originalError) {
        console.log('[AI] Attempting fallback...');

        try {
            // Try to extract a search query and return basic results
            const classification = await classifyIntent(message);
            const query = classification.entities?.query || message;

            // Execute a basic search
            const { executeTool } = await import('./tools.js');
            const searchResult = await executeTool('search_deals', { query, sort_by: 'popular' });

            if (searchResult.success && searchResult.deals.length > 0) {
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
            console.error('[AI] Fallback also failed:', fallbackError.message);
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
            const openaiHealthy = await healthCheck();

            return {
                healthy: openaiHealthy,
                cache: this.cache.getStats(),
                reason: openaiHealthy ? 'OK' : 'OpenAI connection failed'
            };
        } catch (error) {
            return { healthy: false, reason: error.message };
        }
    }
}

// Singleton instance
let orchestratorInstance = null;

/**
 * Get the orchestrator instance
 * @returns {AIOrchestrator}
 */
export function getOrchestrator() {
    if (!orchestratorInstance) {
        orchestratorInstance = new AIOrchestrator();
    }
    return orchestratorInstance;
}

export default { getOrchestrator, AIOrchestrator };
