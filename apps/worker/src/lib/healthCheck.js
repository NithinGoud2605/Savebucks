/**
 * HEALTH CHECK & MONITORING SERVER
 * Provides /health endpoint and metrics for monitoring
 */

import http from 'http'
import logger from './logger.js'
import { getAllCircuitStatuses } from './circuitBreaker.js'
import { getAllRateLimitStatuses } from './rateLimiter.js'
import { queues, connection } from './queue.js'
import db from './supabase.js'
import CONFIG from '../config/ingestion.config.js'

let server = null
let startTime = null
let metrics = {
    dealsProcessed: 0,
    couponsProcessed: 0,
    errorsCount: 0,
    lastError: null,
    lastSuccessfulRun: null
}

// Source health tracking
const sourceHealth = new Map()

/**
 * Record source result for health scoring
 */
export function recordSourceResult(source, success, itemCount = 0) {
    if (!sourceHealth.has(source)) {
        sourceHealth.set(source, {
            successes: 0,
            failures: 0,
            totalItems: 0,
            lastRun: null,
            healthScore: 1.0
        })
    }

    const stats = sourceHealth.get(source)
    if (success) {
        stats.successes++
        stats.totalItems += itemCount
    } else {
        stats.failures++
    }
    stats.lastRun = new Date().toISOString()

    // Calculate health score (weighted average favoring recent results)
    const total = stats.successes + stats.failures
    stats.healthScore = total > 0 ? (stats.successes / total) : 1.0

    sourceHealth.set(source, stats)
}

/**
 * Get all source health scores
 */
export function getSourceHealthScores() {
    return Object.fromEntries(sourceHealth)
}

/**
 * Update metrics
 */
export function updateMetrics(updates) {
    Object.assign(metrics, updates)
}

/**
 * Increment metric counter
 */
export function incrementMetric(key, amount = 1) {
    if (typeof metrics[key] === 'number') {
        metrics[key] += amount
    }
}

/**
 * Get system health status
 */
async function getHealthStatus() {
    const now = new Date()
    const uptime = startTime ? Math.floor((now - startTime) / 1000) : 0

    // Check Redis connection
    let redisHealthy = false
    try {
        await connection.ping()
        redisHealthy = true
    } catch (err) {
        logger.error('Redis health check failed', { error: err.message })
    }

    // Check Supabase connection
    let dbHealthy = false
    try {
        const { error } = await db.supabase.from('deals').select('id').limit(1)
        dbHealthy = !error
    } catch (err) {
        logger.error('Database health check failed', { error: err.message })
    }

    // Get queue stats
    const queueStats = {}
    for (const [name, queue] of Object.entries(queues)) {
        try {
            const counts = await queue.getJobCounts()
            queueStats[name] = counts
        } catch (err) {
            queueStats[name] = { error: err.message }
        }
    }

    // Get circuit breaker status
    const circuits = getAllCircuitStatuses()
    const openCircuits = circuits.filter(c => c.state === 'OPEN').length

    // Calculate overall status
    const isHealthy = redisHealthy && dbHealthy && openCircuits === 0
    const isDegraded = (redisHealthy && dbHealthy) && openCircuits > 0

    return {
        status: isHealthy ? 'healthy' : (isDegraded ? 'degraded' : 'unhealthy'),
        timestamp: now.toISOString(),
        uptime: `${uptime}s`,
        version: process.env.npm_package_version || '1.0.0',

        services: {
            redis: redisHealthy ? 'healthy' : 'unhealthy',
            database: dbHealthy ? 'healthy' : 'unhealthy'
        },

        queues: queueStats,

        circuits: {
            total: circuits.length,
            open: openCircuits,
            details: circuits
        },

        rateLimits: getAllRateLimitStatuses(),

        sourceHealth: getSourceHealthScores(),

        metrics: {
            ...metrics,
            uptimeSeconds: uptime
        }
    }
}

/**
 * Get detailed metrics for monitoring
 */
async function getDetailedMetrics() {
    try {
        const stats = await db.getIngestionStats()

        return {
            ingestion: stats,
            processing: metrics,
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        return {
            error: error.message,
            processing: metrics,
            timestamp: new Date().toISOString()
        }
    }
}

/**
 * HTTP request handler
 */
async function handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`)

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }

    try {
        switch (url.pathname) {
            case '/health':
            case '/healthz':
                const health = await getHealthStatus()
                const statusCode = health.status === 'unhealthy' ? 503 : 200
                res.writeHead(statusCode)
                res.end(JSON.stringify(health, null, 2))
                break

            case '/ready':
                // Readiness probe - just check if we can respond
                res.writeHead(200)
                res.end(JSON.stringify({ ready: true }))
                break

            case '/metrics':
                const detailedMetrics = await getDetailedMetrics()
                res.writeHead(200)
                res.end(JSON.stringify(detailedMetrics, null, 2))
                break

            case '/circuits':
                const circuits = getAllCircuitStatuses()
                res.writeHead(200)
                res.end(JSON.stringify({ circuits }))
                break

            default:
                res.writeHead(404)
                res.end(JSON.stringify({ error: 'Not found' }))
        }
    } catch (error) {
        logger.error('Health check error', { error: error.message })
        res.writeHead(500)
        res.end(JSON.stringify({ error: error.message }))
    }
}

/**
 * Start health check server
 */
export function startHealthServer(port = 3002) {
    if (server) {
        logger.warn('Health server already running')
        return server
    }

    startTime = new Date()

    server = http.createServer(handleRequest)

    server.listen(port, () => {
        logger.info('Health server started', { port })
        console.log(`📊 Health: http://localhost:${port}/health`)
        console.log(`📈 Metrics: http://localhost:${port}/metrics`)
    })

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            logger.warn('Health server port in use, trying next port', { port })
            startHealthServer(port + 1)
        } else {
            logger.error('Health server error', { error: error.message })
        }
    })

    return server
}

/**
 * Stop health check server
 */
export async function stopHealthServer() {
    if (server) {
        return new Promise((resolve) => {
            server.close(() => {
                logger.info('Health server stopped')
                server = null
                resolve()
            })
        })
    }
}

export default {
    startHealthServer,
    stopHealthServer,
    updateMetrics,
    incrementMetric,
    recordSourceResult,
    getSourceHealthScores,
    getHealthStatus: getHealthStatus
}
