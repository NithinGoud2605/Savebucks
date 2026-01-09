/**
 * AI Chat Routes
 * Handles all AI chat endpoints with SSE streaming support
 */

import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getOrchestrator } from '../lib/ai/index.js';
import { getCache } from '../lib/ai/cache.js';
import { AI_CONFIG } from '../lib/ai/config.js';
import { makeAdminClient } from '../lib/supa.js';
import { log } from '../lib/logger.js';
import { logChatInteraction, logStreamingStart, logStreamingEnd, getRecentLogs, LOG_FILE } from '../lib/ai/chatLogger.js';

const router = Router();
const supabase = makeAdminClient();

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const chatSchema = z.object({
    message: z.string()
        .min(1, 'Message is required')
        .max(AI_CONFIG.limits.maxInputLength, 'Message too long'),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
    })).optional(),
    conversationId: z.string().uuid().optional(),
    context: z.object({
        currentPage: z.string().optional(),
        viewedDeals: z.array(z.string()).optional()
    }).optional()
});

const feedbackSchema = z.object({
    messageId: z.string().uuid(),
    rating: z.enum(['positive', 'negative']),
    comment: z.string().max(500).optional()
});

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract user info for rate limiting
 */
function getUserKey(req) {
    if (req.user?.id) {
        return `u:${req.user.id}`;
    }
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
        || req.ip
        || 'unknown';
    return `ip:${ip}`;
}

/**
 * AI Rate limit middleware
 */
async function aiRateLimit(req, res, next) {
    const cache = getCache();
    const userKey = getUserKey(req);

    const rateCheck = await cache.checkRateLimit(userKey);

    if (rateCheck.limited) {
        return res.status(429).json({
            success: false,
            error: rateCheck.message,
            retryAfter: rateCheck.retryAfter
        });
    }

    req.rateInfo = rateCheck;
    next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Main chat endpoint with SSE streaming
 */
router.post('/chat', aiRateLimit, async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Validate request
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            success: false,
            error: parseResult.error.errors[0].message,
            requestId
        });
    }

    const { message, history: clientHistory, conversationId, context } = parseResult.data;
    const userId = req.user?.id || null;

    log(`[AI] Chat request: "${message.slice(0, 50)}..." (user: ${userId || 'guest'})`);

    try {
        const orchestrator = getOrchestrator();

        // Get conversation history - prefer client history, fall back to DB
        let history = [];
        if (clientHistory && clientHistory.length > 0) {
            // Use history from client (for same-session context)
            history = clientHistory.slice(-AI_CONFIG.limits.maxConversationHistory);
            log(`[AI] Using ${history.length} messages from client history`);
        } else if (conversationId) {
            // Fall back to database for persistent conversations
            history = await getConversationHistory(conversationId, userId);
            log(`[AI] Loaded ${history.length} messages from database`);
        }

        // Check if streaming is requested
        const acceptsEventStream = req.headers.accept?.includes('text/event-stream');

        if (acceptsEventStream && AI_CONFIG.features.streamingEnabled) {
            // SSE Streaming response
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Request-Id', requestId);
            res.flushHeaders();

            let streamedContent = '';

            const sendEvent = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
                // Accumulate content for logging
                if (data.type === 'text' && data.content) {
                    streamedContent += data.content;
                }
            };

            // Log streaming start
            logStreamingStart({
                requestId,
                userId,
                input: message,
                metadata: {
                    conversationId,
                    streaming: true
                }
            }).catch(console.error);

            let streamResult = null;
            try {
                streamResult = await orchestrator.chatStream(
                    {
                        message,
                        userId,
                        history,
                        context: { ...context, ip: getUserKey(req) }
                    },
                    sendEvent
                );

                // Log streaming end with final content
                logStreamingEnd({
                    requestId,
                    userId,
                    input: message,
                    output: streamResult?.content || streamedContent || '[No content captured]',
                    metadata: {
                        conversationId,
                        streaming: true,
                        ...(streamResult?.usage && { tokensUsed: streamResult.usage.totalTokens }),
                        ...(streamResult?.cost !== undefined && { cost: streamResult.cost }),
                        ...(streamResult?.model && { model: streamResult.model }),
                        ...(streamResult?.cached && { cached: streamResult.cached })
                    }
                }).catch(console.error);
            } catch (streamError) {
                // Log error if streaming fails
                logStreamingEnd({
                    requestId,
                    userId,
                    input: message,
                    output: `[ERROR: ${streamError.message}]`,
                    metadata: {
                        conversationId,
                        streaming: true,
                        error: streamError.message
                    }
                }).catch(console.error);
                throw streamError;
            }

            // Save to conversation history
            if (conversationId || userId) {
                // Wait for save to ensure persistence
                await saveMessage(conversationId, userId, message, 'user').catch(console.error);
                res.end();

                // Also save assistant message with complete deals/coupons data
                if (streamResult) {
                    const assistantMetadata = {
                        // Store full deal data for cross-device retrieval
                        deals: streamResult.deals?.map(d => ({
                            id: d.id,
                            title: d.title,
                            price: d.price,
                            original_price: d.original_price,
                            discount_percentage: d.discount_percentage,
                            merchant: d.merchant,
                            image_url: d.image_url,
                            url: d.url
                        })) || [],
                        // Store full coupon data
                        coupons: streamResult.coupons?.map(c => ({
                            id: c.id,
                            title: c.title,
                            coupon_code: c.coupon_code,
                            discount_type: c.discount_type,
                            discount_value: c.discount_value,
                            company: c.company
                        })) || [],
                        // Also keep dealIds for quick lookup
                        dealIds: streamResult.deals?.map(d => d.id) || []
                    };
                    await saveMessage(conversationId, userId, streamResult.content || streamedContent, 'assistant', assistantMetadata).catch(console.error);
                }
            }

            // res.end() moved up
        } else {
            // Non-streaming response
            const response = await orchestrator.chat({
                message,
                userId,
                history,
                context: { ...context, ip: getUserKey(req) }
            });

            // Log the interaction (fire and forget)
            logChatInteraction({
                requestId,
                userId,
                input: message,
                output: response.success ? response.content : `[ERROR: ${response.error}]`,
                metadata: {
                    conversationId,
                    success: response.success,
                    streaming: false,
                    latencyMs: response.latencyMs,
                    cached: response.cached || false,
                    ...(response.intent && { intent: response.intent }),
                    ...(response.usage && { tokensUsed: response.usage.totalTokens }),
                    ...(response.cost !== undefined && { cost: response.cost }),
                    ...(response.model && { model: response.model }),
                    ...(response.error && { error: response.error })
                }
            }).catch(console.error);

            if (!response.success) {
                return res.status(response.statusCode || 500).json(response);
            }

            // Save to conversation history
            if (conversationId || userId) {
                saveMessage(conversationId, userId, message, 'user').catch(console.error);
                // Save assistant message with complete deals/coupons data
                const assistantMetadata = {
                    deals: response.deals?.map(d => ({
                        id: d.id,
                        title: d.title,
                        price: d.price,
                        original_price: d.original_price,
                        discount_percentage: d.discount_percentage,
                        merchant: d.merchant,
                        image_url: d.image_url,
                        url: d.url
                    })) || [],
                    coupons: response.coupons?.map(c => ({
                        id: c.id,
                        title: c.title,
                        coupon_code: c.coupon_code,
                        discount_type: c.discount_type,
                        discount_value: c.discount_value,
                        company: c.company
                    })) || [],
                    dealIds: response.deals?.map(d => d.id) || []
                };
                saveMessage(conversationId, userId, response.content, 'assistant', assistantMetadata).catch(console.error);
            }

            res.json(response);
        }

    } catch (error) {
        log(`[AI] Error: ${error.message}`);
        console.error('[AI Route] Error:', error);

        // Surface specific error messages for known error types
        let errorMessage = 'Something went wrong. Please try again.';
        let statusCode = 500;

        if (error.code === 'RATE_LIMIT') {
            errorMessage = 'AI is busy right now. Please wait a moment and try again.';
            statusCode = error.statusCode || 429;
        } else if (error.code === 'TIMEOUT') {
            errorMessage = 'Request took too long. Please try again.';
            statusCode = 504;
        } else if (error.code === 'AUTH_ERROR') {
            errorMessage = 'AI service is temporarily unavailable.';
            statusCode = 503;
        } else if (error.code === 'INVALID_REQUEST') {
            errorMessage = error.message || 'Invalid request. Please try rephrasing your question.';
            statusCode = 400;
        } else if (error.retryable) {
            errorMessage = 'AI service hiccup. Please try again in a moment.';
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            requestId,
            retryable: error.retryable || false
        });
    }
});

/**
 * GET /api/ai/chat
 * SSE streaming endpoint (alternative to POST for easier integration)
 */
router.get('/chat', aiRateLimit, async (req, res) => {
    const message = req.query.message;
    const conversationId = req.query.conversationId;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Message query parameter is required'
        });
    }

    if (message.length > AI_CONFIG.limits.maxInputLength) {
        return res.status(400).json({
            success: false,
            error: 'Message too long'
        });
    }

    const userId = req.user?.id || null;
    const requestId = uuidv4();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Request-Id', requestId);
    res.flushHeaders();

    let streamedContent = '';

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        // Accumulate content for logging
        if (data.type === 'text' && data.content) {
            streamedContent += data.content;
        }
    };

    // Log streaming start
    logStreamingStart({
        requestId,
        userId,
        input: message,
        metadata: {
            conversationId,
            streaming: true,
            method: 'GET'
        }
    }).catch(console.error);

    try {
        const orchestrator = getOrchestrator();

        let history = [];
        if (conversationId) {
            history = await getConversationHistory(conversationId, userId);
        }

        const streamResult = await orchestrator.chatStream(
            {
                message,
                userId,
                history,
                context: { ip: getUserKey(req) }
            },
            sendEvent
        );

        // Log streaming end
        logStreamingEnd({
            requestId,
            userId,
            input: message,
            output: streamResult?.content || streamedContent || '[No content captured]',
            metadata: {
                conversationId,
                streaming: true,
                method: 'GET',
                ...(streamResult?.cached && { cached: streamResult.cached })
            }
        }).catch(console.error);

    } catch (error) {
        console.error('[AI Route] SSE Error:', error);

        // Surface specific error messages for known error types
        let errorMessage = 'Something went wrong.';
        if (error.code === 'RATE_LIMIT') {
            errorMessage = 'AI is busy right now. Please wait a moment and try again.';
        } else if (error.code === 'TIMEOUT') {
            errorMessage = 'Request took too long. Please try again.';
        } else if (error.code === 'AUTH_ERROR') {
            errorMessage = 'AI service is temporarily unavailable.';
        } else if (error.retryable) {
            errorMessage = 'AI service hiccup. Please try again in a moment.';
        }

        sendEvent({ type: 'error', error: errorMessage });

        // Log error
        logStreamingEnd({
            requestId,
            userId,
            input: message,
            output: `[ERROR: ${error.message}]`,
            metadata: {
                conversationId,
                streaming: true,
                method: 'GET',
                error: error.message
            }
        }).catch(console.error);
    }

    res.end();
});

/**
 * GET /api/ai/conversations
 * Get user's conversation history
 */
router.get('/conversations', async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    try {
        const { data: conversations, error } = await supabase
            .from('ai_conversations')
            .select('id, title, created_at, updated_at, message_count')
            .eq('user_id', req.user.id)
            .eq('is_archived', false)
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({
            success: true,
            conversations: conversations || []
        });
    } catch (error) {
        console.error('[AI Route] Get conversations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load conversations'
        });
    }
});

/**
 * GET /api/ai/conversations/:id
 * Get a specific conversation with messages
 */
router.get('/conversations/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    try {
        // Get conversation
        const { data: conversation, error: convError } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (convError || !conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Get messages
        const { data: messages, error: msgError } = await supabase
            .from('ai_messages')
            .select('id, role, content, metadata, created_at')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        // Use deals from metadata directly, or fallback to DB lookup for older messages
        const messagesWithDeals = await Promise.all((messages || []).map(async (msg) => {
            // If metadata already has full deal objects (new format), use them directly
            if (msg.metadata?.deals?.length > 0) {
                return {
                    ...msg,
                    deals: msg.metadata.deals,
                    coupons: msg.metadata.coupons || []
                };
            }
            // Fallback: fetch from DB for older messages that only have dealIds
            if (msg.metadata?.dealIds?.length > 0) {
                try {
                    const { data: deals } = await supabase
                        .from('deals')
                        .select('id, title, price, original_price, discount_percentage, merchant, image_url, url')
                        .in('id', msg.metadata.dealIds);
                    return { ...msg, deals: deals || [] };
                } catch (e) {
                    console.error('[AI Route] Failed to fetch deals for message:', e);
                    return msg;
                }
            }
            return msg;
        }));

        res.json({
            success: true,
            conversation,
            messages: messagesWithDeals
        });
    } catch (error) {
        console.error('[AI Route] Get conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load conversation'
        });
    }
});

/**
 * POST /api/ai/conversations
 * Create a new conversation
 */
router.post('/conversations', async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    try {
        const { data: conversation, error } = await supabase
            .from('ai_conversations')
            .insert({
                user_id: req.user.id,
                title: 'New Conversation'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('[AI Route] Create conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create conversation'
        });
    }
});

/**
 * DELETE /api/ai/conversations/:id
 * Delete a conversation
 */
router.delete('/conversations/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    try {
        const { error } = await supabase
            .from('ai_conversations')
            .update({ is_archived: true })
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('[AI Route] Delete conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete conversation'
        });
    }
});

/**
 * POST /api/ai/feedback
 * Submit feedback on an AI response
 */
router.post('/feedback', async (req, res) => {
    const parseResult = feedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            success: false,
            error: parseResult.error.errors[0].message
        });
    }

    const { messageId, rating, comment } = parseResult.data;

    try {
        // First get the current metadata
        const { data: message } = await supabase
            .from('ai_messages')
            .select('metadata')
            .eq('id', messageId)
            .single();

        // Merge feedback into metadata
        const updatedMetadata = {
            ...(message?.metadata || {}),
            feedback: {
                rating,
                comment: comment || null,
                at: new Date().toISOString()
            }
        };

        // Update with merged metadata
        const { error } = await supabase
            .from('ai_messages')
            .update({ metadata: updatedMetadata })
            .eq('id', messageId);

        // Don't error if this fails - feedback is non-critical
        if (error) {
            console.error('[AI Route] Feedback save error:', error);
        }

        res.json({ success: true });
    } catch (error) {
        // Fail silently for feedback
        res.json({ success: true });
    }
});

/**
 * GET /api/ai/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const orchestrator = getOrchestrator();
        const health = await orchestrator.healthCheck();

        res.status(health.healthy ? 200 : 503).json({
            success: health.healthy,
            ...health
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/stats
 * Get AI usage statistics (admin only)
 */
router.get('/stats', async (req, res) => {
    // TODO: Add admin check

    try {
        const cache = getCache();
        const stats = cache.getStats();

        res.json({
            success: true,
            cache: stats,
            config: {
                models: AI_CONFIG.models,
                rateLimits: AI_CONFIG.rateLimits,
                features: AI_CONFIG.features
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/logs
 * Get recent AI chat logs with pagination (for debugging/admin viewing)
 */
router.get('/logs', async (req, res) => {
    // TODO: Add admin check in production

    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor || null;
        const result = await getRecentLogs(limit, cursor);

        res.json({
            success: true,
            logs: result.logs,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
            total: result.total,
            count: result.logs.length,
            logFile: LOG_FILE
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/ai/cleanup
 * Clean up old messages (30-day retention)
 * This should be called by a scheduled job or admin
 */
router.delete('/cleanup', async (req, res) => {
    // TODO: Add admin check in production

    try {
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const cutoffISO = cutoffDate.toISOString();

        // Delete old messages
        const { count: messagesDeleted, error: msgError } = await supabase
            .from('ai_messages')
            .delete()
            .lt('created_at', cutoffISO)
            .select('count');

        if (msgError) {
            console.error('[AI Cleanup] Messages delete error:', msgError);
        }

        // Delete empty/old conversations
        const { count: convsDeleted, error: convError } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('message_count', 0)
            .lt('updated_at', cutoffISO)
            .select('count');

        if (convError) {
            console.error('[AI Cleanup] Conversations delete error:', convError);
        }

        console.log(`[AI Cleanup] Deleted ${messagesDeleted || 0} messages, ${convsDeleted || 0} empty conversations`);

        res.json({
            success: true,
            messagesDeleted: messagesDeleted || 0,
            conversationsDeleted: convsDeleted || 0,
            cutoffDate: cutoffISO
        });
    } catch (error) {
        console.error('[AI Cleanup] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId, userId) {
    try {
        // First verify ownership
        if (userId) {
            const { data: conv } = await supabase
                .from('ai_conversations')
                .select('id')
                .eq('id', conversationId)
                .eq('user_id', userId)
                .single();

            if (!conv) return [];
        }

        const { data: messages, error } = await supabase
            .from('ai_messages')
            .select('role, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(AI_CONFIG.limits.maxConversationHistory);

        if (error) {
            console.error('[AI Route] History fetch error:', error);
            return [];
        }

        return messages || [];
    } catch (error) {
        console.error('[AI Route] History error:', error);
        return [];
    }
}

/**
 * Save a message to conversation history
 * @param {string} conversationId - Conversation ID (optional)
 * @param {string} userId - User ID
 * @param {string} content - Message content
 * @param {string} role - 'user' or 'assistant'
 * @param {Object} metadata - Optional metadata (dealIds, coupons, etc.)
 */
async function saveMessage(conversationId, userId, content, role, metadata = null) {
    try {
        // Create conversation if needed
        let convId = conversationId;

        if (!convId && userId) {
            const { data: newConv } = await supabase
                .from('ai_conversations')
                .insert({
                    user_id: userId,
                    title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
                })
                .select('id')
                .single();

            convId = newConv?.id;
        }

        if (!convId) return;

        // Save message with optional metadata
        await supabase
            .from('ai_messages')
            .insert({
                conversation_id: convId,
                role,
                content,
                metadata: metadata || null
            });

        // Get current message count
        const { data: conv } = await supabase
            .from('ai_conversations')
            .select('message_count')
            .eq('id', convId)
            .single();

        // Update conversation with incremented count
        await supabase
            .from('ai_conversations')
            .update({
                updated_at: new Date().toISOString(),
                message_count: (conv?.message_count || 0) + 1
            })
            .eq('id', convId);

    } catch (error) {
        console.error('[AI Route] Save message error:', error);
    }
}

export default router;
