/**
 * OpenAI Client
 * Production-quality OpenAI API client for SaveBucks AI Assistant
 * 
 * Features:
 * - Streaming and non-streaming responses
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Tool/function calling support
 * - Cost tracking
 * 
 * @version 2.0.0
 * @author SaveBucks Team
 */

import OpenAI from 'openai';
import { AI_CONFIG, MODELS, estimateCost, getApiKey, LIMITS } from './config.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;  // 60 seconds timeout

// ═══════════════════════════════════════════════════════════════════════════════
// Client Instance
// ═══════════════════════════════════════════════════════════════════════════════

let openaiClient = null;

/**
 * Get or create the OpenAI client instance
 * @returns {OpenAI|null} OpenAI client or null if not configured
 */
function getClient() {
    if (openaiClient) return openaiClient;

    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('[AI Client] ❌ OpenAI API key not configured');
        return null;
    }

    openaiClient = new OpenAI({
        apiKey,
        organization: process.env.OPENAI_ORG_ID || undefined,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: 0 // We handle retries ourselves
    });

    console.log('[AI Client] ✅ OpenAI client initialized');
    return openaiClient;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error Classes
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Custom error class for AI-related errors
 */
export class AIError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} code - Error code (RATE_LIMIT, TIMEOUT, AUTH_ERROR, etc.)
     * @param {number} statusCode - HTTP status code
     * @param {boolean} retryable - Whether the error is retryable
     * @param {number} retryAfter - Seconds to wait before retry (for rate limits)
     */
    constructor(message, code, statusCode = 500, retryable = false, retryAfter = 0) {
        super(message);
        this.name = 'AIError';
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.retryAfter = retryAfter;
    }
}

/**
 * Error codes
 */
export const ERROR_CODES = {
    RATE_LIMIT: 'RATE_LIMIT',
    TIMEOUT: 'TIMEOUT',
    AUTH_ERROR: 'AUTH_ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    MODEL_ERROR: 'MODEL_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    CONFIG_ERROR: 'CONFIG_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function getRetryDelay(attempt, baseDelay = INITIAL_RETRY_DELAY_MS) {
    // Exponential backoff: 1s, 2s, 4s with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 500;
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
}

/**
 * Convert OpenAI API error to AIError
 * @param {Error} error - Original error
 * @returns {AIError} Standardized error
 */
function handleError(error) {
    console.error('[AI Client] Error:', error.message);

    // Rate limit error
    if (error.status === 429) {
        // Cap retry-after to 30 seconds to avoid excessive waits
        const rawRetryAfter = parseInt(error.headers?.['retry-after'] || '30', 10);
        const retryAfter = Math.min(rawRetryAfter, 30);
        return new AIError(
            'Rate limit exceeded. Please wait a moment before trying again.',
            ERROR_CODES.RATE_LIMIT,
            429,
            true,
            retryAfter
        );
    }

    // Authentication error
    if (error.status === 401) {
        return new AIError(
            'AI service authentication failed.',
            ERROR_CODES.AUTH_ERROR,
            401,
            false
        );
    }

    // Bad request
    if (error.status === 400) {
        return new AIError(
            error.message || 'Invalid request to AI service.',
            ERROR_CODES.INVALID_REQUEST,
            400,
            false
        );
    }

    // Model/service errors
    if (error.status === 500 || error.status === 503) {
        return new AIError(
            'AI service is temporarily unavailable.',
            ERROR_CODES.MODEL_ERROR,
            error.status,
            true,
            5
        );
    }

    // Timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return new AIError(
            'Request timed out. Please try again.',
            ERROR_CODES.TIMEOUT,
            504,
            true
        );
    }

    // Network error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new AIError(
            'Network error. Please check your connection.',
            ERROR_CODES.NETWORK_ERROR,
            503,
            true
        );
    }

    // Unknown error
    return new AIError(
        'An unexpected error occurred. Please try again.',
        ERROR_CODES.UNKNOWN_ERROR,
        500,
        true
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main API Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a chat completion (non-streaming)
 * 
 * @param {Object} options - Request options
 * @param {string} [options.model] - Model to use (defaults to simple model)
 * @param {Array} options.messages - Messages array
 * @param {Array} [options.tools] - Tool definitions for function calling
 * @param {number} [options.maxTokens] - Maximum tokens to generate
 * @param {number} [options.temperature] - Temperature (0-2)
 * @param {boolean} [options.stream] - Whether to stream the response
 * @returns {Promise<Object>} Completion result
 */
export async function createChatCompletion({
    model = null,
    messages,
    tools = null,
    maxTokens = LIMITS.maxTokensSimple,
    temperature = 0.7,
    stream = false
}) {
    const client = getClient();
    if (!client) {
        throw new AIError('OpenAI client not initialized', ERROR_CODES.CONFIG_ERROR, 500, false);
    }

    const actualModel = model || MODELS.simple;
    const startTime = Date.now();

    console.log('[AI Client] Creating chat completion');
    console.log('[AI Client]   → Model:', actualModel);
    console.log('[AI Client]   → Messages:', messages.length);
    console.log('[AI Client]   → Stream:', stream);

    // Build request body - gpt-5 models have different parameter requirements
    const isGpt5Model = actualModel.startsWith('gpt-5');
    const requestBody = {
        model: actualModel,
        messages,
        stream
    };

    // gpt-5-nano only supports default temperature (1.0), so don't set it
    // Other models can use custom temperature
    if (!isGpt5Model) {
        requestBody.temperature = temperature;
    }

    // Use correct token limit parameter based on model
    if (isGpt5Model) {
        requestBody.max_completion_tokens = maxTokens;
    } else {
        requestBody.max_tokens = maxTokens;
    }

    if (tools && tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
    }

    // Retry loop
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            if (stream) {
                // Streaming response
                const streamResponse = await client.chat.completions.create(requestBody);
                return {
                    stream: streamResponse,
                    model: actualModel,
                    startTime
                };
            }

            // Non-streaming response
            const response = await client.chat.completions.create(requestBody);
            const latencyMs = Date.now() - startTime;
            const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };
            const cost = estimateCost(actualModel, usage.prompt_tokens, usage.completion_tokens);

            console.log('[AI Client] ✅ Completion received in', latencyMs, 'ms');

            return {
                content: response.choices[0]?.message?.content || '',
                toolCalls: response.choices[0]?.message?.tool_calls || null,
                finishReason: response.choices[0]?.finish_reason,
                usage: {
                    inputTokens: usage.prompt_tokens,
                    outputTokens: usage.completion_tokens,
                    totalTokens: usage.total_tokens
                },
                cost,
                latencyMs,
                model: actualModel
            };

        } catch (error) {
            lastError = handleError(error);

            // Don't retry non-retryable errors
            if (!lastError.retryable) {
                throw lastError;
            }

            // Don't retry on last attempt
            if (attempt === MAX_RETRIES - 1) {
                throw lastError;
            }

            // Wait before retry
            const delay = lastError.retryAfter > 0
                ? lastError.retryAfter * 1000
                : getRetryDelay(attempt);

            console.log(`[AI Client] Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(delay);
        }
    }

    throw lastError || new AIError('Max retries exceeded', ERROR_CODES.UNKNOWN_ERROR, 500, false);
}

/**
 * Parse a streaming response
 * 
 * @param {Object} streamResult - Result from createChatCompletion with stream=true
 * @param {Function} onChunk - Callback for each chunk { type: 'text'|'thinking'|'tool_call', content: string }
 * @returns {Promise<Object>} Final parsed result { content, toolCalls, dealIds }
 */
export async function parseStream(streamResult, onChunk) {
    const { stream, startTime } = streamResult;

    let content = '';
    let toolCalls = [];
    let finishReason = null;

    // Validate stream
    if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
        console.error('[AI Client] Invalid stream object received');
        return { content: '', toolCalls: null, finishReason: 'error' };
    }

    try {
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            finishReason = chunk.choices[0]?.finish_reason || finishReason;

            // Handle text content
            if (delta?.content) {
                content += delta.content;
                if (onChunk) {
                    onChunk({ type: 'text', content: delta.content });
                }
            }

            // Handle tool calls
            if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index;
                    if (!toolCalls[index]) {
                        toolCalls[index] = {
                            id: toolCall.id,
                            type: 'function',
                            function: { name: '', arguments: '' }
                        };
                    }
                    if (toolCall.function?.name) {
                        toolCalls[index].function.name += toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        toolCalls[index].function.arguments += toolCall.function.arguments;
                    }
                }
            }
        }

        // Parse JSON response if present
        let parsedContent = content;
        let dealIds = [];

        try {
            let jsonStr = content.trim();

            // Remove markdown code blocks if present
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            // Find JSON object
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                const parsed = JSON.parse(jsonStr);

                if (parsed.message) {
                    parsedContent = parsed.message;
                    dealIds = Array.isArray(parsed.dealIds) ? parsed.dealIds : [];
                }
            }
        } catch {
            // Not JSON, use content as-is
            console.log('[AI Client] Response is not JSON, using raw content');
        }

        const latencyMs = Date.now() - startTime;
        console.log('[AI Client] ✅ Stream completed in', latencyMs, 'ms');

        return {
            content: parsedContent,
            dealIds,
            toolCalls: toolCalls.length > 0 ? toolCalls : null,
            finishReason
        };

    } catch (error) {
        throw handleError(error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Embeddings
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create embeddings for text
 * 
 * @param {string|string[]} input - Text to embed
 * @returns {Promise<Object>} Embedding result { embeddings, usage, cost, latencyMs }
 */
export async function createEmbedding(input) {
    const client = getClient();
    if (!client) {
        throw new AIError('OpenAI client not initialized', ERROR_CODES.CONFIG_ERROR, 500, false);
    }

    const startTime = Date.now();

    try {
        const response = await client.embeddings.create({
            model: MODELS.embedding,
            input: Array.isArray(input) ? input : [input]
        });

        const latencyMs = Date.now() - startTime;
        const usage = response.usage || { prompt_tokens: 0 };
        const cost = estimateCost(MODELS.embedding, usage.prompt_tokens, 0);

        return {
            embeddings: response.data.map(d => d.embedding),
            usage: {
                inputTokens: usage.prompt_tokens,
                totalTokens: usage.total_tokens
            },
            cost,
            latencyMs
        };
    } catch (error) {
        throw handleError(error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Health Check
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if OpenAI API is reachable and working
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
    const startTime = Date.now();

    try {
        const client = getClient();
        if (!client) {
            return {
                healthy: false,
                error: 'OpenAI client not configured',
                latencyMs: 0
            };
        }

        // Make a minimal API call to check connectivity
        const response = await client.chat.completions.create({
            model: MODELS.simple,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
        });

        const latencyMs = Date.now() - startTime;

        return {
            healthy: true,
            model: MODELS.simple,
            latencyMs,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        const latencyMs = Date.now() - startTime;
        const aiError = handleError(error);

        return {
            healthy: false,
            error: aiError.message,
            code: aiError.code,
            retryable: aiError.retryable,
            latencyMs
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    createChatCompletion,
    createEmbedding,
    parseStream,
    healthCheck,
    AIError,
    ERROR_CODES
};
