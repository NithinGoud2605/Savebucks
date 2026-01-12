/**
 * PRODUCTION RSS FETCHER
 * Enhanced RSS parsing with error handling and data extraction
 */

import { parseString } from 'xml2js'
import { promisify } from 'util'
import httpClient from '../../../lib/httpClient.js'
import logger from '../../../lib/logger.js'

const parseXML = promisify(parseString)
const log = logger.child({ component: 'rssFetcher' })

/**
 * Fetch and parse RSS feed
 */
export async function fetchRSSDeals(source, config) {
    const { feedUrl } = config

    log.info('Fetching RSS feed', { source, url: feedUrl })

    try {
        // Fetch with all production protections
        const xmlData = await httpClient.fetchRSS(source, feedUrl, { headers: config.headers })

        if (!xmlData || typeof xmlData !== 'string') {
            throw new Error('Empty or invalid RSS response')
        }

        // Parse XML with lenient settings for malformed feeds
        const sanitizedXml = sanitizeXML(xmlData)
        const parsed = await parseXML(sanitizedXml, {
            explicitArray: true,
            ignoreAttrs: false,
            mergeAttrs: true,
            strict: false,  // Lenient parsing
            normalizeTags: true
        })

        // Handle different RSS formats
        const items = extractItems(parsed)

        log.info('RSS feed parsed', { source, itemCount: items.length })

        // Transform to deals with error tolerance
        const deals = []
        let errorCount = 0

        for (const item of items) {
            try {
                const deal = transformRSSItem(item, source)
                if (deal.title && deal.url) {
                    deals.push(deal)
                }
            } catch (err) {
                errorCount++
                log.warn('Skipping bad RSS item', {
                    source,
                    error: err.message,
                    title: item.title?.[0]?.substring?.(0, 50) || 'unknown'
                })
            }
        }

        if (errorCount > 0) {
            log.warn('RSS items skipped due to errors', { source, errorCount, totalItems: items.length })
        }

        log.debug('Deals extracted', { source, dealCount: deals.length })

        return deals

    } catch (error) {
        log.error('RSS fetch failed', { source, url: feedUrl, error: error.message }, error)
        throw error
    }
}

/**
 * Extract items from parsed RSS (handles RSS 2.0, Atom, etc.)
 */
function extractItems(parsed) {
    // RSS 2.0
    if (parsed.rss?.channel?.[0]?.item) {
        return parsed.rss.channel[0].item
    }

    // Atom
    if (parsed.feed?.entry) {
        return parsed.feed.entry
    }

    // RDF
    if (parsed.rdf?.item) {
        return parsed.rdf.item
    }

    // Fallback - try to find items anywhere
    const findItems = (obj, depth = 0) => {
        if (depth > 5) return []

        if (Array.isArray(obj.item)) return obj.item
        if (Array.isArray(obj.entry)) return obj.entry

        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const items = findItems(obj[key], depth + 1)
                if (items.length > 0) return items
            }
        }

        return []
    }

    return findItems(parsed)
}

/**
 * Transform RSS item to deal format
 */
function transformRSSItem(item, source) {
    return {
        title: extractText(item.title),
        url: extractUrl(item),
        description: extractDescription(item),
        image_url: extractImage(item),
        merchant: extractMerchant(item, source),
        category: extractCategory(item),
        published_at: extractDate(item),
        source,
        external_id: extractGuid(item),
        coupon_code: extractCouponCode(item)
    }
}

/**
 * Extract text from RSS field
 */
function extractText(field) {
    if (!field) return null

    // Handle array
    if (Array.isArray(field)) {
        field = field[0]
    }

    // Handle object with _ or $t
    if (typeof field === 'object') {
        field = field._ || field.$t || field._text || JSON.stringify(field)
    }

    // Clean HTML and whitespace
    return cleanText(String(field))
}

/**
 * Extract URL from item
 */
function extractUrl(item) {
    // Try link field
    let url = extractText(item.link)

    // Atom format
    if (!url && item.link?.[0]?.href) {
        url = item.link[0].href
    }

    // Try guid
    if (!url && item.guid) {
        const guid = extractText(item.guid)
        if (guid && guid.startsWith('http')) {
            url = guid
        }
    }

    // Try enclosure
    if (!url && item.enclosure?.[0]?.url) {
        url = item.enclosure[0].url
    }

    return url?.trim()
}

/**
 * Extract and clean description
 * Removes BBCode tags, source references, and cleans up formatting
 */
function extractDescription(item) {
    let desc = extractText(item.description) ||
        extractText(item.summary) ||
        extractText(item.content) ||
        extractText(item['content:encoded']) ||
        null

    if (!desc) return null

    // Clean up BBCode and source references
    desc = desc
        // Remove [URL] tags but keep the visible text
        .replace(/\[url[^\]]*\]/gi, '')
        .replace(/\[\/url\]/gi, '')
        // Remove [LIST] and [*] tags
        .replace(/\[LIST\]/gi, '')
        .replace(/\[\/LIST\]/gi, '')
        .replace(/\[\*\]/gi, '• ')
        // Remove [B], [I], [U] tags
        .replace(/\[B\]/gi, '')
        .replace(/\[\/B\]/gi, '')
        .replace(/\[I\]/gi, '')
        .replace(/\[\/I\]/gi, '')
        .replace(/\[U\]/gi, '')
        .replace(/\[\/U\]/gi, '')
        // Remove [domain.com] references (e.g., [amazon.com], [slickdeals.net])
        .replace(/\[[a-z0-9-]+\.(com|net|org|io)\]/gi, '')
        // Clean up asterisks used for bold (** or *)
        .replace(/\*+/g, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        // Clean up leading/trailing whitespace
        .trim()

    return desc || null
}

/**
 * Extract image URL
 */
function extractImage(item) {
    // Try enclosure
    if (item.enclosure) {
        const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure]
        for (const enc of enclosures) {
            const type = enc.type || enc.$.type
            const url = enc.url || enc.$.url
            if (type?.startsWith('image/') && url) {
                return url
            }
        }
    }

    // Try media:content
    if (item['media:content']) {
        const media = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content']
        if (media.url || media.$.url) {
            return media.url || media.$.url
        }
    }

    // Try media:thumbnail
    if (item['media:thumbnail']) {
        const thumb = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail']
        if (thumb.url || thumb.$.url) {
            return thumb.url || thumb.$.url
        }
    }

    // Try image field
    if (item.image) {
        const img = Array.isArray(item.image) ? item.image[0] : item.image
        if (typeof img === 'string') return img
        if (img.url) return extractText(img.url)
    }

    // Extract from description HTML
    const desc = item.description?.[0] || item['content:encoded']?.[0]
    if (typeof desc === 'string') {
        const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/)
        if (imgMatch) return imgMatch[1]
    }

    return null
}

/**
 * Extract merchant from deal description/title
 * Slickdeals format: "Amazon [amazon.com] has..." or "*Walmart [walmart.com]* has..."
 */
function extractMerchant(item, source) {
    const title = extractText(item.title) || ''
    const description = extractText(item.description) || ''
    const content = `${title} ${description}`.toLowerCase()

    // Known merchant domain patterns (check description for [merchant.com] format)
    const domainPatterns = [
        { pattern: /\[amazon\.com\]/i, name: 'Amazon' },
        { pattern: /\[walmart\.com\]/i, name: 'Walmart' },
        { pattern: /\[target\.com\]/i, name: 'Target' },
        { pattern: /\[bestbuy\.com\]/i, name: 'Best Buy' },
        { pattern: /\[ebay\.com\]/i, name: 'eBay' },
        { pattern: /\[newegg\.com\]/i, name: 'Newegg' },
        { pattern: /\[homedepot\.com\]/i, name: 'Home Depot' },
        { pattern: /\[lowes\.com\]/i, name: "Lowe's" },
        { pattern: /\[costco\.com\]/i, name: 'Costco' },
        { pattern: /\[kohls\.com\]/i, name: "Kohl's" },
        { pattern: /\[macys\.com\]/i, name: "Macy's" },
        { pattern: /\[nordstrom\.com\]/i, name: 'Nordstrom' },
        { pattern: /\[adidas\.com\]/i, name: 'Adidas' },
        { pattern: /\[nike\.com\]/i, name: 'Nike' },
        { pattern: /\[bhphotovideo\.com\]/i, name: 'B&H Photo' },
        { pattern: /\[samsclub\.com\]/i, name: "Sam's Club" },
        { pattern: /\[costco\.com\]/i, name: 'Costco' },
        { pattern: /\[staples\.com\]/i, name: 'Staples' },
        { pattern: /\[dell\.com\]/i, name: 'Dell' },
        { pattern: /\[hp\.com\]/i, name: 'HP' },
        { pattern: /\[lenovo\.com\]/i, name: 'Lenovo' },
        { pattern: /\[microsoft\.com\]/i, name: 'Microsoft' },
        { pattern: /\[cvs\.com\]/i, name: 'CVS' },
        { pattern: /\[walgreens\.com\]/i, name: 'Walgreens' }
    ]

    // Check for [merchant.com] format in description
    for (const { pattern, name } of domainPatterns) {
        if (pattern.test(description)) {
            return name
        }
    }

    // Fallback: extract any [*.com] pattern from description
    const bracketMatch = description.match(/\[([a-z0-9-]+)\.com\]/i)
    if (bracketMatch) {
        return capitalize(bracketMatch[1].replace(/-/g, ' '))
    }

    // Check for "via Merchant" or "at Merchant" patterns
    const viaPattern = /(?:via|at|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
    const viaMatch = title.match(viaPattern) || description.match(viaPattern)
    if (viaMatch) {
        return viaMatch[1]
    }

    // Final fallback: check title for known merchant names
    const merchantKeywords = [
        'Amazon', 'Walmart', 'Target', 'Best Buy', 'Home Depot', 'Costco', 'eBay', 'Newegg',
        'CVS', 'Walgreens', 'HP', 'Dell', 'Lenovo', 'Microsoft', 'Adidas', 'Nike', 'Macy',
        'Nordstrom', "Kohl's", "Lowe's", 'Staples', 'B&H Photo', "Sam's Club", 'Sephora', 'IKEA'
    ]
    for (const merchant of merchantKeywords) {
        if (title.includes(merchant) || description.includes(merchant)) {
            return merchant
        }
    }

    return null
}

/**
 * Extract category
 */
function extractCategory(item) {
    if (item.category) {
        const cats = Array.isArray(item.category) ? item.category : [item.category]
        const cat = extractText(cats[0])
        if (cat && cat.length < 50) return cat
    }

    return null
}

/**
 * Extract publication date
 */
function extractDate(item) {
    const dateStr = extractText(item.pubDate) ||
        extractText(item.published) ||
        extractText(item.date) ||
        extractText(item['dc:date'])

    if (dateStr) {
        try {
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
                return date.toISOString()
            }
        } catch {
            // Ignore
        }
    }

    return null
}

/**
 * Extract GUID for deduplication
 */
function extractGuid(item) {
    const guid = extractText(item.guid) || extractText(item.id)

    // Clean up GUID - remove URL if it's the same as link
    if (guid) {
        const url = extractUrl(item)
        if (guid !== url) {
            return guid
        }
    }

    return null
}

/**
 * Sanitize XML to fix common malformed RSS issues
 */
function sanitizeXML(xml) {
    if (!xml) return ''

    return xml
        // Fix unencoded ampersands (common issue)
        .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/g, '&amp;')
        // Fix unencoded < and > in text content (tricky but helps)
        .replace(/<(?![/a-zA-Z!?])/g, '&lt;')
        // Remove control characters that break XML
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Trim whitespace
        .trim()
}

/**
 * Clean HTML and normalize text
 */
function cleanText(text) {
    if (!text) return ''

    return text
        .replace(/<[^>]+>/g, '')     // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
        .replace(/\s+/g, ' ')         // Normalize whitespace
        .trim()
}

/**
 * Capitalize string
 */
function capitalize(str) {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Extract coupon code from description
 */
function extractCouponCode(item) {
    const description = extractText(item.description) || ''
    const title = extractText(item.title) || ''
    const text = `${title} ${description}`

    // Pattern 1: w/ code CODE
    const withCodePattern = /(?:w\/|with|use|via)\s+(?:coupon\s+|promo\s+)?code\s+([A-Z0-9]+)/i
    const match1 = text.match(withCodePattern)
    if (match1) return match1[1].toUpperCase()

    // Pattern 2: code: CODE
    const codeColonPattern = /(?:coupon|promo)?\s*code:\s*([A-Z0-9]+)/i
    const match2 = text.match(codeColonPattern)
    if (match2) return match2[1].toUpperCase()

    // Pattern 3: explicit Coupon Code: CODE field (sometimes in description HTML)
    const explicitPattern = /Coupon Code:\s*([A-Z0-9]+)/i
    const match3 = text.match(explicitPattern)
    if (match3) return match3[1].toUpperCase()

    return null
}

export default fetchRSSDeals
