/**
 * AI Intent Classifier
 * Determines user intent and complexity for optimal model selection
 */

import { createChatCompletion, AIError } from './client.js';
import { INTENTS, COMPLEXITY, MODELS, LIMITS } from './config.js';
import { CLASSIFICATION_PROMPT, FAQ_RESPONSES } from './prompts.js';

/**
 * Keyword-based intent detection (fast, no LLM needed)
 * Returns intent if confident, null otherwise
 */
const KEYWORD_PATTERNS = {
    [INTENTS.SEARCH]: [
        /\b(find|search|looking for|show me|get me|deals?|products?|where to buy)\b/i,
        /\b(suggest|recommend|give me|any|some)\s+\w+/i,  // "suggest me shoes", "any shirts", "some laptops"
        /\b(suggest|recommend)\b/i,  // Just "suggest" or "recommend"
        /\b(under|below|less than|cheaper than)\s*\$?\d+/i,
        /\b(best|top|good)\s+(deals?|prices?|offers?)/i,
        /\b(shirt|shoes?|laptop|phone|tv|headphones?|watch|dress|jacket|bag|home|kitchen|clean)/i  // Common product words
    ],
    [INTENTS.COUPON]: [
        /\b(coupon|promo|discount)\s*(code)?s?\b/i,
        /\b(code|codes)\s+(for|at)\b/i,
        /\boff\s+code\b/i
    ],
    [INTENTS.COMPARE]: [
        /\b(compare|vs|versus|or|better|difference between)\b/i,
        /\bwhich\s+(is|one|should)\b/i
    ],
    [INTENTS.ADVICE]: [
        /\b(should i|is it|good time|worth|wait|buy now)\b/i,
        /\b(price (drop|going|will)|when to buy)\b/i
    ],
    [INTENTS.TRENDING]: [
        /\b(trending|popular|hot|best|top)\s*(deals?|today|now|this week)?\b/i,
        /\bwhat'?s?\s+(hot|trending|popular)\b/i
    ],
    [INTENTS.STORE_INFO]: [
        /\b(tell me about|info about|how is|is .+ (good|reliable|legit))\b/i,
        /\b(store|company|retailer)\s+(info|information|details)\b/i
    ],
    [INTENTS.HELP]: [
        /\b(how (do i|to|can i)|what can you|help|tutorial)\b/i,
        /\b(features?|capabilities|functions?)\b/i
    ]
};

/**
 * Complexity indicators
 */
const COMPLEX_INDICATORS = [
    /\b(compare|vs|versus|better|difference)\b/i,
    /\b(should i|is it worth|good time|wait|buy now)\b/i,
    /\b(analyze|analysis|in-?depth|detailed)\b/i,
    /\b(predict|prediction|forecast|will the price)\b/i,
    /\b(why|how come|explain|reasoning)\b/i
];

/**
 * Extract entities from query using regex patterns
 * @param {string} query - User query
 * @returns {Object} Extracted entities
 */
function extractEntities(query) {
    const entities = {
        query: query,
        store: null,
        category: null,
        maxPrice: null,
        minDiscount: null
    };

    // Extract price limits
    const priceMatch = query.match(/\b(?:under|below|less than|max|up to)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (priceMatch) {
        entities.maxPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    // Extract discount percentage
    const discountMatch = query.match(/\b(\d+)\s*%\s*off\b/i);
    if (discountMatch) {
        entities.minDiscount = parseInt(discountMatch[1], 10);
    }

    // Extract store names (common retailers)
    const stores = ['amazon', 'walmart', 'target', 'best buy', 'costco', 'ebay',
        'newegg', 'home depot', 'lowes', 'macys', 'nordstrom', 'kohls',
        'doordash', 'ubereats', 'grubhub', 'instacart', 'gamestop'];
    for (const store of stores) {
        if (query.toLowerCase().includes(store)) {
            entities.store = store;
            break;
        }
    }

    // Extract categories
    const categories = {
        'laptop': 'electronics', 'computer': 'electronics', 'phone': 'electronics',
        'tv': 'electronics', 'television': 'electronics', 'headphone': 'electronics',
        'tablet': 'electronics', 'camera': 'electronics', 'gaming': 'electronics',
        'clothes': 'fashion', 'shoes': 'fashion', 'jacket': 'fashion', 'dress': 'fashion',
        'furniture': 'home', 'kitchen': 'home', 'appliance': 'home', 'mattress': 'home',
        'makeup': 'beauty', 'skincare': 'beauty', 'perfume': 'beauty',
        'toy': 'toys', 'lego': 'toys', 'game': 'toys',
        'food': 'food', 'grocery': 'food', 'restaurant': 'food',
        'flight': 'travel', 'hotel': 'travel', 'vacation': 'travel'
    };

    for (const [keyword, category] of Object.entries(categories)) {
        if (query.toLowerCase().includes(keyword)) {
            entities.category = category;
            break;
        }
    }

    // Clean up query for search
    entities.query = query
        .replace(/\b(find|search|show me|get me|looking for)\b/gi, '')
        .replace(/\b(deals?|coupons?|codes?|offers?)\b/gi, '')
        .replace(/\b(under|below|less than|max|up to)\s*\$?\d+/gi, '')
        .replace(/\b(for me|please|thanks?)\b/gi, '')
        .trim();

    return entities;
}

/**
 * Fast keyword-based classification (no LLM)
 * @param {string} query - User query
 * @returns {Object|null} Classification result or null if uncertain
 */
function classifyByKeywords(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Check FAQ first
    const faqResponse = FAQ_RESPONSES.match(query);
    if (faqResponse) {
        return {
            intent: INTENTS.HELP,
            complexity: COMPLEXITY.SIMPLE,
            entities: extractEntities(query),
            confidence: 1.0,
            faqResponse
        };
    }

    // Check keyword patterns
    let matches = [];
    for (const [intent, patterns] of Object.entries(KEYWORD_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(normalizedQuery)) {
                matches.push(intent);
                break;
            }
        }
    }

    // If exactly one intent matched with high confidence
    if (matches.length === 1) {
        const intent = matches[0];

        // Determine complexity
        let complexity = COMPLEXITY.SIMPLE;
        for (const pattern of COMPLEX_INDICATORS) {
            if (pattern.test(normalizedQuery)) {
                complexity = COMPLEXITY.COMPLEX;
                break;
            }
        }

        return {
            intent,
            complexity,
            entities: extractEntities(query),
            confidence: 0.8,
            faqResponse: null
        };
    }

    // Uncertain - need LLM
    return null;
}

/**
 * LLM-based classification (more accurate but costs tokens)
 * @param {string} query - User query
 * @returns {Promise<Object>} Classification result
 */
async function classifyByLLM(query) {
    try {
        const response = await createChatCompletion({
            model: MODELS.simple, // Use cheap model for classification
            messages: [
                { role: 'system', content: CLASSIFICATION_PROMPT + '\n\nRespond with JSON only, no markdown. Do not include reasoning or <think> blocks in the output if possible.' },
                { role: 'user', content: query }
            ],
            maxTokens: 2000, // Increased for reasoning models that need space to "think" before outputting JSON
            temperature: 0.1 // Low temperature for consistency
            // Note: responseFormat not used - Gemini doesn't support it
        });

        // Validate response content
        if (!response || !response.content || typeof response.content !== 'string') {
            console.warn('[Classifier] Empty or invalid response from LLM');
            throw new Error('Empty response from LLM');
        }

        // Extract JSON from response (may be wrapped in markdown code blocks)
        let jsonStr = response.content.trim();

        // If empty after trim, throw error
        if (!jsonStr) {
            console.warn('[Classifier] Empty response content after trimming');
            throw new Error('Empty response content');
        }

        console.log('[Classifier] Raw LLM response length:', jsonStr.length);

        // Remove <think> blocks from reasoning models (DeepSeek R1)
        // Handle case where closing tag is missing (truncated)
        if (jsonStr.includes('<think>')) {
            if (!jsonStr.includes('</think>')) {
                console.warn('[Classifier] Response truncated during reasoning phase - incomplete <think> block');
                // Try to extract everything after the unclosed <think> block
                const thinkStartIndex = jsonStr.lastIndexOf('<think>');
                if (thinkStartIndex !== -1) {
                    jsonStr = jsonStr.substring(0, thinkStartIndex).trim();
                }
            }
            jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        }
        jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim();

        // Remove markdown code blocks if present
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Try to find JSON object in the response
        const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            jsonStr = objectMatch[0].trim();
        }

        // Final validation before parsing
        if (!jsonStr || jsonStr.length === 0) {
            console.warn('[Classifier] No JSON found in response:', response.content.substring(0, 200));
            throw new Error('No JSON content found in response');
        }

        // Check if JSON looks truncated (common indicators)
        const isTruncated = !jsonStr.endsWith('}') ||
            (jsonStr.match(/\{/g) || []).length !== (jsonStr.match(/\}/g) || []).length;

        if (isTruncated) {
            console.warn('[Classifier] JSON appears truncated:', jsonStr);
            // Try to auto-complete simple cases for entities object
            if (jsonStr.includes('"entities"') && !jsonStr.includes('}}}')) {
                // Try to close nested objects
                const openBraces = (jsonStr.match(/\{/g) || []).length;
                const closeBraces = (jsonStr.match(/\}/g) || []).length;
                const missing = openBraces - closeBraces;
                if (missing > 0 && missing <= 3) {
                    jsonStr += '}'.repeat(missing);
                    console.log('[Classifier] Attempted auto-repair by adding', missing, 'closing braces');
                }
            }
        }

        // Parse JSON response with better error handling
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('[Classifier] JSON parse error. Content:', jsonStr);
            console.error('[Classifier] Parse error details:', parseError.message);
            throw new Error(`Invalid JSON: ${parseError.message}`);
        }

        // Validate parsed object has expected structure
        if (!parsed || typeof parsed !== 'object') {
            console.warn('[Classifier] Parsed response is not an object:', typeof parsed);
            throw new Error('Parsed response is not an object');
        }

        return {
            intent: parsed.intent || INTENTS.GENERAL,
            complexity: parsed.complexity || COMPLEXITY.SIMPLE,
            entities: {
                ...extractEntities(query),
                ...(parsed.entities || {})
            },
            confidence: 0.9,
            faqResponse: null,
            tokensUsed: response.usage?.totalTokens || 0,
            cost: response.cost
        };
    } catch (error) {
        console.error('[Classifier] LLM classification failed:', error.message);
        if (error.response) {
            console.error('[Classifier] Response status:', error.response.status);
            console.error('[Classifier] Response data:', error.response.data);
        }

        // Fallback to default
        return {
            intent: INTENTS.SEARCH,
            complexity: COMPLEXITY.SIMPLE,
            entities: extractEntities(query),
            confidence: 0.5,
            faqResponse: null,
            error: error.message
        };
    }
}

/**
 * Classify user intent
 * Uses fast keyword matching first, falls back to LLM if uncertain
 * @param {string} query - User query
 * @param {boolean} [forceLLM=false] - Force LLM classification
 * @returns {Promise<Object>} Classification result
 */
export async function classifyIntent(query, forceLLM = false) {
    if (!query || typeof query !== 'string') {
        return {
            intent: INTENTS.GENERAL,
            complexity: COMPLEXITY.SIMPLE,
            entities: {},
            confidence: 0,
            error: 'Invalid query'
        };
    }

    const trimmedQuery = query.trim();

    // Check length
    if (trimmedQuery.length > LIMITS.maxInputLength) {
        return {
            intent: INTENTS.GENERAL,
            complexity: COMPLEXITY.SIMPLE,
            entities: {},
            confidence: 0,
            error: 'Query too long'
        };
    }

    // Try fast keyword classification first
    if (!forceLLM) {
        const keywordResult = classifyByKeywords(trimmedQuery);
        if (keywordResult) {
            return keywordResult;
        }
    }

    // Try LLM classification with retry
    let lastError = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await classifyByLLM(trimmedQuery);
            // If we got a valid result without error, return it
            if (!result.error) {
                return result;
            }
            lastError = result.error;
        } catch (err) {
            console.warn(`[Classifier] LLM attempt ${attempt}/${maxRetries} failed:`, err.message);
            lastError = err.message;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }

    // All retries failed - use keyword classification as fallback
    console.warn('[Classifier] All LLM attempts failed, using keyword fallback');
    const keywordFallback = classifyByKeywords(trimmedQuery);
    if (keywordFallback) {
        return {
            ...keywordFallback,
            confidence: 0.6, // Lower confidence since LLM failed
            fallbackReason: lastError
        };
    }

    // Final fallback: SEARCH intent
    return {
        intent: INTENTS.SEARCH,
        complexity: COMPLEXITY.SIMPLE,
        entities: extractEntities(trimmedQuery),
        confidence: 0.4,
        faqResponse: null,
        fallbackReason: lastError
    };
}

/**
 * Determine which model to use based on classification
 * @param {Object} classification - Classification result
 * @returns {string} Model name
 */
export function selectModel(classification) {
    // Always use complex model for these intents
    const complexIntents = [
        INTENTS.COMPARE,
        INTENTS.ADVICE
    ];

    if (complexIntents.includes(classification.intent)) {
        return MODELS.complex;
    }

    if (classification.complexity === COMPLEXITY.COMPLEX) {
        return MODELS.complex;
    }

    return MODELS.simple;
}

export default {
    classifyIntent,
    selectModel,
    extractEntities
};
