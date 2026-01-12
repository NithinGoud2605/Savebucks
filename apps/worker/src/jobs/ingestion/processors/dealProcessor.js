/**
 * PRODUCTION-GRADE DEAL PROCESSOR
 * Complete processing pipeline with validation, enrichment, and insertion
 */

import db from '../../../lib/supabase.js'
import logger from '../../../lib/logger.js'
import deduper from '../../../lib/deduper.js'
import { extractImageFromUrl, extractMultipleImagesFromUrl } from '../../../lib/imageExtractor.js'
import { checkDailyCap, incrementDailyCount } from '../../../lib/dailyCapTracker.js'
import { incrementMetric } from '../../../lib/healthCheck.js'
import { resolveMerchantUrl } from '../../../lib/urlResolver.js'
import CONFIG from '../../../config/ingestion.config.js'

const log = logger.child({ component: 'dealProcessor' })

/**
 * Validate deal data
 */
export function validateDeal(deal) {
    const errors = []
    const warnings = []

    const { minTitleLength, maxTitleLength, minDiscount, maxDiscount, minPrice, maxPrice } = CONFIG.validation.deal

    // Required fields
    if (!deal.title) {
        errors.push('Missing title')
    } else if (deal.title.length < minTitleLength) {
        errors.push(`Title too short (min ${minTitleLength} chars)`)
    } else if (deal.title.length > maxTitleLength) {
        warnings.push(`Title truncated from ${deal.title.length} chars`)
        deal.title = deal.title.substring(0, maxTitleLength)
    }

    if (!deal.url) {
        errors.push('Missing URL')
    } else if (!isValidUrl(deal.url)) {
        errors.push('Invalid URL format')
    }

    // Price validation
    if (deal.price !== null && deal.price !== undefined) {
        if (typeof deal.price !== 'number' || isNaN(deal.price)) {
            errors.push('Invalid price format')
        } else if (deal.price < minPrice) {
            errors.push(`Price below minimum (${minPrice})`)
        } else if (deal.price > maxPrice) {
            errors.push(`Price above maximum (${maxPrice})`)
        }
    }

    if (deal.list_price !== null && deal.price !== null) {
        if (deal.price >= deal.list_price) {
            errors.push('Price must be less than list price')
        } else {
            const discount = ((deal.list_price - deal.price) / deal.list_price) * 100
            if (discount < minDiscount) {
                errors.push(`Discount too small (${discount.toFixed(1)}% < ${minDiscount}%)`)
            } else if (discount > maxDiscount) {
                warnings.push(`Unusually high discount: ${discount.toFixed(1)}%`)
            }
        }
    }

    // Expiry validation
    if (deal.expires_at) {
        const expiryDate = new Date(deal.expires_at)
        if (isNaN(expiryDate.getTime())) {
            warnings.push('Invalid expiry date format')
            deal.expires_at = null
        } else if (expiryDate < new Date()) {
            errors.push('Deal already expired')
        }
    }

    // URL sanitization
    if (deal.url) {
        deal.url = sanitizeUrl(deal.url)
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        deal
    }
}

/**
 * Normalize deal data to match schema
 */
export function normalizeDeal(rawDeal, source) {
    return {
        title: cleanText(rawDeal.title),
        url: rawDeal.url?.trim(),
        description: cleanText(rawDeal.description) || null,
        image_url: rawDeal.image_url || null,
        price: parsePrice(rawDeal.price),
        list_price: parsePrice(rawDeal.list_price || rawDeal.original_price),
        currency: rawDeal.currency?.toUpperCase() || 'USD',
        merchant: rawDeal.merchant?.trim() || null,
        category: rawDeal.category?.trim() || null,
        expires_at: parseDate(rawDeal.expires_at || rawDeal.expiry_date),
        source,
        external_id: rawDeal.external_id || rawDeal.product_id || rawDeal.asin || null,
        source_url: rawDeal.source_url || rawDeal.affiliate_url || null,
        coupon_code: rawDeal.coupon_code || null,
        quality_score: calculateInitialQualityScore(rawDeal)
    }
}

/**
 * Calculate initial quality score based on data completeness
 */
function calculateInitialQualityScore(deal) {
    let score = 0.5 // Base score

    // Points for having good data
    if (deal.image_url) score += 0.1
    if (deal.description && deal.description.length > 50) score += 0.1
    if (deal.price && deal.list_price) score += 0.1
    if (deal.expires_at) score += 0.05
    if (deal.category) score += 0.05

    // Points for being from trusted source
    if (CONFIG.autoApproval.trustedSources.includes(deal.source)) {
        score += 0.1
    }

    return Math.min(1.0, score)
}

/**
 * Determine if deal should be auto-approved
 */
function shouldAutoApprove(deal, source) {
    // Check if source is trusted
    if (!CONFIG.autoApproval.trustedSources.includes(source)) {
        return false
    }

    // Check quality score
    if (deal.quality_score < CONFIG.autoApproval.minQualityScore) {
        return false
    }

    return true
}

/**
 * Process a single deal through the pipeline
 */
export async function processDeal(rawDeal, source) {
    const startTime = Date.now()

    try {
        // Step 1: Normalize
        const normalized = normalizeDeal(rawDeal, source)
        log.debug('Deal normalized', { title: normalized.title?.substring(0, 50) })

        // Step 2: Validate
        const validation = validateDeal(normalized)

        if (validation.warnings.length > 0) {
            log.debug('Validation warnings', { warnings: validation.warnings })
        }

        if (!validation.valid) {
            log.debug('Validation failed', { errors: validation.errors })
            incrementMetric('dealsSkipped')
            return {
                action: 'skipped',
                reason: 'validation_failed',
                errors: validation.errors
            }
        }

        const deal = validation.deal

        // Step 3a: Check daily cap
        const capStatus = checkDailyCap(source)
        if (!capStatus.allowed) {
            log.warn('Daily cap reached', { source, current: capStatus.current, cap: capStatus.cap })
            return {
                action: 'skipped',
                reason: 'daily_cap_reached'
            }
        }

        // Step 3b: Find or create company
        if (deal.merchant) {
            const company = await db.findOrCreateCompany(deal.merchant)
            if (company) {
                deal.company_id = company.id
            }
        }

        // Step 3c: Resolve merchant URL (get direct store link)
        try {
            const merchantUrl = await resolveMerchantUrl(deal.url)
            if (merchantUrl && merchantUrl !== deal.url) {
                deal.source_url = deal.url  // Keep original Slickdeals URL as source
                deal.url = merchantUrl       // Use merchant URL as primary
                log.debug('Merchant URL resolved', {
                    from: deal.source_url.substring(0, 40),
                    to: merchantUrl.substring(0, 40)
                })
            }
        } catch (err) {
            log.debug('Merchant URL resolution failed', { error: err.message })
        }

        // Step 3d: Extract images (from resolved URL)
        if (!deal.image_url) {
            try {
                // Extract multiple images
                const images = await extractMultipleImagesFromUrl(deal.url, 5)
                if (images.length > 0) {
                    deal.image_url = images[0] // Primary image
                    deal.images = images // All images as JSON array
                    log.debug('Images extracted', { count: images.length })
                }
            } catch (err) {
                log.debug('Image extraction failed', { error: err.message })
            }
        }

        // Step 4: Deduplicate
        const dedupResult = await deduper.deduplicateDeal(deal)

        if (dedupResult.isDuplicate) {
            log.debug('Duplicate detected', {
                method: dedupResult.method,
                confidence: dedupResult.confidence,
                existingId: dedupResult.existingId
            })

            // Update existing deal with any better information
            await deduper.updateExistingDeal(dedupResult.existingId, deal, dedupResult.details)

            incrementMetric('dealsUpdated')
            return {
                action: 'updated',
                id: dedupResult.existingId,
                method: dedupResult.method,
                confidence: dedupResult.confidence
            }
        }

        // Step 5: Prepare for insertion
        // Using exact production schema columns from Supabase
        const insertData = {
            title: deal.title,
            url: deal.url,
            source_url: deal.source_url || deal.url,  // Original aggregator link
            description: deal.description || null,
            image_url: deal.image_url || null,
            images: deal.images || null,  // Array of image URLs
            price: deal.price || null,
            original_price: deal.list_price || null,
            merchant: deal.merchant || null,
            source: source,
            external_id: deal.external_id || null,
            quality_score: deal.quality_score || 0.5,
            status: 'pending',
            deal_type: 'discount',
            coupon_code: deal.coupon_code || null
        }

        // Step 6: Insert
        const insertResult = await db.insertDeal(insertData)

        if (!insertResult.success) {
            if (insertResult.error === 'duplicate') {
                // Race condition - another process inserted first
                incrementMetric('dealsSkipped')
                return { action: 'skipped', reason: 'duplicate' }
            }

            throw new Error(insertResult.error)
        }

        const duration = Date.now() - startTime
        incrementMetric('dealsProcessed')
        incrementDailyCount(source)  // Track for daily cap

        log.info('Deal created', {
            id: insertResult.data.id,
            title: deal.title.substring(0, 50),
            status: insertData.status,
            duration: `${duration}ms`
        })

        return {
            action: 'created',
            id: insertResult.data.id,
            deal: insertResult.data,
            duration
        }

    } catch (error) {
        const duration = Date.now() - startTime

        log.error('Deal processing failed', {
            error: error.message,
            title: rawDeal.title?.substring(0, 50),
            source,
            duration: `${duration}ms`
        }, error)

        await db.logError(source, error, {
            errorType: 'deal_processing',
            dealData: {
                title: rawDeal.title,
                url: rawDeal.url,
                merchant: rawDeal.merchant
            }
        })

        incrementMetric('errorsCount')

        return {
            action: 'error',
            error: error.message,
            duration
        }
    }
}

/**
 * Process multiple deals in batch
 */
export async function processDeals(rawDeals, source) {
    const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        details: []
    }

    log.info('Processing batch', { source, count: rawDeals.length })

    for (const rawDeal of rawDeals) {
        const result = await processDeal(rawDeal, source)

        switch (result.action) {
            case 'created':
                results.created++
                break
            case 'updated':
                results.updated++
                break
            case 'skipped':
                results.skipped++
                break
            case 'error':
                results.errors++
                break
        }

        results.details.push(result)
    }

    log.info('Batch processing complete', {
        source,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors
    })

    return results
}

// Helper functions

function isValidUrl(string) {
    try {
        new URL(string)
        return true
    } catch {
        return false
    }
}

function sanitizeUrl(url) {
    try {
        const parsed = new URL(url)
        return parsed.toString()
    } catch {
        return url
    }
}

function cleanText(text) {
    if (!text) return ''

    return text
        .replace(/<[^>]+>/g, '')     // Remove HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')         // Normalize whitespace
        .trim()
}

function parsePrice(value) {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value

    if (typeof value === 'string') {
        const cleaned = value.replace(/[$,€£¥₹]/g, '').trim()
        const parsed = parseFloat(cleaned)
        return isNaN(parsed) ? null : parsed
    }

    return null
}

function parseDate(value) {
    if (!value) return null

    try {
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date.toISOString()
    } catch {
        return null
    }
}

export default {
    validateDeal,
    normalizeDeal,
    processDeal,
    processDeals
}
