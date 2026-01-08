/**
 * AI Client Wrapper
 * Supports both OpenAI and Google Gemini with unified interface
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG, AI_PROVIDERS, getActiveProvider, estimateCost } from './config.js';

// Client instances
let openaiClient = null;
let geminiClient = null;
let openrouterClient = null;

/**
 * Get or create the OpenAI client instance
 */
function getOpenAIClient() {
    if (openaiClient) return openaiClient;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    openaiClient = new OpenAI({
        apiKey,
        organization: process.env.OPENAI_ORG_ID || undefined,
        timeout: 30000,
        maxRetries: 2
    });

    return openaiClient;
}

/**
 * Get or create the OpenRouter client instance (using OpenAI SDK)
 */
function getOpenRouterClient() {
    if (openrouterClient) return openrouterClient;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    openrouterClient = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        timeout: 60000, // Slightly longer timeout for OpenRouter
        maxRetries: 2,
        defaultHeaders: {
            'HTTP-Referer': process.env.VITE_SITE_URL || 'http://localhost:5173',
            'X-Title': 'SaveBucks'
        }
    });

    return openrouterClient;
}

/**
 * Get or create the Gemini client instance
 */
function getGeminiClient() {
    if (geminiClient) return geminiClient;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    geminiClient = new GoogleGenerativeAI(apiKey);
    return geminiClient;
}

/**
 * Custom error class for AI errors
 */
export class AIError extends Error {
    constructor(message, code, statusCode = 500, retryable = false) {
        super(message);
        this.name = 'AIError';
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = retryable;
    }
}

/**
 * Convert OpenAI tool definitions to Gemini format
 */
function convertToolsToGemini(tools) {
    if (!tools || tools.length === 0) return null;

    return [{
        functionDeclarations: tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
        }))
    }];
}

/**
 * Create chat completion with OpenAI
 */
async function createOpenAICompletion({
    model,
    messages,
    tools,
    stream,
    maxTokens,
    temperature
}) {
    const client = getOpenAIClient();
    if (!client) {
        throw new AIError('OpenAI client not initialized', 'CONFIG_ERROR');
    }

    const startTime = Date.now();

    try {
        const requestBody = {
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            stream
        };

        if (tools && tools.length > 0) {
            requestBody.tools = tools;
            requestBody.tool_choice = 'auto';
        }

        if (stream) {
            const streamResponse = await client.chat.completions.create(requestBody);
            return {
                stream: streamResponse,
                model,
                startTime,
                provider: AI_PROVIDERS.OPENAI
            };
        }

        const response = await client.chat.completions.create(requestBody);
        const latencyMs = Date.now() - startTime;
        const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };
        const cost = estimateCost(model, usage.prompt_tokens, usage.completion_tokens);

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
            model,
            provider: AI_PROVIDERS.OPENAI
        };
    } catch (error) {
        throw handleOpenAIError(error);
    }
}

/**
 * Create chat completion with OpenRouter
 */
async function createOpenRouterCompletion({
    model,
    messages,
    tools,
    stream,
    maxTokens,
    temperature
}) {
    const client = getOpenRouterClient();
    if (!client) {
        throw new AIError('OpenRouter client not initialized', 'CONFIG_ERROR');
    }

    const startTime = Date.now();

    try {
        const requestBody = {
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            stream
        };

        // DeepSeek free models (and some others) via OpenRouter don't support tools or cause errors
        // specifically check for deepseek or free models that are known to fail with tools
        const isToolIncompatible = model.includes('deepseek') || model.includes(':free');

        if (tools && tools.length > 0 && !isToolIncompatible) {
            requestBody.tools = tools;
            requestBody.tool_choice = 'auto';
        }

        if (stream) {
            console.log('[AI Client] Requesting OpenRouter stream...');
            try {
                const streamResponse = await client.chat.completions.create(requestBody);
                const isIterable = !!streamResponse?.[Symbol.asyncIterator];
                console.log('[AI Client] OpenRouter stream received. Is iterable?', isIterable);

                if (!streamResponse) {
                    throw new AIError('OpenRouter returned undefined stream response', 'STREAM_ERROR');
                }

                if (!isIterable) {
                    console.warn('[AI Client] Stream response is not iterable. Response type:', typeof streamResponse);
                    throw new AIError('OpenRouter stream is not iterable', 'STREAM_ERROR');
                }

                return {
                    stream: streamResponse,
                    model,
                    startTime,
                    provider: AI_PROVIDERS.OPENROUTER
                };
            } catch (error) {
                console.error('[AI Client] OpenRouter stream error:', error);
                throw handleOpenAIError(error);
            }
        }

        const response = await client.chat.completions.create(requestBody);
        const latencyMs = Date.now() - startTime;
        const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };
        // Pass 0 cost for free models primarily, estimateCost handles custom logic
        const cost = estimateCost(model, usage.prompt_tokens, usage.completion_tokens);

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
            model,
            provider: AI_PROVIDERS.OPENROUTER
        };
    } catch (error) {
        // OpenRouter errors are generally compatible with OpenAI error handling
        throw handleOpenAIError(error);
    }
}

/**
 * Create chat completion with Gemini
 */
async function createGeminiCompletion({
    model,
    messages,
    tools,
    stream,
    maxTokens,
    temperature
}) {
    const client = getGeminiClient();
    if (!client) {
        throw new AIError('Gemini client not initialized', 'CONFIG_ERROR');
    }

    const startTime = Date.now();

    try {
        // Convert messages to Gemini format, filtering out empty content
        const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
        const chatMessages = messages
            .filter(m => m.role !== 'system' && m.content && m.content.trim())
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        // Get the generative model
        const genModel = client.getGenerativeModel({
            model,
            systemInstruction,
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature
            }
        });

        // Add tools if provided
        const generationConfig = {};
        if (tools && tools.length > 0) {
            genModel.tools = convertToolsToGemini(tools);
        }

        // Ensure we have at least one message
        if (chatMessages.length === 0) {
            throw new AIError('No valid messages to send', 'INVALID_REQUEST', 400);
        }

        // Get history (all but last) and current message (last)
        const history = chatMessages.length > 1 ? chatMessages.slice(0, -1) : [];
        const lastMessage = chatMessages[chatMessages.length - 1]?.parts[0]?.text || '';

        if (!lastMessage.trim()) {
            throw new AIError('Message cannot be empty', 'INVALID_REQUEST', 400);
        }

        if (stream) {
            // Streaming response
            const chat = genModel.startChat({ history });
            const streamResult = await chat.sendMessageStream(lastMessage);

            return {
                stream: streamResult.stream,
                model,
                startTime,
                provider: AI_PROVIDERS.GEMINI
            };
        }

        // Non-streaming response
        const chat = genModel.startChat({ history });
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;

        const latencyMs = Date.now() - startTime;
        const text = response.text();

        // Extract function calls if any
        let toolCalls = null;
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            toolCalls = functionCalls.map((fc, index) => ({
                id: `call_${index}`,
                type: 'function',
                function: {
                    name: fc.name,
                    arguments: JSON.stringify(fc.args)
                }
            }));
        }

        // Estimate tokens (Gemini doesn't always return exact counts)
        const inputTokens = Math.ceil(messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) / 4);
        const outputTokens = Math.ceil(text.length / 4);
        const cost = estimateCost(model, inputTokens, outputTokens);

        return {
            content: text,
            toolCalls,
            finishReason: response.candidates?.[0]?.finishReason || 'stop',
            usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens
            },
            cost,
            latencyMs,
            model,
            provider: AI_PROVIDERS.GEMINI
        };
    } catch (error) {
        throw handleGeminiError(error);
    }
}

/**
 * Make a chat completion request - automatically uses correct provider with fallback
 */
export async function createChatCompletion({
    model = null,
    messages,
    tools = null,
    stream = false,
    maxTokens = AI_CONFIG.limits.maxTokensSimple,
    temperature = 0.7,
    responseFormat = null
}) {
    const provider = getActiveProvider();

    if (!provider) {
        throw new AIError('No AI provider configured', 'CONFIG_ERROR');
    }

    // Use appropriate model if not specified
    const actualModel = model || AI_CONFIG.models.simple;

    // OpenRouter with fallback to Gemini
    if (provider === AI_PROVIDERS.OPENROUTER) {
        try {
            return await createOpenRouterCompletion({
                model: actualModel,
                messages,
                tools,
                stream,
                maxTokens,
                temperature
            });
        } catch (error) {
            console.warn('[AI Client] OpenRouter failed, attempting fallback...', error.message);

            // Check if Gemini is available as fallback
            const geminiKey = process.env.GEMINI_API_KEY;
            if (geminiKey) {
                console.log('[AI Client] Falling back to Gemini...');
                try {
                    const geminiModel = stream ? 'gemini-2.0-flash-exp' : 'gemini-1.5-pro-latest';
                    return await createGeminiCompletion({
                        model: geminiModel,
                        messages,
                        tools,
                        stream,
                        maxTokens,
                        temperature
                    });
                } catch (geminiError) {
                    console.error('[AI Client] Gemini fallback also failed:', geminiError.message);
                    throw error; // Throw original error
                }
            }

            // No fallback available
            throw error;
        }
    } else if (provider === AI_PROVIDERS.OPENAI) {
        return createOpenAICompletion({
            model: actualModel,
            messages,
            tools,
            stream,
            maxTokens,
            temperature
        });
    } else if (provider === AI_PROVIDERS.GEMINI) {
        return createGeminiCompletion({
            model: actualModel,
            messages,
            tools,
            stream,
            maxTokens,
            temperature
        });
    }

    throw new AIError(`Unknown provider: ${provider}`, 'CONFIG_ERROR');
}

/**
 * Parse OpenAI stream
 */
async function parseOpenAIStream(stream, onChunk) {
    let content = '';
    let thinkingContent = '';
    let toolCalls = [];
    let finishReason = null;
    let insideThinkBlock = false;

    if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
        console.warn('[AI Client] Invalid stream object received:', stream);
        return { content: '', toolCalls: null, finishReason: 'error' };
    }

    try {
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            finishReason = chunk.choices[0]?.finish_reason || finishReason;

            if (delta?.content) {
                let text = delta.content;

                // Handle <think> block detection and filtering
                // Check for opening tag
                if (text.includes('<think>')) {
                    insideThinkBlock = true;
                    const parts = text.split('<think>');
                    // Send the part before <think> as regular text
                    if (parts[0] && onChunk) {
                        content += parts[0];
                        onChunk({ type: 'text', content: parts[0] });
                    }
                    // The rest goes to thinking
                    thinkingContent += parts.slice(1).join('');
                    if (onChunk) {
                        onChunk({ type: 'thinking', content: parts.slice(1).join('') });
                    }
                    continue;
                }

                // Check for closing tag
                if (text.includes('</think>')) {
                    insideThinkBlock = false;
                    const parts = text.split('</think>');
                    // Part before </think> is still thinking
                    thinkingContent += parts[0];
                    if (onChunk) {
                        onChunk({ type: 'thinking', content: parts[0] });
                    }
                    // Part after </think> is regular text
                    if (parts[1]) {
                        content += parts[1];
                        if (onChunk) {
                            onChunk({ type: 'text', content: parts[1] });
                        }
                    }
                    continue;
                }

                // If inside think block, accumulate as thinking
                if (insideThinkBlock) {
                    thinkingContent += text;
                    if (onChunk) {
                        onChunk({ type: 'thinking', content: text });
                    }
                } else {
                    // Regular content
                    content += text;
                    if (onChunk) {
                        onChunk({ type: 'text', content: text });
                    }
                }
            }

            // Capture reasoning/thought process if provided in separate field (DeepSeek)
            const reasoning = delta?.reasoning || delta?.reasoning_content;
            if (reasoning) {
                // This is explicit reasoning from the model - send as thinking type
                thinkingContent += reasoning;
                if (onChunk) {
                    onChunk({ type: 'thinking', content: reasoning });
                }
            }

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

        // Try to parse content as JSON (AI returns JSON format)
        let parsedContent = content;
        let dealIds = [];

        try {
            // Aggressively remove all reasoning/thinking blocks (DeepSeek R1 and similar models)
            let jsonStr = content.trim();

            // Remove all types of reasoning blocks (case insensitive, multiline)
            jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');
            jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
            jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
            jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '');
            jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '');

            // Remove reasoning text patterns (common in DeepSeek R1)
            // Remove everything before the first { if it contains reasoning keywords
            const reasoningPatterns = [
                /^[\s\S]*?(?=We are given)/i,
                /^[\s\S]*?(?=According to)/i,
                /^[\s\S]*?(?=However, note)/i,
                /^[\s\S]*?(?=But note)/i,
                /^[\s\S]*?(?=Therefore)/i,
                /^[\s\S]*?(?=Final response)/i,
                /^[\s\S]*?(?=Proposed message)/i
            ];

            // Find the first { and remove everything before it if it looks like reasoning
            const firstBraceIndex = jsonStr.indexOf('{');
            if (firstBraceIndex > 50) { // If there's a lot of text before the JSON
                // Check if it contains reasoning patterns
                const textBefore = jsonStr.substring(0, firstBraceIndex);
                if (reasoningPatterns.some(pattern => pattern.test(textBefore)) ||
                    textBefore.toLowerCase().includes('we are given') ||
                    textBefore.toLowerCase().includes('according to') ||
                    textBefore.toLowerCase().includes('however, note')) {
                    jsonStr = jsonStr.substring(firstBraceIndex);
                }
            }

            // Remove any markdown code blocks if present
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            // Find the JSON object - look for the first { and last }
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

                // Try to parse
                const parsed = JSON.parse(jsonStr);
                if (parsed && typeof parsed === 'object' && parsed.message) {
                    parsedContent = parsed.message;
                    dealIds = Array.isArray(parsed.dealIds) ? parsed.dealIds : [];
                }
            } else {
                // If no braces found, try to extract JSON from the end of the string
                const jsonAtEnd = jsonStr.match(/\{[^}]*"message"[^}]*\}/);
                if (jsonAtEnd) {
                    const parsed = JSON.parse(jsonAtEnd[0]);
                    if (parsed.message) {
                        parsedContent = parsed.message;
                        dealIds = parsed.dealIds || [];
                    }
                }
            }
        } catch (e) {
            // Not JSON, try to extract message field from content
            console.log('[AI Client] JSON parse failed, attempting extraction:', e.message);

            // Try multiple extraction patterns
            const patterns = [
                /"message"\s*:\s*"([^"]+)"/,
                /message["\s]*:\s*["']([^"']+)["']/,
                /message:\s*([^\n,}]+)/
            ];

            for (const pattern of patterns) {
                const match = content.match(pattern);
                if (match && match[1]) {
                    parsedContent = match[1].trim();
                    break;
                }
            }

            // Extract dealIds if present
            const dealIdsMatch = content.match(/"dealIds"\s*:\s*\[([^\]]*)\]/);
            if (dealIdsMatch) {
                try {
                    dealIds = JSON.parse('[' + dealIdsMatch[1] + ']');
                } catch (e) {
                    dealIds = [];
                }
            }
        }

        return {
            content: parsedContent,
            dealIds,
            toolCalls: toolCalls.length > 0 ? toolCalls : null,
            finishReason
        };
    } catch (error) {
        throw handleOpenAIError(error);
    }
}

/**
 * Parse Gemini stream
 */
async function parseGeminiStream(stream, onChunk) {
    let content = '';

    try {
        for await (const chunk of stream) {
            const text = chunk.text();
            if (text) {
                content += text;
                if (onChunk) {
                    onChunk({ type: 'text', content: text });
                }
            }
        }

        // Try to parse content as JSON (AI returns JSON format)
        let parsedContent = content;
        let dealIds = [];

        try {
            // Remove reasoning/thinking blocks first
            let jsonStr = content.trim();
            jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');
            jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
            jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

            // Remove any markdown code blocks if present
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            // Try to find JSON object - look for the first { and last }
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                const parsed = JSON.parse(jsonStr);
                if (parsed.message) {
                    parsedContent = parsed.message;
                    dealIds = parsed.dealIds || [];
                }
            }
        } catch (e) {
            // Not JSON, use content as-is (but try to clean it)
            console.log('[AI Client] Content is not JSON, using as plain text');
            const messageMatch = content.match(/"message"\s*:\s*"([^"]+)"/);
            if (messageMatch) {
                parsedContent = messageMatch[1];
            }
        }

        return {
            content: parsedContent,
            dealIds,
            toolCalls: null, // Gemini streaming doesn't support tool calls yet
            finishReason: 'stop'
        };
    } catch (error) {
        throw handleGeminiError(error);
    }
}

/**
 * Parse a streamed response - handles both providers
 */
export async function parseStream(streamResult, onChunk) {
    if (streamResult.provider === AI_PROVIDERS.GEMINI) {
        return parseGeminiStream(streamResult.stream, onChunk);
    }
    return parseOpenAIStream(streamResult.stream, onChunk);
}

/**
 * Create embeddings (OpenAI only for now, Gemini embedding is different)
 */
export async function createEmbedding(input) {
    const provider = getActiveProvider();

    if (provider === AI_PROVIDERS.OPENAI) {
        const client = getOpenAIClient();
        if (!client) {
            throw new AIError('OpenAI client not initialized', 'CONFIG_ERROR');
        }

        const startTime = Date.now();

        try {
            const response = await client.embeddings.create({
                model: AI_CONFIG.models.embedding,
                input: Array.isArray(input) ? input : [input]
            });

            const latencyMs = Date.now() - startTime;
            const usage = response.usage || { prompt_tokens: 0 };
            const cost = estimateCost(AI_CONFIG.models.embedding, usage.prompt_tokens, 0);

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
            throw handleOpenAIError(error);
        }
    } else if (provider === AI_PROVIDERS.GEMINI) {
        const client = getGeminiClient();
        if (!client) {
            throw new AIError('Gemini client not initialized', 'CONFIG_ERROR');
        }

        const startTime = Date.now();

        try {
            const model = client.getGenerativeModel({ model: 'text-embedding-004' });
            const texts = Array.isArray(input) ? input : [input];
            const embeddings = [];

            for (const text of texts) {
                const result = await model.embedContent(text);
                embeddings.push(result.embedding.values);
            }

            const latencyMs = Date.now() - startTime;
            const inputTokens = Math.ceil(texts.join('').length / 4);

            return {
                embeddings,
                usage: {
                    inputTokens,
                    totalTokens: inputTokens
                },
                cost: estimateCost('text-embedding-004', inputTokens, 0),
                latencyMs
            };
        } catch (error) {
            throw handleGeminiError(error);
        }
    }

    throw new AIError('No provider available for embeddings', 'CONFIG_ERROR');
}

/**
 * Handle OpenAI errors
 */
function handleOpenAIError(error) {
    console.error('[AI Client] OpenAI error:', error.message);

    if (error.status === 429) {
        return new AIError('Rate limit exceeded. Please try again in a moment.', 'RATE_LIMIT', 429, true);
    }
    if (error.status === 401) {
        return new AIError('AI service authentication failed.', 'AUTH_ERROR', 500, false);
    }
    if (error.status === 400) {
        return new AIError('Invalid request to AI service.', 'INVALID_REQUEST', 400, false);
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return new AIError('AI service timed out. Please try again.', 'TIMEOUT', 504, true);
    }

    return new AIError('AI service error. Please try again.', 'UNKNOWN_ERROR', 500, true);
}

/**
 * Handle Gemini errors
 */
function handleGeminiError(error) {
    console.error('[AI Client] Gemini error:', error.message);

    if (error.message?.includes('429') || error.message?.includes('quota')) {
        return new AIError('Rate limit exceeded. Please try again in a moment.', 'RATE_LIMIT', 429, true);
    }
    if (error.message?.includes('401') || error.message?.includes('API key')) {
        return new AIError('AI service authentication failed.', 'AUTH_ERROR', 500, false);
    }
    if (error.message?.includes('400') || error.message?.includes('invalid')) {
        return new AIError('Invalid request to AI service.', 'INVALID_REQUEST', 400, false);
    }
    if (error.message?.includes('SAFETY')) {
        return new AIError('Request was filtered. Please rephrase your question.', 'CONTENT_FILTER', 400, false);
    }

    return new AIError('AI service error. Please try again.', 'UNKNOWN_ERROR', 500, true);
}

/**
 * Health check for AI connection
 */
export async function healthCheck() {
    const provider = getActiveProvider();

    if (!provider) {
        return { healthy: false, reason: 'No AI provider configured', provider: null };
    }

    try {
        if (provider === AI_PROVIDERS.OPENROUTER) {
            const client = getOpenRouterClient();
            if (!client) return { healthy: false, reason: 'OpenRouter client not initialized', provider };

            const response = await client.chat.completions.create({
                model: 'deepseek/deepseek-r1-0528:free', // Use free model for health check
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            });

            return { healthy: !!response.choices[0], provider, reason: 'OK' };
        } else if (provider === AI_PROVIDERS.OPENAI) {
            const client = getOpenAIClient();
            if (!client) return { healthy: false, reason: 'OpenAI client not initialized', provider };

            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            });

            return { healthy: !!response.choices[0], provider, reason: 'OK' };
        } else if (provider === AI_PROVIDERS.GEMINI) {
            const client = getGeminiClient();
            if (!client) return { healthy: false, reason: 'Gemini client not initialized', provider };

            const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent('Hi');
            const response = await result.response;

            return { healthy: !!response.text(), provider, reason: 'OK' };
        }
    } catch (error) {
        console.error('[AI Client] Health check failed:', error.message);
        return { healthy: false, reason: error.message, provider };
    }

    return { healthy: false, reason: 'Unknown provider', provider };
}

export default {
    createChatCompletion,
    createEmbedding,
    parseStream,
    healthCheck,
    AIError,
    getActiveProvider
};
