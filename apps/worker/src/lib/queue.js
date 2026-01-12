/**
 * PRODUCTION-GRADE QUEUE SYSTEM
 * BullMQ-based job queue with comprehensive error handling
 */

import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'
import logger from './logger.js'
import CONFIG from '../config/ingestion.config.js'

// Redis connection with retry logic
const createConnection = () => {
    const redis = new Redis(CONFIG.queue.redis.url, {
        ...CONFIG.queue.redis,
        retryStrategy: (times) => {
            if (times > 10) {
                logger.error('Redis connection failed after 10 retries')
                return null // Stop retrying
            }
            const delay = Math.min(times * 200, 3000)
            logger.warn('Redis connection retry', { attempt: times, delay })
            return delay
        }
    })

    redis.on('connect', () => {
        logger.info('Redis connected')
    })

    redis.on('error', (err) => {
        logger.error('Redis error', { error: err.message })
    })

    redis.on('close', () => {
        logger.warn('Redis connection closed')
    })

    return redis
}

// Create connection
export const connection = createConnection()

// Create queues with default job options
export const queues = {
    ingestion: new Queue('ingestion', {
        connection,
        defaultJobOptions: CONFIG.queue.defaultJobOptions
    }),

    cleanup: new Queue('cleanup', {
        connection,
        defaultJobOptions: {
            ...CONFIG.queue.defaultJobOptions,
            attempts: 2
        }
    }),

    enrichment: new Queue('enrichment', {
        connection,
        defaultJobOptions: {
            ...CONFIG.queue.defaultJobOptions,
            attempts: 2
        }
    })
}

// Queue events for monitoring
export const queueEvents = {
    ingestion: new QueueEvents('ingestion', { connection }),
    cleanup: new QueueEvents('cleanup', { connection }),
    enrichment: new QueueEvents('enrichment', { connection })
}

// Event listeners
queueEvents.ingestion.on('completed', ({ jobId, returnvalue }) => {
    logger.debug('Job completed', { queue: 'ingestion', jobId, result: returnvalue })
})

queueEvents.ingestion.on('failed', ({ jobId, failedReason }) => {
    logger.error('Job failed', { queue: 'ingestion', jobId, reason: failedReason })
})

queueEvents.ingestion.on('stalled', ({ jobId }) => {
    logger.warn('Job stalled', { queue: 'ingestion', jobId })
})

/**
 * Add job to ingestion queue
 */
export async function addIngestionJob(name, data, options = {}) {
    try {
        const job = await queues.ingestion.add(name, data, options)
        logger.debug('Job added', { queue: 'ingestion', name, jobId: job.id })
        return job
    } catch (error) {
        logger.error('Failed to add job', { queue: 'ingestion', name, error: error.message })
        throw error
    }
}

/**
 * Add job to cleanup queue
 */
export async function addCleanupJob(name, data, options = {}) {
    try {
        const job = await queues.cleanup.add(name, data, options)
        logger.debug('Job added', { queue: 'cleanup', name, jobId: job.id })
        return job
    } catch (error) {
        logger.error('Failed to add job', { queue: 'cleanup', name, error: error.message })
        throw error
    }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
    const stats = {}

    for (const [name, queue] of Object.entries(queues)) {
        try {
            const [
                waiting,
                active,
                completed,
                failed,
                delayed
            ] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount()
            ])

            stats[name] = { waiting, active, completed, failed, delayed }
        } catch (error) {
            stats[name] = { error: error.message }
        }
    }

    return stats
}

/**
 * Pause all queues
 */
export async function pauseQueues() {
    logger.info('Pausing all queues')
    await Promise.all(Object.values(queues).map(q => q.pause()))
}

/**
 * Resume all queues
 */
export async function resumeQueues() {
    logger.info('Resuming all queues')
    await Promise.all(Object.values(queues).map(q => q.resume()))
}

/**
 * Clean old jobs
 */
export async function cleanOldJobs(maxAge = 86400000) { // 24 hours
    logger.info('Cleaning old jobs')

    await Promise.all(Object.values(queues).map(async (queue) => {
        await queue.clean(maxAge, 1000, 'completed')
        await queue.clean(maxAge * 7, 1000, 'failed')
    }))
}

/**
 * Drain and close all queues
 */
export async function closeQueues() {
    logger.info('Closing all queues')

    // Close queue events
    await Promise.all(Object.values(queueEvents).map(qe => qe.close()))

    // Close queues
    await Promise.all(Object.values(queues).map(q => q.close()))

    // Close Redis connection
    await connection.quit()

    logger.info('All queues closed')
}

/**
 * Graceful shutdown
 */
let isShuttingDown = false

export async function gracefulShutdown(signal = 'SIGTERM') {
    if (isShuttingDown) return
    isShuttingDown = true

    logger.info('Graceful shutdown initiated', { signal })

    try {
        // Pause queues to stop accepting new jobs
        await pauseQueues()

        // Wait for active jobs to complete (max 30 seconds)
        const timeout = 30000
        const start = Date.now()

        while (Date.now() - start < timeout) {
            const stats = await getQueueStats()
            const activeJobs = Object.values(stats).reduce((sum, q) => sum + (q.active || 0), 0)

            if (activeJobs === 0) break

            logger.info('Waiting for active jobs', { activeJobs })
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Close queues
        await closeQueues()

        logger.info('Graceful shutdown complete')
    } catch (error) {
        logger.error('Error during shutdown', { error: error.message })
    }

    process.exit(0)
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default {
    connection,
    queues,
    queueEvents,
    addIngestionJob,
    addCleanupJob,
    getQueueStats,
    pauseQueues,
    resumeQueues,
    cleanOldJobs,
    closeQueues,
    gracefulShutdown
}
