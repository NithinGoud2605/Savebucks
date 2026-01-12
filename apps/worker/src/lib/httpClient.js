/**
 * PRODUCTION-GRADE HTTP CLIENT
 * Axios wrapper with retry, rate limiting, circuit breaker, and error handling
 */

import axios from 'axios'
import CONFIG from '../config/ingestion.config.js'
import logger from './logger.js'
import { withCircuitBreaker } from './circuitBreaker.js'
import { withRateLimit } from './rateLimiter.js'
import { withRetryAndTimeout } from './retry.js'

// Create base axios instance
const axiosInstance = axios.create({
    timeout: CONFIG.http.timeout,
    headers: CONFIG.http.headers,
    validateStatus: status => status < 400, // Only throw for 4xx/5xx
    maxRedirects: 5,
    decompress: true
})

// Request interceptor - add timestamps for timing
axiosInstance.interceptors.request.use(
    config => {
        config.metadata = { startTime: Date.now() }
        logger.debug('HTTP Request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: Object.keys(config.headers || {})
        })
        return config
    },
    error => {
        logger.error('HTTP Request Error', { error: error.message })
        return Promise.reject(error)
    }
)

// Response interceptor - log timing and handle errors
axiosInstance.interceptors.response.use(
    response => {
        const duration = Date.now() - (response.config.metadata?.startTime || Date.now())
        logger.debug('HTTP Response', {
            status: response.status,
            url: response.config.url,
            duration: `${duration}ms`,
            contentLength: response.headers['content-length']
        })
        return response
    },
    error => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now())
        logger.warn('HTTP Error', {
            status: error.response?.status,
            url: error.config?.url,
            duration: `${duration}ms`,
            message: error.message
        })
        return Promise.reject(error)
    }
)

/**
 * Make HTTP request with all production features
 */
export async function httpRequest(source, config) {
    return withCircuitBreaker(source, async () => {
        return withRateLimit(source, async () => {
            return withRetryAndTimeout(
                async () => {
                    const response = await axiosInstance(config)
                    return response.data
                },
                { timeout: CONFIG.http.timeout }
            )
        })
    })
}

/**
 * GET request
 */
export async function get(source, url, options = {}) {
    return httpRequest(source, {
        method: 'GET',
        url,
        ...options
    })
}

/**
 * POST request
 */
export async function post(source, url, data, options = {}) {
    return httpRequest(source, {
        method: 'POST',
        url,
        data,
        ...options
    })
}

/**
 * Fetch with custom headers (for RSS/XML)
 */
export async function fetchRSS(source, url, options = {}) {
    return get(source, url, {
        ...options,
        headers: {
            ...CONFIG.http.headers,
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            ...options.headers
        }
    })
}

/**
 * Fetch JSON API
 */
export async function fetchJSON(source, url, options = {}) {
    return get(source, url, {
        headers: {
            ...CONFIG.http.headers,
            'Accept': 'application/json',
            ...options.headers
        },
        ...options
    })
}

/**
 * Fetch with authentication
 */
export async function fetchWithAuth(source, url, authConfig) {
    const headers = { ...CONFIG.http.headers }

    if (authConfig.type === 'bearer') {
        headers['Authorization'] = `Bearer ${authConfig.token}`
    } else if (authConfig.type === 'basic') {
        const auth = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64')
        headers['Authorization'] = `Basic ${auth}`
    } else if (authConfig.type === 'apikey') {
        headers[authConfig.headerName || 'X-API-Key'] = authConfig.key
    }

    return get(source, url, { headers })
}

/**
 * Batch fetch with concurrency control
 */
export async function batchFetch(source, urls, options = {}) {
    const { concurrency = 3 } = options
    const results = []
    const errors = []

    for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency)

        const batchResults = await Promise.allSettled(
            batch.map(url => get(source, url, options))
        )

        for (const [index, result] of batchResults.entries()) {
            if (result.status === 'fulfilled') {
                results.push({ url: batch[index], data: result.value })
            } else {
                errors.push({ url: batch[index], error: result.reason.message })
            }
        }
    }

    return { results, errors }
}

/**
 * Check if URL is accessible
 */
export async function checkUrl(url) {
    try {
        const response = await axiosInstance.head(url, { timeout: 5000 })
        return { accessible: true, status: response.status }
    } catch (error) {
        return {
            accessible: false,
            status: error.response?.status,
            error: error.message
        }
    }
}

/**
 * Extract final URL after redirects
 */
export async function getFinalUrl(url) {
    try {
        const response = await axiosInstance.head(url, {
            timeout: 10000,
            maxRedirects: 10
        })
        return response.request?.res?.responseUrl || url
    } catch (error) {
        return url
    }
}

export default {
    httpRequest,
    get,
    post,
    fetchRSS,
    fetchJSON,
    fetchWithAuth,
    batchFetch,
    checkUrl,
    getFinalUrl,
    axios: axiosInstance
}
