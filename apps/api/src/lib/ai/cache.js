/**
 * AI Cache Layer
 * Multi-layer caching for AI responses to minimize LLM costs
 */

import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { FEATURES, CACHE_CONFIG, RATE_LIMITS } from './config.js';

// Redis client for distributed caching
let redis = null;

// In-memory cache for local/fallback
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 1000;

/**
 * Initialize Redis connection
 */
function getRedis() {
    if (redis) return redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        redis = new Redis({ url, token });
        console.log('[AI Cache] Redis connected');
    } else {
        console.log('[AI Cache] Using in-memory cache (Redis not configured)');
    }

    return redis;
}

/**
 * Generate hash for cache key
 * @param {string} input - Input string to hash
 * @returns {string} SHA256 hash
 */
function hash(input) {
    return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex').slice(0, 32);
}

/**
 * Get item from memory cache with LRU eviction
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined
 */
function memGet(key) {
    if (!memoryCache.has(key)) return undefined;

    const item = memoryCache.get(key);

    // Check expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
        memoryCache.delete(key);
        return undefined;
    }

    // Move to end (LRU)
    memoryCache.delete(key);
    memoryCache.set(key, item);

    return item.value;
}

/**
 * Set item in memory cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 */
function memSet(key, value, ttlSeconds) {
    // Evict oldest if at capacity
    if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
    }

    memoryCache.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
    });
}

/**
 * AI Cache Manager
 */
class AICache {
    constructor() {
        this.redis = getRedis();
        this.prefix = 'ai:';
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
    }

    /**
     * Get cached response for a query
     * Checks exact match first, then tool results
     * @param {string} query - User query
     * @param {string} type - Cache type ('exact' | 'tool')
     * @returns {Promise<Object|null>} Cached response or null
     */
    async get(query, type = 'exact') {
        if (!FEATURES.cachingEnabled) return null;

        const key = `${this.prefix}${type}:${hash(query)}`;

        try {
            // Try Redis first
            if (this.redis) {
                const cached = await this.redis.get(key);
                if (cached) {
                    this.stats.hits++;
                    return typeof cached === 'string' ? JSON.parse(cached) : cached;
                }
            }

            // Fallback to memory
            const memCached = memGet(key);
            if (memCached) {
                this.stats.hits++;
                return memCached;
            }

            this.stats.misses++;
            return null;
        } catch (error) {
            console.error('[AI Cache] Get error:', error.message);
            return null;
        }
    }

    /**
     * Cache a response
     * @param {string} query - User query
     * @param {Object} response - Response to cache
     * @param {string} type - Cache type ('exact' | 'tool')
     * @param {number} [ttl] - TTL in seconds (uses config default if not specified)
     */
    async set(query, response, type = 'exact', ttl = null) {
        if (!FEATURES.cachingEnabled) return;

        const key = `${this.prefix}${type}:${hash(query)}`;
        const actualTtl = ttl || (type === 'exact'
            ? CACHE_CONFIG.exactMatchTTL
            : CACHE_CONFIG.toolResultsTTL);

        try {
            const value = JSON.stringify(response);

            // Set in Redis
            if (this.redis) {
                await this.redis.set(key, value, { ex: actualTtl });
            }

            // Also set in memory for faster access
            memSet(key, response, actualTtl);

            this.stats.sets++;
        } catch (error) {
            console.error('[AI Cache] Set error:', error.message);
        }
    }

    /**
     * Cache tool execution results
     * @param {string} toolName - Tool name
     * @param {Object} args - Tool arguments
     * @param {Object} result - Tool result
     */
    async setToolResult(toolName, args, result) {
        const key = `${toolName}:${JSON.stringify(args)}`;
        await this.set(key, result, 'tool', CACHE_CONFIG.toolResultsTTL);
    }

    /**
     * Get cached tool result
     * @param {string} toolName - Tool name
     * @param {Object} args - Tool arguments
     * @returns {Promise<Object|null>} Cached result or null
     */
    async getToolResult(toolName, args) {
        const key = `${toolName}:${JSON.stringify(args)}`;
        return this.get(key, 'tool');
    }

    /**
     * Increment query counter for rate limiting
     * @param {string} userId - User ID or IP
     * @param {string} period - 'minute' or 'day'
     * @returns {Promise<{count: number, remaining: number, reset: number}>}
     */
    async incrementQueryCount(userId, period = 'day') {
        const key = `${this.prefix}ratelimit:${period}:${userId}`;
        const ttl = period === 'minute' ? 60 : 86400;

        try {
            if (this.redis) {
                const count = await this.redis.incr(key);
                if (count === 1) {
                    await this.redis.expire(key, ttl);
                }

                const isGuest = userId.startsWith('ip:');
                const limits = isGuest
                    ? RATE_LIMITS.guest
                    : RATE_LIMITS.authenticated;
                const limit = period === 'minute' ? limits.perMinute : limits.perDay;

                return {
                    count,
                    remaining: Math.max(0, limit - count),
                    reset: Date.now() + (ttl * 1000)
                };
            }

            // Memory fallback
            const memKey = `ratelimit:${period}:${userId}`;
            let data = memGet(memKey);
            if (!data) {
                data = { count: 0, startTime: Date.now() };
            }

            data.count++;
            memSet(memKey, data, ttl);

            const isGuest = userId.startsWith('ip:');
            const limits = isGuest
                ? RATE_LIMITS.guest
                : RATE_LIMITS.authenticated;
            const limit = period === 'minute' ? limits.perMinute : limits.perDay;

            return {
                count: data.count,
                remaining: Math.max(0, limit - data.count),
                reset: data.startTime + (ttl * 1000)
            };
        } catch (error) {
            console.error('[AI Cache] Rate limit error:', error.message);
            return { count: 0, remaining: 999, reset: Date.now() + 60000 };
        }
    }

    /**
     * Check if user is rate limited
     * @param {string} userId - User ID or IP
     * @returns {Promise<{limited: boolean, message: string, retryAfter: number}>}
     */
    async checkRateLimit(userId) {
        const [minute, day] = await Promise.all([
            this.incrementQueryCount(userId, 'minute'),
            this.incrementQueryCount(userId, 'day')
        ]);

        // Decrement since we already incremented
        minute.count--;
        day.count--;

        const isGuest = userId.startsWith('ip:');
        const limits = isGuest
            ? RATE_LIMITS.guest
            : RATE_LIMITS.authenticated;

        if (minute.count >= limits.perMinute) {
            return {
                limited: true,
                message: 'Too many requests. Please wait a moment.',
                retryAfter: Math.ceil((minute.reset - Date.now()) / 1000)
            };
        }

        if (day.count >= limits.perDay) {
            return {
                limited: true,
                message: isGuest
                    ? 'Daily limit reached. Sign up for more queries!'
                    : 'Daily limit reached. Try again tomorrow.',
                retryAfter: Math.ceil((day.reset - Date.now()) / 1000)
            };
        }

        return {
            limited: false,
            remaining: {
                minute: limits.perMinute - minute.count - 1,
                day: limits.perDay - day.count - 1
            }
        };
    }

    /**
     * Clear cache for a specific query
     * @param {string} query - Query to clear
     */
    async invalidate(query) {
        const key = `${this.prefix}exact:${hash(query)}`;

        try {
            if (this.redis) {
                await this.redis.del(key);
            }
            memoryCache.delete(key);
        } catch (error) {
            console.error('[AI Cache] Invalidate error:', error.message);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memorySize: memoryCache.size
        };
    }
}

// Singleton instance
let cacheInstance = null;

/**
 * Get the cache instance
 * @returns {AICache} Cache instance
 */
export function getCache() {
    if (!cacheInstance) {
        cacheInstance = new AICache();
    }
    return cacheInstance;
}

export default { getCache };
