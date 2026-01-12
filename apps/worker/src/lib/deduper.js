/**
 * PRODUCTION-GRADE DEDUPLICATION ENGINE
 * Multi-strategy deduplication with quality scoring
 */

import db from './supabase.js'
import logger from './logger.js'
import CONFIG from '../config/ingestion.config.js'
import stringSimilarity from 'string-similarity'
import { createHash } from 'crypto'

const { titleSimilarityThreshold, priceVarianceThreshold, lookbackDays, maxCandidates } = CONFIG.deduplication

/**
 * Normalize URL for comparison
 * Removes tracking parameters, normalizes domain, etc.
 */
export function normalizeUrl(url) {
    if (!url) return null

    try {
        const parsed = new URL(url)

        // Remove common tracking parameters
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'ref', 'referrer', 'source', 'affiliate', 'aff', 'partner',
            'gclid', 'fbclid', 'msclkid', 'dclid', 'zanpid', 'clickid',
            'mc_cid', 'mc_eid', '_ga', '_gl'
        ]

        for (const param of trackingParams) {
            parsed.searchParams.delete(param)
        }

        // Sort remaining params for consistent hashing
        parsed.searchParams.sort()

        // Normalize domain (lowercase, remove www)
        let hostname = parsed.hostname.toLowerCase()
        if (hostname.startsWith('www.')) {
            hostname = hostname.slice(4)
        }

        // Reconstruct URL
        return `${parsed.protocol}//${hostname}${parsed.pathname}${parsed.search}`.toLowerCase()
    } catch (error) {
        logger.debug('URL normalization failed', { url, error: error.message })
        return url.toLowerCase()
    }
}

/**
 * Generate hash for normalized URL
 */
export function hashUrl(url) {
    const normalized = normalizeUrl(url)
    return normalized ? createHash('md5').update(normalized).digest('hex') : null
}

/**
 * Normalize title for comparison
 */
export function normalizeTitle(title) {
    if (!title) return ''

    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Remove special chars
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .trim()
}

/**
 * Extract key terms from title for matching
 */
export function extractKeyTerms(title) {
    const normalized = normalizeTitle(title)

    // Remove common filler words
    const stopWords = [
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'deal', 'sale', 'save', 'off', 'free', 'shipping', 'today', 'now',
        'limited', 'time', 'offer', 'only', 'get', 'buy', 'shop'
    ]

    const words = normalized.split(' ')
    return words.filter(w => w.length > 2 && !stopWords.includes(w))
}

/**
 * Calculate title similarity score
 */
export function calculateTitleSimilarity(title1, title2) {
    const norm1 = normalizeTitle(title1)
    const norm2 = normalizeTitle(title2)

    // Direct string similarity
    const directSimilarity = stringSimilarity.compareTwoStrings(norm1, norm2)

    // Key terms overlap
    const terms1 = new Set(extractKeyTerms(title1))
    const terms2 = new Set(extractKeyTerms(title2))

    if (terms1.size === 0 || terms2.size === 0) {
        return directSimilarity
    }

    const intersection = [...terms1].filter(t => terms2.has(t)).length
    const union = new Set([...terms1, ...terms2]).size
    const jaccardSimilarity = intersection / union

    // Weighted average
    return directSimilarity * 0.7 + jaccardSimilarity * 0.3
}

/**
 * Check price similarity
 */
export function arePricesSimilar(price1, price2, threshold = priceVarianceThreshold) {
    if (price1 === null || price2 === null) return true // If no price, don't use it as a differentiator
    if (price1 === 0 || price2 === 0) return true

    const variance = Math.abs(price1 - price2) / Math.max(price1, price2)
    return variance <= threshold
}

/**
 * Main deduplication function
 * Returns deduplication result with confidence score
 */
export async function deduplicateDeal(deal) {
    const result = {
        isDuplicate: false,
        existingId: null,
        method: null,
        confidence: 0,
        details: {}
    }

    try {
        // Strategy 1: URL-based deduplication (highest confidence)
        if (deal.url) {
            const existing = await db.dealExistsByUrl(deal.url)

            if (existing) {
                return {
                    isDuplicate: true,
                    existingId: existing.id,
                    method: 'url_exact',
                    confidence: 1.0,
                    details: { existingTitle: existing.title, status: existing.status }
                }
            }
        }

        // Strategy 2: External ID match (high confidence)
        if (deal.external_id && deal.source) {
            const existing = await db.dealExistsByExternalId(deal.source, deal.external_id)

            if (existing) {
                return {
                    isDuplicate: true,
                    existingId: existing.id,
                    method: 'external_id',
                    confidence: 0.99,
                    details: { existingTitle: existing.title, status: existing.status }
                }
            }
        }

        // Strategy 2.5: Exact title match (prevents parallel duplicates)
        if (deal.title) {
            const normalizedTitle = deal.title.trim().toLowerCase()
            const lookback = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Last 24 hours

            const { data: exactMatches, error } = await db.supabase
                .from('deals')
                .select('id, title, merchant, status')
                .gte('created_at', lookback)
                .limit(100)

            if (!error && exactMatches) {
                for (const match of exactMatches) {
                    // Check for exact title match (case-insensitive)
                    if (match.title?.trim().toLowerCase() === normalizedTitle) {
                        return {
                            isDuplicate: true,
                            existingId: match.id,
                            method: 'exact_title',
                            confidence: 0.98,
                            details: { existingTitle: match.title, status: match.status }
                        }
                    }
                }
            }
        }

        // Strategy 3: Title + Company similarity (medium confidence)
        if (deal.company_id && deal.title) {
            const lookback = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

            const { data: candidates, error } = await db.supabase
                .from('deals')
                .select('id, title, price, status')
                .eq('company_id', deal.company_id)
                .gte('created_at', lookback)
                .in('status', ['approved', 'pending'])
                .limit(maxCandidates)

            if (error) {
                logger.warn('Error fetching candidates for similarity check', { error: error.message })
            } else if (candidates && candidates.length > 0) {
                let bestMatch = null
                let bestScore = 0

                for (const candidate of candidates) {
                    const titleScore = calculateTitleSimilarity(deal.title, candidate.title)

                    if (titleScore >= titleSimilarityThreshold) {
                        const priceMatch = arePricesSimilar(deal.price, candidate.price)

                        // Calculate confidence based on title score and price match
                        let confidence = titleScore
                        if (!priceMatch) {
                            confidence *= 0.7 // Reduce confidence if prices differ
                        }

                        if (confidence > bestScore) {
                            bestScore = confidence
                            bestMatch = candidate
                        }
                    }
                }

                if (bestMatch && bestScore >= titleSimilarityThreshold) {
                    return {
                        isDuplicate: true,
                        existingId: bestMatch.id,
                        method: 'title_similarity',
                        confidence: bestScore,
                        details: {
                            existingTitle: bestMatch.title,
                            similarity: bestScore.toFixed(3),
                            priceMatch: arePricesSimilar(deal.price, bestMatch.price)
                        }
                    }
                }
            }
        }

        // Strategy 4: Global title search (lower confidence, last resort)
        if (deal.title && deal.title.length > 20) {
            const keyTerms = extractKeyTerms(deal.title)

            if (keyTerms.length >= 3) {
                // Search for deals with similar key terms
                const searchQuery = keyTerms.slice(0, 5).join(' & ')

                const { data: globalCandidates, error } = await db.supabase
                    .from('deals')
                    .select('id, title, price, merchant, status')
                    .textSearch('title', searchQuery, { type: 'websearch' })
                    .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()) // Last 3 days only
                    .in('status', ['approved', 'pending'])
                    .limit(20)

                if (!error && globalCandidates) {
                    for (const candidate of globalCandidates) {
                        const titleScore = calculateTitleSimilarity(deal.title, candidate.title)

                        if (titleScore >= 0.90) { // Higher threshold for global search
                            const priceMatch = arePricesSimilar(deal.price, candidate.price)

                            if (priceMatch) {
                                return {
                                    isDuplicate: true,
                                    existingId: candidate.id,
                                    method: 'global_search',
                                    confidence: titleScore * 0.9, // Slightly lower confidence
                                    details: {
                                        existingTitle: candidate.title,
                                        similarity: titleScore.toFixed(3),
                                        merchant: candidate.merchant
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return result

    } catch (error) {
        logger.error('Deduplication error', {
            error: error.message,
            deal: { title: deal.title, url: deal.url?.substring(0, 50) }
        })

        // On error, assume not duplicate to avoid data loss
        return result
    }
}

/**
 * Update existing deal with better information
 */
export async function updateExistingDeal(dealId, newData, existing = {}) {
    const updates = {}

    // Only update if new data is better
    if (newData.image_url && !existing.image_url) {
        updates.image_url = newData.image_url
    }

    if (newData.description && (!existing.description || newData.description.length > existing.description?.length)) {
        updates.description = newData.description
    }

    // Always update price if it changed significantly
    if (newData.price && existing.price && Math.abs(newData.price - existing.price) > 0.01) {
        updates.price = newData.price
    }

    if (newData.list_price && !existing.list_price) {
        updates.list_price = newData.list_price
    }

    // Update expiry if extended
    if (newData.expires_at) {
        if (!existing.expires_at || new Date(newData.expires_at) > new Date(existing.expires_at)) {
            updates.expires_at = newData.expires_at
        }
    }

    // Add coupon code if missing
    if (newData.coupon_code && !existing.coupon_code) {
        updates.coupon_code = newData.coupon_code
    }

    // Increment verification count
    updates.verification_count = (existing.verification_count || 0) + 1
    updates.last_verified_at = new Date().toISOString()

    if (Object.keys(updates).length > 1) { // More than just verification count
        const result = await db.updateDeal(dealId, updates)

        if (result.success) {
            logger.debug('Updated existing deal', {
                dealId,
                updates: Object.keys(updates).filter(k => k !== 'verification_count')
            })
        }

        return { updated: true, fields: Object.keys(updates) }
    }

    return { updated: false, fields: [] }
}

/**
 * Batch deduplication for multiple deals
 */
export async function batchDeduplicate(deals) {
    const results = {
        unique: [],
        duplicates: [],
        errors: []
    }

    for (const deal of deals) {
        try {
            const dedupResult = await deduplicateDeal(deal)

            if (dedupResult.isDuplicate) {
                results.duplicates.push({
                    deal,
                    ...dedupResult
                })
            } else {
                results.unique.push(deal)
            }
        } catch (error) {
            results.errors.push({ deal, error: error.message })
        }
    }

    logger.info('Batch deduplication complete', {
        unique: results.unique.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length
    })

    return results
}

export default {
    normalizeUrl,
    hashUrl,
    normalizeTitle,
    extractKeyTerms,
    calculateTitleSimilarity,
    arePricesSimilar,
    deduplicateDeal,
    updateExistingDeal,
    batchDeduplicate
}
