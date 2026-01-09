/**
 * AI Configuration
 * Production-quality OpenAI configuration for SaveBucks AI Assistant
 * 
 * @version 2.0.0
 * @author SaveBucks Team
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Environment Variables
// ═══════════════════════════════════════════════════════════════════════════════

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate API key on startup
if (!OPENAI_API_KEY) {
  console.error('[AI Config] ❌ OPENAI_API_KEY is required but not set');
} else {
  console.log('[AI Config] ✅ OpenAI API key configured:', OPENAI_API_KEY.substring(0, 20) + '...');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Model Configuration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * OpenAI Model Definitions
 * Using GPT-5-nano as primary model for maximum cost efficiency
 */
export const MODELS = {
  // Ultra-cheap nano model for most queries
  simple: process.env.AI_MODEL_SIMPLE || 'gpt-5-nano',

  // More capable model for complex reasoning (fallback)
  complex: process.env.AI_MODEL_COMPLEX || 'gpt-4o-mini',

  // Embedding model for semantic search
  embedding: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small'
};

// ═══════════════════════════════════════════════════════════════════════════════
// Token Cost Estimates (per 1M tokens, USD)
// ═══════════════════════════════════════════════════════════════════════════════

export const TOKEN_COSTS = {
  'gpt-5-nano': { input: 0.05, output: 0.40 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'text-embedding-3-small': { input: 0.02, output: 0 }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Rate Limiting Configuration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rate limits per user type
 * These are application-level limits to prevent abuse
 * OpenAI has its own limits at the API level
 */
export const RATE_LIMITS = {
  guest: {
    perMinute: parseInt(process.env.AI_RATE_LIMIT_GUEST_MIN || '10', 10),
    perDay: parseInt(process.env.AI_RATE_LIMIT_GUEST_DAY || '2', 10)
  },
  authenticated: {
    perMinute: parseInt(process.env.AI_RATE_LIMIT_USER_MIN || '30', 10),
    perDay: parseInt(process.env.AI_RATE_LIMIT_USER_DAY || '200', 10)
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Cache Configuration
// ═══════════════════════════════════════════════════════════════════════════════

export const CACHE_CONFIG = {
  // Exact query match TTL (seconds)
  exactMatchTTL: parseInt(process.env.AI_CACHE_EXACT_TTL || '300', 10),       // 5 minutes

  // Semantic similarity match TTL (seconds)
  semanticMatchTTL: parseInt(process.env.AI_CACHE_SEMANTIC_TTL || '900', 10), // 15 minutes

  // Tool results cache TTL (seconds)
  toolResultsTTL: parseInt(process.env.AI_CACHE_TOOL_TTL || '120', 10),       // 2 minutes

  // Minimum similarity score for semantic cache hit (0-1)
  semanticThreshold: parseFloat(process.env.AI_CACHE_SEMANTIC_THRESHOLD || '0.92')
};

// ═══════════════════════════════════════════════════════════════════════════════
// Response Limits
// ═══════════════════════════════════════════════════════════════════════════════

export const LIMITS = {
  // Maximum characters in user input message
  maxInputLength: 2000,

  // Maximum messages to include in conversation context
  maxConversationHistory: 10,

  // Maximum results per tool call (deals, coupons, etc.)
  maxToolResults: 10,

  // Maximum output tokens for simple model
  maxTokensSimple: 1500,

  // Maximum output tokens for complex model
  maxTokensComplex: 4000,

  // Characters per streaming chunk
  streamingChunkSize: 50
};

// ═══════════════════════════════════════════════════════════════════════════════
// Feature Flags
// ═══════════════════════════════════════════════════════════════════════════════

export const FEATURES = {
  // Master switch for AI functionality
  enabled: process.env.AI_ENABLED !== 'false',

  // Enable streaming responses (SSE)
  streamingEnabled: process.env.AI_STREAMING_ENABLED !== 'false',

  // Enable response caching
  cachingEnabled: process.env.AI_CACHING_ENABLED !== 'false',

  // Enable detailed logging
  loggingEnabled: process.env.AI_LOGGING_ENABLED !== 'false'
};

// ═══════════════════════════════════════════════════════════════════════════════
// Intent Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * User intent categories for routing and response customization
 */
export const INTENTS = {
  SEARCH: 'search',         // Looking for deals
  COUPON: 'coupon',         // Looking for coupons
  COMPARE: 'compare',       // Comparing products
  ADVICE: 'advice',         // Should I buy now?
  TRENDING: 'trending',     // What's hot?
  STORE_INFO: 'store_info', // Info about a store
  HELP: 'help',             // Help/FAQ
  GENERAL: 'general'        // General conversation
};

// ═══════════════════════════════════════════════════════════════════════════════
// Complexity Levels
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPLEXITY = {
  SIMPLE: 'simple',   // Use fast model
  COMPLEX: 'complex'  // Use more capable model
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Configuration Object (for backwards compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_CONFIG = {
  provider: 'openai',
  models: MODELS,
  rateLimits: RATE_LIMITS,
  cache: CACHE_CONFIG,
  limits: LIMITS,
  features: FEATURES,
  intents: INTENTS,
  complexity: COMPLEXITY
};

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate that required configuration is present
 * @returns {boolean} True if configuration is valid
 */
export function validateConfig() {
  if (!OPENAI_API_KEY) {
    console.error('[AI Config] ❌ OPENAI_API_KEY environment variable is required');
    return false;
  }

  console.log('[AI Config] ✅ Configuration validated successfully');
  console.log('[AI Config]    → Primary model:', MODELS.simple);
  console.log('[AI Config]    → Rate limits (auth):', RATE_LIMITS.authenticated.perMinute + '/min, ' + RATE_LIMITS.authenticated.perDay + '/day');
  return true;
}

/**
 * Get the API key (for client initialization)
 * @returns {string|null} API key or null if not set
 */
export function getApiKey() {
  return OPENAI_API_KEY || null;
}

/**
 * Estimate cost for a request based on token usage
 * @param {string} model - Model name
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Estimated cost in USD
 */
export function estimateCost(model, inputTokens, outputTokens) {
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS['gpt-5-nano'];
  return (inputTokens / 1_000_000 * costs.input) + (outputTokens / 1_000_000 * costs.output);
}

/**
 * Check if AI is enabled and properly configured
 * @returns {boolean} True if AI can be used
 */
export function isEnabled() {
  return FEATURES.enabled && !!OPENAI_API_KEY;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default Export
// ═══════════════════════════════════════════════════════════════════════════════

export default AI_CONFIG;
