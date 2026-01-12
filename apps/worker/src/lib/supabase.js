/**
 * PRODUCTION-GRADE SUPABASE CLIENT
 * Enhanced database client with error handling, metrics, and run tracking
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import logger from './logger.js'

dotenv.config()

// Validate required environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing required Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
})

/**
 * Log error to database
 */
export async function logError(source, error, context = {}) {
    try {
        const errorData = {
            source,
            error_type: context.errorType || 'processing',
            error_message: error.message || String(error),
            error_stack: error.stack,
            context: {
                ...context,
                timestamp: new Date().toISOString()
            },
            deal_data: context.dealData || null
        }

        await supabase.from('ingestion_errors').insert(errorData)

        logger.debug('Error logged to database', { source, error: error.message })
    } catch (dbError) {
        logger.error('Failed to log error to database', {
            source,
            originalError: error.message,
            dbError: dbError.message
        })
    }
}

/**
 * Start an ingestion run - returns run ID
 */
export async function startIngestionRun(source, metadata = {}) {
    try {
        const { data, error } = await supabase
            .from('ingestion_runs')
            .insert({
                source,
                status: 'running',
                metadata
            })
            .select('id')
            .single()

        if (error) throw error

        logger.info('Ingestion run started', { runId: data.id, source })
        return data.id
    } catch (error) {
        logger.error('Failed to start ingestion run', { source, error: error.message })
        return null
    }
}

/**
 * Complete an ingestion run
 */
export async function completeIngestionRun(runId, stats, error = null) {
    if (!runId) return

    try {
        const startedAt = await getRunStartTime(runId)
        const duration = startedAt ? Date.now() - new Date(startedAt).getTime() : null

        const updateData = {
            status: error ? 'failed' : (stats.items_failed > 0 ? 'partial' : 'completed'),
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            items_fetched: stats.items_fetched || 0,
            items_created: stats.items_created || 0,
            items_updated: stats.items_updated || 0,
            items_skipped: stats.items_skipped || 0,
            items_failed: stats.items_failed || 0,
            error_message: error?.message,
            error_stack: error?.stack
        }

        await supabase
            .from('ingestion_runs')
            .update(updateData)
            .eq('id', runId)

        logger.info('Ingestion run completed', {
            runId,
            status: updateData.status,
            duration: duration ? `${duration}ms` : 'unknown',
            stats
        })
    } catch (err) {
        logger.error('Failed to complete ingestion run', { runId, error: err.message })
    }
}

/**
 * Get run start time
 */
async function getRunStartTime(runId) {
    try {
        const { data } = await supabase
            .from('ingestion_runs')
            .select('started_at')
            .eq('id', runId)
            .single()
        return data?.started_at
    } catch {
        return null
    }
}

/**
 * Get recent ingestion stats
 */
export async function getIngestionStats(days = 7) {
    try {
        const { data, error } = await supabase.rpc('get_ingestion_metrics', { days_back: days })
        if (error) throw error
        return data
    } catch (error) {
        logger.error('Failed to get ingestion stats', { error: error.message })
        return []
    }
}

/**
 * Check if deal exists by external ID
 */
export async function dealExistsByExternalId(source, externalId) {
    if (!externalId) return null

    try {
        const { data, error } = await supabase
            .from('deals')
            .select('id, title, status')
            .eq('source', source)
            .eq('external_id', externalId)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
        return data
    } catch (error) {
        logger.debug('Error checking deal existence', { source, externalId, error: error.message })
        return null
    }
}

/**
 * Check if deal exists by URL
 */
export async function dealExistsByUrl(url) {
    if (!url) return null

    try {
        // Check by exact URL match
        const { data, error } = await supabase
            .from('deals')
            .select('id, title, status')
            .eq('url', url)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
    } catch (error) {
        logger.debug('Error checking deal by URL', { url, error: error.message })
        return null
    }
}

/**
 * Insert deal with conflict handling
 */
export async function insertDeal(deal) {
    try {
        // Use simple insert - normalized_url_hash doesn't exist in production
        const { data, error } = await supabase
            .from('deals')
            .insert(deal)
            .select()
            .single()

        if (error) throw error
        return { success: true, data, action: 'created' }
    } catch (error) {
        // Handle unique constraint violation (duplicate URL)
        if (error.code === '23505') {
            return { success: false, error: 'duplicate', message: 'Deal already exists' }
        }

        logger.error('Failed to insert deal', {
            error: error.message,
            deal: { title: deal.title, url: deal.url }
        })
        return { success: false, error: error.message }
    }
}

/**
 * Update deal
 */
export async function updateDeal(id, updates) {
    try {
        const { data, error } = await supabase
            .from('deals')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        logger.error('Failed to update deal', { id, error: error.message })
        return { success: false, error: error.message }
    }
}

/**
 * Batch insert deals
 */
export async function batchInsertDeals(deals) {
    const results = {
        created: 0,
        failed: 0,
        errors: []
    }

    // Process in batches of 50 to avoid payload limits
    const batchSize = 50

    for (let i = 0; i < deals.length; i += batchSize) {
        const batch = deals.slice(i, i + batchSize)

        try {
            // Use simple insert - no upsert since normalized_url_hash doesn't exist
            const { data, error } = await supabase
                .from('deals')
                .insert(batch)
                .select('id')

            if (error) throw error
            results.created += data?.length || 0
        } catch (error) {
            results.failed += batch.length
            results.errors.push({
                batch: i / batchSize,
                error: error.message
            })
            logger.error('Batch insert failed', {
                batch: i / batchSize,
                error: error.message
            })
        }
    }

    return results
}

/**
 * Get company by name or slug
 */
export async function findCompany(name) {
    if (!name) return null

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    try {
        const { data, error } = await supabase
            .from('companies')
            .select('id, name, slug, is_verified')
            .or(`name.ilike.${name},slug.eq.${slug}`)
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
    } catch (error) {
        logger.debug('Error finding company', { name, error: error.message })
        return null
    }
}

/**
 * Create company if not exists
 */
export async function findOrCreateCompany(name) {
    if (!name || name === 'Unknown') return null

    // Try to find existing
    let company = await findCompany(name)
    if (company) return company

    // Create new
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    try {
        const { data, error } = await supabase
            .from('companies')
            .insert({
                name: name.trim(),
                slug,
                status: 'pending',
                is_verified: false
            })
            .select()
            .single()

        if (error) {
            // Handle race condition - someone else created it
            if (error.code === '23505') {
                return await findCompany(name)
            }
            throw error
        }

        logger.info('Created new company', { name, id: data.id })
        return data
    } catch (error) {
        logger.error('Failed to create company', { name, error: error.message })
        return null
    }
}

/**
 * Check if coupon exists by code or title
 */
export async function couponExistsByCode(source, code, title) {
    try {
        let query = supabase
            .from('coupons')
            .select('id, title, status')

        if (code) {
            query = query.eq('coupon_code', code).eq('source', source)
        } else if (title) {
            query = query.eq('title', title).eq('source', source)
        } else {
            return null
        }

        const { data, error } = await query.single()

        if (error && error.code !== 'PGRST116') throw error
        return data
    } catch (error) {
        logger.debug('Error checking coupon existence', { source, code, error: error.message })
        return null
    }
}

/**
 * Insert coupon
 */
export async function insertCoupon(coupon) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .insert(coupon)
            .select()
            .single()

        if (error) throw error
        return { success: true, data, action: 'created' }
    } catch (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
            return { success: false, error: 'duplicate', message: 'Coupon already exists' }
        }

        logger.error('Failed to insert coupon', {
            error: error.message,
            coupon: { title: coupon.title, code: coupon.coupon_code }
        })
        return { success: false, error: error.message }
    }
}

export default {
    supabase,
    logError,
    startIngestionRun,
    completeIngestionRun,
    getIngestionStats,
    dealExistsByExternalId,
    dealExistsByUrl,
    insertDeal,
    updateDeal,
    batchInsertDeals,
    findCompany,
    findOrCreateCompany,
    couponExistsByCode,
    insertCoupon
}
