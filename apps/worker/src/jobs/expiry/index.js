#!/usr/bin/env node
/**
 * PRODUCTION-GRADE EXPIRY MANAGEMENT SYSTEM
 * Automatic cleanup of expired deals and coupons
 */

import dotenv from 'dotenv'
import { Worker } from 'bullmq'
import logger from '../../lib/logger.js'
import { connection, queues, addCleanupJob, gracefulShutdown } from '../../lib/queue.js'
import { startHealthServer, updateMetrics } from '../../lib/healthCheck.js'
import db from '../../lib/supabase.js'
import CONFIG from '../../config/ingestion.config.js'

dotenv.config()

const log = logger.child({ component: 'expiry' })
const { dealRetentionDays, couponRetentionDays, batchSize } = CONFIG.expiry

/**
 * Mark expired deals as expired
 */
async function markExpiredDeals() {
    const now = new Date().toISOString()

    try {
        const { data: expired, error } = await db.supabase
            .from('deals')
            .update({
                status: 'expired',
                updated_at: now
            })
            .lt('expires_at', now)
            .in('status', ['approved', 'pending'])
            .select('id, title')

        if (error) throw error

        const count = expired?.length || 0
        if (count > 0) {
            log.info('Marked deals as expired', { count })
        }

        return count
    } catch (error) {
        log.error('Failed to mark expired deals', { error: error.message }, error)
        throw error
    }
}

/**
 * Delete old expired deals
 */
async function deleteOldDeals() {
    const cutoff = new Date(Date.now() - dealRetentionDays * 24 * 60 * 60 * 1000).toISOString()

    try {
        const { data: deleted, error } = await db.supabase
            .from('deals')
            .delete()
            .eq('status', 'expired')
            .lt('updated_at', cutoff)
            .select('id')

        if (error) throw error

        const count = deleted?.length || 0
        if (count > 0) {
            log.info('Deleted old expired deals', { count, retentionDays: dealRetentionDays })
        }

        return count
    } catch (error) {
        log.error('Failed to delete old deals', { error: error.message }, error)
        throw error
    }
}

/**
 * Mark expired coupons as expired
 */
async function markExpiredCoupons() {
    const now = new Date().toISOString()

    try {
        const { data: expired, error } = await db.supabase
            .from('coupons')
            .update({
                status: 'expired',
                updated_at: now
            })
            .lt('expires_at', now)
            .in('status', ['approved', 'pending'])
            .select('id')

        if (error) throw error

        const count = expired?.length || 0
        if (count > 0) {
            log.info('Marked coupons as expired', { count })
        }

        return count
    } catch (error) {
        log.error('Failed to mark expired coupons', { error: error.message }, error)
        throw error
    }
}

/**
 * Delete old expired coupons
 */
async function deleteOldCoupons() {
    const cutoff = new Date(Date.now() - couponRetentionDays * 24 * 60 * 60 * 1000).toISOString()

    try {
        const { data: deleted, error } = await db.supabase
            .from('coupons')
            .delete()
            .eq('status', 'expired')
            .lt('updated_at', cutoff)
            .select('id')

        if (error) throw error

        const count = deleted?.length || 0
        if (count > 0) {
            log.info('Deleted old expired coupons', { count, retentionDays: couponRetentionDays })
        }

        return count
    } catch (error) {
        log.error('Failed to delete old coupons', { error: error.message }, error)
        throw error
    }
}

/**
 * Cleanup old ingestion data
 */
async function cleanupIngestionData() {
    try {
        const { data } = await db.supabase.rpc('cleanup_ingestion_data', { days_to_keep: 30 })

        if (data && (data.errors_deleted > 0 || data.runs_deleted > 0)) {
            log.info('Cleaned up ingestion data', data)
        }

        return data
    } catch (error) {
        log.warn('Cleanup ingestion data failed (function may not exist)', { error: error.message })
        return { errors_deleted: 0, runs_deleted: 0 }
    }
}

/**
 * Run all expiry checks
 */
async function runExpiryChecks() {
    const startTime = Date.now()
    log.info('Starting expiry checks...')

    const results = {
        deals: { expired: 0, deleted: 0 },
        coupons: { expired: 0, deleted: 0 },
        ingestion: { errors_deleted: 0, runs_deleted: 0 }
    }

    try {
        // Mark expired items
        results.deals.expired = await markExpiredDeals()
        results.coupons.expired = await markExpiredCoupons()

        // Delete old expired items
        results.deals.deleted = await deleteOldDeals()
        results.coupons.deleted = await deleteOldCoupons()

        // Cleanup ingestion tracking data
        const ingestionCleanup = await cleanupIngestionData()
        results.ingestion = ingestionCleanup || { errors_deleted: 0, runs_deleted: 0 }

        const duration = Date.now() - startTime
        log.info('Expiry checks completed', { duration: `${duration}ms`, results })

        // Update metrics
        updateMetrics({
            lastExpiryRun: new Date().toISOString(),
            expiryResults: results
        })

        return results

    } catch (error) {
        log.error('Expiry checks failed', { error: error.message }, error)
        throw error
    }
}

/**
 * Process expiry job
 */
async function processExpiryJob(job) {
    log.info('Processing expiry job', { jobId: job.id })

    try {
        const results = await runExpiryChecks()
        return results
    } catch (error) {
        log.error('Expiry job failed', { jobId: job.id, error: error.message })
        throw error
    }
}

/**
 * Setup scheduled expiry checks
 */
async function setupExpiryScheduler() {
    log.info('Setting up expiry scheduler...')

    try {
        // Remove existing scheduled job
        const existingJobs = await queues.cleanup.getRepeatableJobs()
        for (const job of existingJobs) {
            if (job.name === 'scheduled-expiry') {
                await queues.cleanup.removeRepeatableByKey(job.key)
            }
        }

        // Add scheduled job
        await addCleanupJob(
            'scheduled-expiry',
            {},
            {
                repeat: { pattern: CONFIG.expiry.schedule },
                jobId: 'scheduled-expiry'
            }
        )

        log.info('Expiry scheduled', { schedule: CONFIG.expiry.schedule })
    } catch (error) {
        log.error('Failed to setup expiry scheduler', { error: error.message })
        throw error
    }
}

/**
 * Main entry point
 */
async function main() {
    console.log('\n🗑️  Starting Expiry Management System\n')
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

        // Start health server on different port
        startHealthServer(process.env.EXPIRY_HEALTH_PORT || 3003)

        // Create cleanup worker
        const worker = new Worker(
            'cleanup',
            processExpiryJob,
            {
                connection,
                concurrency: 1 // Only one expiry check at a time
            }
        )

        worker.on('completed', (job, result) => {
            log.info('Expiry job completed', { jobId: job.id, result })
        })

        worker.on('failed', (job, err) => {
            log.error('Expiry job failed', { jobId: job?.id, error: err.message })
        })

        // Setup scheduler
        await setupExpiryScheduler()

        // Run initial check
        log.info('Running initial expiry check...')
        await runExpiryChecks()

        console.log('\n' + '='.repeat(50))
        console.log('✅ Expiry management ready!')
        console.log('')
        console.log(`📊 Health: http://localhost:${process.env.EXPIRY_HEALTH_PORT || 3003}/health`)
        console.log(`⏰ Schedule: ${CONFIG.expiry.schedule}`)
        console.log(`📅 Deal retention: ${dealRetentionDays} days`)
        console.log(`📅 Coupon retention: ${couponRetentionDays} days`)
        console.log('='.repeat(50) + '\n')

        // Handle graceful shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
        process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    } catch (error) {
        log.error('Failed to start expiry system', { error: error.message }, error)
        console.error('\n❌ Fatal error:', error.message)
        process.exit(1)
    }
}

// Run main
main().catch(console.error)

export { runExpiryChecks, setupExpiryScheduler }
