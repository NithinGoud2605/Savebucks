/**
 * PRODUCTION-GRADE RETRY HANDLER
 * Exponential backoff with jitter and configurable retry conditions
 */

import CONFIG from '../config/ingestion.config.js'
import logger from './logger.js'

const { maxRetries, initialDelay, maxDelay, multiplier, retryableErrors, retryableStatusCodes } = CONFIG.retry

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error) {
    // Check error code
    if (error.code && retryableErrors.includes(error.code)) {
        return true
    }

    // Check HTTP status
    if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
        return true
    }

    // Check for specific error types
    if (error.message) {
        const msg = error.message.toLowerCase()
        if (
            msg.includes('timeout') ||
            msg.includes('econnreset') ||
            msg.includes('socket hang up') ||
            msg.includes('network error') ||
            msg.includes('temporarily unavailable') ||
            msg.includes('too many requests') ||
            msg.includes('service unavailable') ||
            msg.includes('bad gateway')
        ) {
            return true
        }
    }

    return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(attempt) {
    // Exponential backoff
    let delay = initialDelay * Math.pow(multiplier, attempt)

    // Cap at max delay
    delay = Math.min(delay, maxDelay)

    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1)
    delay = Math.round(delay + jitter)

    return delay
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute function with retry logic
 */
export async function withRetry(fn, options = {}) {
    const {
        maxAttempts = maxRetries,
        onRetry = null,
        shouldRetry = isRetryableError,
        context = {}
    } = options

    let lastError = null

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error

            // Check if we should retry
            if (attempt >= maxAttempts || !shouldRetry(error)) {
                throw error
            }

            // Calculate delay
            const delay = calculateDelay(attempt)

            logger.warn('Retrying after error', {
                attempt: attempt + 1,
                maxAttempts,
                delay,
                error: error.message,
                ...context
            })

            // Call retry callback if provided
            if (onRetry) {
                onRetry(error, attempt + 1, delay)
            }

            // Wait before retrying
            await sleep(delay)
        }
    }

    // Should never reach here, but just in case
    throw lastError
}

/**
 * Create a retryable version of a function
 */
export function retryable(fn, options = {}) {
    return (...args) => withRetry(() => fn(...args), options)
}

/**
 * Retry with timeout
 */
export async function withRetryAndTimeout(fn, options = {}) {
    const { timeout = 30000, ...retryOptions } = options

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeout}ms`))
        }, timeout)
    })

    return Promise.race([
        withRetry(fn, retryOptions),
        timeoutPromise
    ])
}

/**
 * Batch retry helper
 * Retries a batch of operations, collecting successes and failures
 */
export async function batchWithRetry(items, processFn, options = {}) {
    const {
        maxAttempts = maxRetries,
        concurrency = 5,
        continueOnError = true
    } = options

    const results = []
    const errors = []

    // Process in batches for concurrency control
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency)

        const batchResults = await Promise.allSettled(
            batch.map(async (item, index) => {
                try {
                    const result = await withRetry(
                        () => processFn(item, i + index),
                        { maxAttempts, context: { itemIndex: i + index } }
                    )
                    return { success: true, result, item }
                } catch (error) {
                    if (!continueOnError) {
                        throw error
                    }
                    return { success: false, error, item }
                }
            })
        )

        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    results.push(result.value.result)
                } else {
                    errors.push(result.value)
                }
            } else {
                errors.push({ success: false, error: result.reason })
            }
        }
    }

    return { results, errors }
}

export default {
    isRetryableError,
    calculateDelay,
    withRetry,
    retryable,
    withRetryAndTimeout,
    batchWithRetry
}
