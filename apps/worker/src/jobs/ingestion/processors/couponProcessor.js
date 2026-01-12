/**
 * PRODUCTION-GRADE COUPON PROCESSOR
 * Complete processing pipeline for coupons with validation and insertion
 */

import db from '../../../lib/supabase.js'
import logger from '../../../lib/logger.js'
import { extractImageFromUrl, extractMultipleImagesFromUrl } from '../../../lib/imageExtractor.js'
import { incrementMetric } from '../../../lib/healthCheck.js'
import CONFIG from '../../../config/ingestion.config.js'

const log = logger.child({ component: 'couponProcessor' })

/**
 * Validate coupon data
 */
export function validateCoupon(coupon) {
    const errors = []
    const warnings = []

    // Required fields
    if (!coupon.title) {
        errors.push('Missing title')
    } else if (coupon.title.length < 5) {
        errors.push('Title too short (min 5 chars)')
    } else if (coupon.title.length > 300) {
        warnings.push(`Title truncated from ${coupon.title.length} chars`)
        coupon.title = coupon.title.substring(0, 300)
    }

    // Coupon code validation
    if (coupon.coupon_code && coupon.coupon_code.length > 100) {
        warnings.push('Coupon code truncated')
        coupon.coupon_code = coupon.coupon_code.substring(0, 100)
    }

    // Discount validation
    if (coupon.discount_value !== null && coupon.discount_value !== undefined) {
        if (typeof coupon.discount_value !== 'number' || isNaN(coupon.discount_value)) {
            errors.push('Invalid discount value')
        } else if (coupon.discount_value <= 0) {
            errors.push('Discount must be positive')
        } else if (coupon.coupon_type === 'percentage' && coupon.discount_value > 100) {
            errors.push('Percentage discount cannot exceed 100%')
        }
    }

    // Expiry validation
    if (coupon.expires_at) {
        const expiryDate = new Date(coupon.expires_at)
        if (isNaN(expiryDate.getTime())) {
            warnings.push('Invalid expiry date format')
            coupon.expires_at = null
        } else if (expiryDate < new Date()) {
            errors.push('Coupon already expired')
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        coupon
    }
}

/**
 * Normalize coupon data to match database schema
 */
export function normalizeCoupon(rawCoupon, source) {
    const title = cleanText(rawCoupon.title)
    const description = cleanText(rawCoupon.description)

    // Extract coupon code from title or description if not provided
    let couponCode = rawCoupon.coupon_code
    if (!couponCode) {
        // Regex to find codes: "code: XYZ", "code XYZ", "coupon: XYZ"
        // Avoids common words like "at", "with", "for"
        const codeRegex = /(?:code|coupon|promo)\s*:?\s*([A-Z0-9]{3,20})/i
        const titleMatch = title.match(codeRegex)
        const descMatch = description?.match(codeRegex)

        if (titleMatch) couponCode = titleMatch[1]
        else if (descMatch) couponCode = descMatch[1]
    }

    return {
        title: title,
        description: description || null,
        coupon_code: couponCode?.trim()?.toUpperCase() || null,
        coupon_type: rawCoupon.coupon_type || 'percentage',
        discount_value: parseNumber(rawCoupon.discount_value || rawCoupon.discount),
        minimum_order_amount: parseNumber(rawCoupon.minimum_order_amount),
        maximum_discount_amount: parseNumber(rawCoupon.maximum_discount_amount),
        terms_conditions: cleanText(rawCoupon.terms_conditions) || null,
        expires_at: parseDate(rawCoupon.expires_at || rawCoupon.expiry_date),
        source,
        source_url: rawCoupon.source_url || rawCoupon.url || null,
        external_id: rawCoupon.external_id || rawCoupon.coupon_id || null,
        merchant: rawCoupon.merchant?.trim() || null
    }
}

/**
 * Process a single coupon through the pipeline
 */
export async function processCoupon(rawCoupon, source) {
    const startTime = Date.now()

    try {
        // Step 1: Normalize
        const normalized = normalizeCoupon(rawCoupon, source)
        log.debug('Coupon normalized', { title: normalized.title?.substring(0, 50) })

        // Step 2: Validate
        const validation = validateCoupon(normalized)

        if (validation.warnings.length > 0) {
            log.debug('Validation warnings', { warnings: validation.warnings })
        }

        if (!validation.valid) {
            log.debug('Validation failed', { errors: validation.errors })
            incrementMetric('couponsSkipped')
            return {
                action: 'skipped',
                reason: 'validation_failed',
                errors: validation.errors
            }
        }

        const coupon = validation.coupon

        // Step 3: Check for duplicates
        const existing = await db.couponExistsByCode(source, coupon.coupon_code, coupon.title)
        if (existing) {
            log.debug('Duplicate coupon detected', { existingId: existing.id })
            incrementMetric('couponsSkipped')
            return {
                action: 'skipped',
                reason: 'duplicate',
                existingId: existing.id
            }
        }

        // Step 4: Find or create company
        let companyId = null
        if (coupon.merchant) {
            const company = await db.findOrCreateCompany(coupon.merchant)
            if (company) {
                companyId = company.id
            }
        }

        // Step 4b: Extract images if source_url available
        let featuredImage = null
        let images = null
        if (coupon.source_url) {
            try {
                // Extract multiple images
                const imageArray = await extractMultipleImagesFromUrl(coupon.source_url, 5)
                if (imageArray.length > 0) {
                    featuredImage = imageArray[0] // Primary image
                    images = imageArray // All images
                    log.debug('Coupon images extracted', { count: imageArray.length })
                }
            } catch (err) {
                log.debug('Coupon image extraction failed', { error: err.message })
            }
        }

        // Step 5: Prepare for insertion - exact production schema
        const insertData = {
            title: coupon.title,
            description: coupon.description,
            coupon_code: coupon.coupon_code,
            coupon_type: coupon.coupon_type || 'percentage',
            discount_value: coupon.discount_value,
            minimum_order_amount: coupon.minimum_order_amount,
            maximum_discount_amount: coupon.maximum_discount_amount,
            terms_conditions: coupon.terms_conditions,
            expires_at: coupon.expires_at,
            source: source,
            source_url: coupon.source_url,
            external_id: coupon.external_id,
            company_id: companyId,
            featured_image: featuredImage,
            images: images,  // Array of image URLs
            status: 'pending'  // All ingested coupons go to pending
        }

        // Step 6: Insert
        const insertResult = await db.insertCoupon(insertData)

        if (!insertResult.success) {
            if (insertResult.error === 'duplicate') {
                incrementMetric('couponsSkipped')
                return { action: 'skipped', reason: 'duplicate' }
            }
            throw new Error(insertResult.error)
        }

        const duration = Date.now() - startTime
        incrementMetric('couponsProcessed')

        log.info('Coupon created', {
            id: insertResult.data.id,
            title: coupon.title.substring(0, 50),
            code: coupon.coupon_code,
            duration: `${duration}ms`
        })

        return {
            action: 'created',
            id: insertResult.data.id,
            coupon: insertResult.data,
            duration
        }

    } catch (error) {
        const duration = Date.now() - startTime

        log.error('Coupon processing failed', {
            error: error.message,
            title: rawCoupon.title?.substring(0, 50),
            source,
            duration: `${duration}ms`
        }, error)

        await db.logError(source, error, {
            errorType: 'coupon_processing',
            couponData: {
                title: rawCoupon.title,
                code: rawCoupon.coupon_code,
                merchant: rawCoupon.merchant
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
 * Process multiple coupons in batch
 */
export async function processCoupons(rawCoupons, source) {
    const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        details: []
    }

    log.info('Processing coupon batch', { source, count: rawCoupons.length })

    for (const rawCoupon of rawCoupons) {
        const result = await processCoupon(rawCoupon, source)

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

    log.info('Coupon batch complete', {
        source,
        created: results.created,
        skipped: results.skipped,
        errors: results.errors
    })

    return results
}

// Helper functions

function cleanText(text) {
    if (!text) return ''
    return text
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}

function parseNumber(value) {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const cleaned = value.replace(/[$,%€£¥₹]/g, '').trim()
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
    validateCoupon,
    normalizeCoupon,
    processCoupon,
    processCoupons
}
