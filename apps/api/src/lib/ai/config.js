/**
 * AI Configuration
 * Central configuration for the AI system with dual-provider support (OpenAI + Gemini)
 */

// Detect which provider is available
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// Provider types
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  OPENROUTER: 'openrouter'
};

// Determine active provider based on available keys
export function getActiveProvider() {
  if (OPENROUTER_KEY) return AI_PROVIDERS.OPENROUTER; // Prioritize OpenRouter if available (user request)
  if (OPENAI_KEY) return AI_PROVIDERS.OPENAI;
  if (GEMINI_KEY) return AI_PROVIDERS.GEMINI;
  return null;
}

// Model configuration per provider
const PROVIDER_MODELS = {
  [AI_PROVIDERS.OPENAI]: {
    simple: process.env.AI_MODEL_SIMPLE || 'gpt-4o-mini',
    complex: process.env.AI_MODEL_COMPLEX || 'gpt-4o',
    embedding: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small'
  },
  [AI_PROVIDERS.GEMINI]: {
    // Use stable Gemini model names - flash-lite for simple, pro for complex
    simple: process.env.AI_MODEL_SIMPLE || 'gemini-2.0-flash-exp',
    complex: process.env.AI_MODEL_COMPLEX || 'gemini-1.5-pro-latest',
    embedding: process.env.AI_EMBEDDING_MODEL || 'text-embedding-004'
  },
  [AI_PROVIDERS.OPENROUTER]: {
    simple: process.env.AI_MODEL_SIMPLE || 'deepseek/deepseek-r1-0528:free', // Using simple model for now
    complex: process.env.AI_MODEL_COMPLEX || 'deepseek/deepseek-r1-0528:free', // User specified model
    embedding: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small' // Fallback to OpenAI or specific one
  }
};

// Token cost estimates per provider (per 1M tokens, in USD)
export const TOKEN_COSTS = {
  [AI_PROVIDERS.OPENAI]: {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'text-embedding-3-small': { input: 0.02, output: 0 }
  },
  [AI_PROVIDERS.GEMINI]: {
    'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro-latest': { input: 1.25, output: 5.00 },
    'text-embedding-004': { input: 0.025, output: 0 }
  },
  [AI_PROVIDERS.OPENROUTER]: {
    'deepseek/deepseek-r1-0528:free': { input: 0, output: 0 },
    // Add paid models if needed
    'deepseek/deepseek-chat': { input: 0.14, output: 0.28 }
  }
};

// Main configuration object
export const AI_CONFIG = {
  // Active provider (determined at runtime)
  get provider() {
    return getActiveProvider();
  },

  // Models (changes based on provider)
  get models() {
    const provider = getActiveProvider();
    return provider ? PROVIDER_MODELS[provider] : PROVIDER_MODELS[AI_PROVIDERS.OPENAI];
  },

  // Rate limits (per user/guest per day)
  rateLimits: {
    guest: {
      perMinute: parseInt(process.env.AI_RATE_LIMIT_GUEST_MIN || '5', 10),
      perDay: parseInt(process.env.AI_RATE_LIMIT_GUEST_DAY || '20', 10)
    },
    authenticated: {
      perMinute: parseInt(process.env.AI_RATE_LIMIT_USER_MIN || '20', 10),
      perDay: parseInt(process.env.AI_RATE_LIMIT_USER_DAY || '500', 10)
    }
  },

  // Cache TTLs (in seconds)
  cache: {
    exactMatch: parseInt(process.env.AI_CACHE_EXACT_TTL || '300', 10),      // 5 minutes
    semanticMatch: parseInt(process.env.AI_CACHE_SEMANTIC_TTL || '900', 10), // 15 minutes
    toolResults: parseInt(process.env.AI_CACHE_TOOL_TTL || '120', 10),       // 2 minutes
    semanticThreshold: parseFloat(process.env.AI_CACHE_SEMANTIC_THRESHOLD || '0.92')
  },

  // Response limits
  limits: {
    maxInputLength: 2000,           // Max characters in user message
    maxConversationHistory: 10,     // Max messages to include in context
    maxToolResults: 10,             // Max results per tool call
    maxTokensSimple: 2000,          // Max output tokens for simple model (increased for R1)
    maxTokensComplex: 4000,         // Max output tokens for complex model
    streamingChunkSize: 50          // Characters per streaming chunk
  },

  // Feature flags
  features: {
    enabled: process.env.AI_ENABLED !== 'false',
    streamingEnabled: process.env.AI_STREAMING_ENABLED !== 'false',
    cachingEnabled: process.env.AI_CACHING_ENABLED !== 'false',
    loggingEnabled: process.env.AI_LOGGING_ENABLED !== 'false'
  },

  // Intent types
  intents: {
    SEARCH: 'search',           // Looking for deals
    COUPON: 'coupon',           // Looking for coupons
    COMPARE: 'compare',         // Comparing products
    ADVICE: 'advice',           // Should I buy now?
    TRENDING: 'trending',       // What's hot?
    STORE_INFO: 'store_info',   // Info about a store
    HELP: 'help',               // Help/FAQ
    GENERAL: 'general'          // General conversation
  },

  // Complexity classification
  complexity: {
    SIMPLE: 'simple',
    COMPLEX: 'complex'
  }
};

// Validate required environment variables
export function validateConfig() {
  const provider = getActiveProvider();

  if (!provider) {
    console.warn('[AI] No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY');
    return false;
  }

  console.log(`[AI] Using provider: ${provider.toUpperCase()}`);
  return true;
}

// Get cost estimate for a request
export function estimateCost(model, inputTokens, outputTokens) {
  const provider = getActiveProvider() || AI_PROVIDERS.OPENAI;
  const costs = TOKEN_COSTS[provider]?.[model] || { input: 0.15, output: 0.60 };
  return (inputTokens / 1000000 * costs.input) + (outputTokens / 1000000 * costs.output);
}

export default AI_CONFIG;
