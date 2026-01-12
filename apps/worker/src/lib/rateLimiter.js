/**
 * RATE LIMITER IMPLEMENTATION
 * Token bucket algorithm with per-source and global limits
 */

import CONFIG from '../config/ingestion.config.js'
import logger from './logger.js'

// Store rate limiters per source
const limiters = new Map()

// Global rate limiter
let globalLimiter = null

/**
 * Token Bucket Rate Limiter
 */
class TokenBucket {
    constructor(options) {
        this.tokens = options.maxTokens || options.requests
        this.maxTokens = options.maxTokens || options.requests
        this.refillRate = options.refillRate || (options.requests / (options.window / 1000))
        this.lastRefill = Date.now()
        this.waiting = []
    }

    refill() {
        const now = Date.now()
        const elapsed = (now - this.lastRefill) / 1000
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
        this.lastRefill = now
    }

    async acquire(tokens = 1) {
        this.refill()

        if (this.tokens >= tokens) {
            this.tokens -= tokens
            return true
        }

        // Calculate wait time
        const deficit = tokens - this.tokens
        const waitTime = Math.ceil((deficit / this.refillRate) * 1000)

        logger.debug('Rate limit: waiting for tokens', {
            waitTime,
            currentTokens: this.tokens,
            needed: tokens
        })

        return new Promise((resolve) => {
            setTimeout(() => {
                this.refill()
                if (this.tokens >= tokens) {
                    this.tokens -= tokens
                    resolve(true)
                } else {
                    resolve(false)
                }
            }, waitTime)
        })
    }

    tryAcquire(tokens = 1) {
        this.refill()

        if (this.tokens >= tokens) {
            this.tokens -= tokens
            return true
        }
        return false
    }

    getStatus() {
        this.refill()
        return {
            tokens: Math.floor(this.tokens),
            maxTokens: this.maxTokens,
            refillRate: this.refillRate
        }
    }
}

/**
 * Get or create rate limiter for a source
 */
export function getRateLimiter(source, options = {}) {
    if (!limiters.has(source)) {
        const config = {
            ...CONFIG.rateLimit.default,
            ...options
        }
        limiters.set(source, new TokenBucket(config))
    }
    return limiters.get(source)
}

/**
 * Get global rate limiter
 */
export function getGlobalLimiter() {
    if (!globalLimiter) {
        globalLimiter = new TokenBucket({
            maxTokens: CONFIG.rateLimit.global.maxRequestsPerSecond * 10,
            refillRate: CONFIG.rateLimit.global.maxRequestsPerSecond
        })
    }
    return globalLimiter
}

/**
 * Acquire rate limit for a source (waits if necessary)
 */
export async function acquireRateLimit(source, options = {}) {
    // Check global limit first
    const global = getGlobalLimiter()
    const globalOk = await global.acquire()

    if (!globalOk) {
        throw new Error('Global rate limit exceeded')
    }

    // Check source-specific limit
    const limiter = getRateLimiter(source, options)
    const sourceOk = await limiter.acquire()

    if (!sourceOk) {
        throw new Error(`Rate limit exceeded for ${source}`)
    }

    return true
}

/**
 * Try to acquire rate limit without waiting
 */
export function tryAcquireRateLimit(source, options = {}) {
    if (!getGlobalLimiter().tryAcquire()) {
        return false
    }
    return getRateLimiter(source, options).tryAcquire()
}

/**
 * Get rate limit status for monitoring
 */
export function getRateLimitStatus(source) {
    const limiter = limiters.get(source)
    return limiter ? limiter.getStatus() : null
}

/**
 * Get all rate limit statuses
 */
export function getAllRateLimitStatuses() {
    const statuses = {
        global: getGlobalLimiter().getStatus(),
        sources: {}
    }

    for (const [source, limiter] of limiters) {
        statuses.sources[source] = limiter.getStatus()
    }

    return statuses
}

/**
 * Wrapper function with rate limiting
 */
export async function withRateLimit(source, fn, options = {}) {
    await acquireRateLimit(source, options)
    return fn()
}

/**
 * Sleep helper for manual rate limiting
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
    getRateLimiter,
    getGlobalLimiter,
    acquireRateLimit,
    tryAcquireRateLimit,
    getRateLimitStatus,
    getAllRateLimitStatuses,
    withRateLimit,
    sleep
}
