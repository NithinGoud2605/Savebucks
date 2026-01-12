#!/usr/bin/env node
/**
 * PRODUCTION-GRADE INGESTION SYSTEM ENTRY POINT
 * Main entry for starting the complete ingestion pipeline
 */

import dotenv from 'dotenv'
import { Worker } from 'bullmq'
import logger from '../../lib/logger.js'
import { connection, queues, addIngestionJob, gracefulShutdown } from '../../lib/queue.js'
import { startHealthServer, updateMetrics, incrementMetric, recordSourceResult } from '../../lib/healthCheck.js'
import { withCircuitBreaker, getCircuitStatus } from '../../lib/circuitBreaker.js'
import db from '../../lib/supabase.js'
import { SOURCES, getEnabledSources } from './sources/registry.js'
import fetchRSSDeals from './fetchers/rssFetcher.js'
import { processDeals } from './processors/dealProcessor.js'
import { processCoupons } from './processors/couponProcessor.js'

dotenv.config()

const log = logger.child({ component: 'ingestion' })

/**
 * Process a single ingestion job
 */
async function processIngestionJob(job) {
    const { sourceKey, config } = job.data
    const startTime = Date.now()

    log.info('Processing ingestion job', {
        jobId: job.id,
        source: sourceKey,
        type: config.type
    })

    // Start run tracking
    const runId = await db.startIngestionRun(sourceKey, {
        jobId: job.id,
        type: config.type,
        schedule: config.schedule
    })

    const stats = {
        items_fetched: 0,
        items_created: 0,
        items_updated: 0,
        items_skipped: 0,
        items_failed: 0
    }

    try {
        // Check circuit breaker
        const circuitStatus = getCircuitStatus(sourceKey)
        if (circuitStatus?.state === 'OPEN') {
            throw new Error(`Circuit breaker OPEN for ${sourceKey}`)
        }

        // Fetch deals based on source type
        let rawDeals = []

        await withCircuitBreaker(sourceKey, async () => {
            switch (config.type) {
                case 'rss':
                    rawDeals = await fetchRSSDeals(sourceKey, config.config)
                    break

                case 'api':
                    // Dynamic import for API fetchers
                    try {
                        const fetcherPath = config.fetcher.replace('./', './fetchers/')
                        const fetcher = await import(fetcherPath)
                        rawDeals = await fetcher.default(sourceKey, config.config)
                    } catch (err) {
                        log.warn('API fetcher not implemented', { source: sourceKey, error: err.message })
                        rawDeals = []
                    }
                    break

                default:
                    throw new Error(`Unknown source type: ${config.type}`)
            }
        })

        stats.items_fetched = rawDeals.length
        log.info('Deals fetched', { source: sourceKey, count: rawDeals.length })

        // Process items based on entity type
        if (rawDeals.length > 0) {
            let results

            // Determine entity type: favor explicit config, fallback to source name
            const isCoupon = config.entity === 'coupon' || (!config.entity && sourceKey.includes('coupon'))

            if (isCoupon) {
                log.info('Processing as coupons', { source: sourceKey, count: rawDeals.length })
                results = await processCoupons(rawDeals, sourceKey)

                // Track coupon stats
                incrementMetric('couponsProcessed', results.created)
            } else {
                log.info('Processing as deals', { source: sourceKey, count: rawDeals.length })
                results = await processDeals(rawDeals, sourceKey)

                // Track deal stats
                incrementMetric('dealsProcessed', results.created)
            }

            stats.items_created = results.created
            stats.items_updated = results.updated
            stats.items_skipped = results.skipped
            stats.items_failed = results.errors
        }

        // Complete run tracking
        await db.completeIngestionRun(runId, stats)

        // Update health metrics
        updateMetrics({
            lastSuccessfulRun: new Date().toISOString(),
            dealsProcessed: stats.items_created + stats.items_updated
        })

        const duration = Date.now() - startTime
        log.info('Ingestion job completed', {
            source: sourceKey,
            duration: `${duration}ms`,
            ...stats
        })

        // Record source health (success)
        recordSourceResult(sourceKey, true, stats.items_created + stats.items_updated)

        return stats

    } catch (error) {
        log.error('Ingestion job failed', {
            source: sourceKey,
            error: error.message,
            duration: `${Date.now() - startTime}ms`
        }, error)

        // Complete run with error
        await db.completeIngestionRun(runId, stats, error)

        // Update health metrics
        updateMetrics({
            lastError: {
                source: sourceKey,
                message: error.message,
                timestamp: new Date().toISOString()
            },
            errorsCount: 1
        })

        // Record source health (failure)
        recordSourceResult(sourceKey, false)

        throw error
    }
}

/**
 * Setup scheduled jobs for all enabled sources
 */
async function setupScheduledJobs() {
    log.info('Setting up scheduled ingestion jobs...')

    const enabledSources = getEnabledSources()

    if (enabledSources.length === 0) {
        log.warn('No sources enabled! Enable sources in registry.js')
        return
    }

    for (const source of enabledSources) {
        try {
            // Remove existing scheduled job
            const existingJobs = await queues.ingestion.getRepeatableJobs()
            for (const job of existingJobs) {
                if (job.name === `scheduled-${source.key}`) {
                    await queues.ingestion.removeRepeatableByKey(job.key)
                }
            }

            // Add new scheduled job
            await addIngestionJob(
                `scheduled-${source.key}`,
                {
                    sourceKey: source.key,
                    config: source
                },
                {
                    repeat: { pattern: source.schedule },
                    jobId: `scheduled-${source.key}`
                }
            )

            log.info('Source scheduled', {
                source: source.key,
                schedule: source.schedule,
                type: source.type
            })
        } catch (error) {
            log.error('Failed to schedule source', {
                source: source.key,
                error: error.message
            })
        }
    }

    log.info('Scheduled jobs setup complete', { count: enabledSources.length })
}

/**
 * Trigger immediate ingestion for testing
 */
async function triggerTestIngestion() {
    const enabledSources = getEnabledSources()

    if (enabledSources.length === 0) {
        log.warn('No sources to test')
        return
    }

    // Test first enabled source
    const testSource = enabledSources[0]
    log.info('Triggering test ingestion', { source: testSource.key })

    await addIngestionJob(
        `test-${testSource.key}`,
        {
            sourceKey: testSource.key,
            config: testSource
        }
    )
}

/**
 * Main entry point
 */
async function main() {
    console.log('\n🚀 Starting Savebucks Ingestion System\n')
    console.log('='.repeat(50))

    try {
        // Verify Redis connection
        log.info('Connecting to Redis...')
        await connection.ping()
        log.info('Redis connected')

        // Verify database connection
        log.info('Connecting to database...')
        const { error } = await db.supabase.from('deals').select('id').limit(1)
        if (error) throw new Error(`Database connection failed: ${error.message}`)
        log.info('Database connected')

        // Start health check server
        startHealthServer(process.env.HEALTH_PORT || 3002)

        // Create ingestion worker
        const worker = new Worker(
            'ingestion',
            processIngestionJob,
            {
                connection,
                concurrency: 3,
                limiter: {
                    max: 10,
                    duration: 1000
                }
            }
        )

        worker.on('completed', (job, result) => {
            log.debug('Job completed', { jobId: job.id, result })
        })

        worker.on('failed', (job, err) => {
            log.error('Job failed', { jobId: job?.id, error: err.message })
        })

        worker.on('error', (err) => {
            log.error('Worker error', { error: err.message })
        })

        // Setup scheduled jobs
        await setupScheduledJobs()

        // Trigger immediate run for all enabled sources on startup
        const enabledSources = getEnabledSources()
        for (const source of enabledSources) {
            await addIngestionJob(
                `immediate-${source.key}-${Date.now()}`,
                { sourceKey: source.key, config: source },
                { jobId: `immediate-${source.key}-${Date.now()}` }
            )
            log.info('Triggered immediate run', { source: source.key })
        }

        // Resume queues in case they were paused from previous shutdown
        await queues.ingestion.resume()
        log.info('Ingestion queue resumed')

        // Trigger test ingestion if in development
        if (process.env.NODE_ENV !== 'production' && process.env.RUN_TEST_INGESTION === 'true') {
            await triggerTestIngestion()
        }

        console.log('\n' + '='.repeat(50))
        console.log('✅ Ingestion system ready!')
        console.log('')
        console.log('📊 Health: http://localhost:3002/health')
        console.log('📈 Metrics: http://localhost:3002/metrics')
        console.log('')
        console.log('ℹ️  All deals go to PENDING state for admin approval')
        console.log('='.repeat(50) + '\n')

        // Keep process running
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
        process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    } catch (error) {
        log.error('Failed to start ingestion system', { error: error.message }, error)
        console.error('\n❌ Fatal error:', error.message)
        process.exit(1)
    }
}

// Run main
main().catch(console.error)

export { processIngestionJob, setupScheduledJobs, triggerTestIngestion }
