/**
 * MERCHANT URL RESOLVER
 * Extracts actual merchant URLs from deal aggregator pages (Slickdeals, etc.)
 */

import httpClient from './httpClient.js'
import logger from './logger.js'

const log = logger.child({ component: 'urlResolver' })

// Cache resolved URLs to avoid re-fetching
const urlCache = new Map()
const CACHE_TTL = 3600000 // 1 hour

/**
 * Resolve a deal URL to the actual merchant URL
 * Handles Slickdeals, DealNews, etc. which use JS redirects
 */
export async function resolveMerchantUrl(url) {
    if (!url) return null

    // Check cache
    const cached = urlCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.merchantUrl
    }

    try {
        // Identify source and apply appropriate extractor
        const hostname = new URL(url).hostname.toLowerCase()

        let merchantUrl = url

        if (hostname.includes('slickdeals.net')) {
            merchantUrl = await extractSlickdealsUrl(url) || url
        } else if (hostname.includes('dealnews.com')) {
            merchantUrl = await extractDealNewsUrl(url) || url
        } else if (hostname.includes('techbargains.com')) {
            merchantUrl = await extractTechBargainsUrl(url) || url
        } else {
            // Try HTTP redirect for other sources
            merchantUrl = await httpClient.getFinalUrl(url) || url
        }

        // Cache result
        urlCache.set(url, { merchantUrl, timestamp: Date.now() })

        if (merchantUrl !== url) {
            log.info('Resolved merchant URL', {
                from: url.substring(0, 60),
                to: merchantUrl.substring(0, 60)
            })
        }

        return merchantUrl

    } catch (error) {
        log.debug('URL resolution failed', { url: url.substring(0, 60), error: error.message })
        return url
    }
}

/**
 * Extract merchant URL from Slickdeals page
 * Slickdeals uses Next.js with __NEXT_DATA__ script containing merchant URLs
 */
async function extractSlickdealsUrl(url) {
    try {
        const html = await fetchPage(url)
        if (!html) return null

        // Method 1: Parse __NEXT_DATA__ script for merchant URLs
        const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i)
        if (nextDataMatch) {
            try {
                const data = JSON.parse(nextDataMatch[1])
                // Search for URLs in the JSON that match known merchants
                const merchantUrl = findMerchantUrlInJson(data)
                if (merchantUrl) {
                    return cleanUrl(merchantUrl)
                }
            } catch (e) {
                // JSON parse failed, continue to other methods
            }
        }

        // Method 2: Look for data-product-exitwebsite attribute to identify merchant
        const exitWebsiteMatch = html.match(/data-product-exitwebsite=["']([^"']+)["']/i)
        const merchantDomain = exitWebsiteMatch ? exitWebsiteMatch[1] : null

        // Method 3: Follow /click? or /goto/ or /lno/ links (Slickdeals redirect system)
        const clickMatch = html.match(/href=["'](https?:\/\/(?:www\.)?slickdeals\.net\/(?:click|goto|lno|pno)[^"']+)["']/i)
        if (clickMatch) {
            try {
                const merchantUrl = await httpClient.getFinalUrl(clickMatch[1])
                if (merchantUrl && isValidMerchant(merchantUrl)) {
                    return cleanUrl(merchantUrl)
                }
            } catch {
                // Redirect failed, continue
            }
        }

        // Method 4: Search HTML for direct merchant URLs if we know the domain
        if (merchantDomain) {
            const directUrlRegex = new RegExp(`https?://(?:www\\.)?${merchantDomain.replace('.', '\\.')}[^"'\\s]+`, 'i')
            const directMatch = html.match(directUrlRegex)
            if (directMatch && isValidMerchant(directMatch[0])) {
                return cleanUrl(directMatch[0])
            }
        }

        // Method 5: Look for popUrl or outclickUrl in any script
        const jsUrlMatch = html.match(/(?:popUrl|outclickUrl|dealUrl|productUrl|merchantUrl)\s*[:=]\s*["']([^"']+)["']/i)
        if (jsUrlMatch && isValidMerchant(jsUrlMatch[1])) {
            return cleanUrl(jsUrlMatch[1])
        }

        return null
    } catch (error) {
        log.debug('Slickdeals extraction failed', { error: error.message })
        return null
    }
}

/**
 * Recursively search JSON for merchant URLs
 */
function findMerchantUrlInJson(obj, depth = 0) {
    if (depth > 10 || !obj) return null

    if (typeof obj === 'string') {
        // Check if it's a valid merchant URL
        if (obj.startsWith('http') && isValidMerchant(obj) && !obj.includes('slickdeals')) {
            return obj
        }
        return null
    }

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findMerchantUrlInJson(item, depth + 1)
            if (result) return result
        }
        return null
    }

    if (typeof obj === 'object') {
        // Prioritize keys that are likely to contain merchant URLs
        const priorityKeys = ['outclickUrl', 'productUrl', 'dealUrl', 'merchantUrl', 'url', 'href', 'link']
        for (const key of priorityKeys) {
            if (obj[key]) {
                const result = findMerchantUrlInJson(obj[key], depth + 1)
                if (result) return result
            }
        }
        // Then search all other keys
        for (const key in obj) {
            if (!priorityKeys.includes(key)) {
                const result = findMerchantUrlInJson(obj[key], depth + 1)
                if (result) return result
            }
        }
    }

    return null
}

/**
 * Check if URL is a valid merchant (not CDN, font, social media, etc.)
 */
function isValidMerchant(url) {
    if (!url || !url.startsWith('http')) return false

    const urlLower = url.toLowerCase()

    // Exclude list - CDNs, fonts, assets, social, app stores, etc.
    const excludePatterns = [
        'googleapis.com', 'gstatic.com', 'google.com/recaptcha',
        'googletagmanager', 'google-analytics', 'doubleclick',
        'facebook.com', 'twitter.com', 'instagram.com', 'pinterest.com',
        'youtube.com', 'linkedin.com', 'tiktok.com',
        'cdn.', 'static.', 'assets.', 'images.', 'img.',
        '.css', '.js', '.png', '.jpg', '.gif', '.svg', '.woff', '.ttf',
        'fonts.', 'cloudflare', 'akamai', 'fastly',
        'slickdeals.net', 'dealnews.com', 'techbargains.com',
        'shareasale.com', 'linksynergy.com', 'impact.com',
        'gravatar.com', 'wp.com', 'wordpress.com',
        // App stores - DO NOT extract these!
        'itunes.apple.com', 'apps.apple.com', 'play.google.com',
        'microsoft.com/store', 'amazon.com/app', 'onelink.me',
        'app.adjust.com', 'appsflyer.com', 'branch.io'
    ]

    for (const pattern of excludePatterns) {
        if (urlLower.includes(pattern)) return false
    }

    // Must include list - known merchants
    const merchantPatterns = [
        'amazon.com', 'walmart.com', 'target.com', 'bestbuy.com',
        'ebay.com', 'newegg.com', 'homedepot.com', 'lowes.com',
        'costco.com', 'samsclub.com', 'bjs.com',
        'kohls.com', 'macys.com', 'nordstrom.com', 'jcpenney.com',
        'adidas.com', 'nike.com', 'underarmour.com', 'reebok.com',
        'apple.com', 'dell.com', 'hp.com', 'lenovo.com', 'microsoft.com',
        'samsung.com', 'lg.com', 'sony.com', 'bose.com',
        'wayfair.com', 'overstock.com', 'bedbathandbeyond.com',
        'gamestop.com', 'bhphotovideo.com', 'adorama.com',
        'staples.com', 'officedepot.com', 'dickssportinggoods.com',
        'rei.com', 'backcountry.com', 'moosejaw.com',
        'zappos.com', 'dsw.com', 'footlocker.com',
        'sephora.com', 'ulta.com', 'cvs.com', 'walgreens.com',
        'petsmart.com', 'petco.com', 'chewy.com',
        'williams-sonoma.com', 'potterybarn.com', 'crateandbarrel.com',
        'ikea.com', 'ashleyfurniture.com',
        'gap.com', 'oldnavy.com', 'bananarepublic.com',
        'hm.com', 'zara.com', 'uniqlo.com',
        'rakuten.com', 'shopify.com', 'etsy.com'
    ]

    for (const pattern of merchantPatterns) {
        if (urlLower.includes(pattern)) return true
    }

    return false
}

/**
 * Extract merchant URL from DealNews page
 */
async function extractDealNewsUrl(url) {
    try {
        const html = await fetchPage(url)
        if (!html) return null

        // Look for the actual deal link
        const linkMatch = html.match(/data-click-url=["']([^"']+)["']/i) ||
            html.match(/"dealUrl":\s*"([^"]+)"/i) ||
            html.match(/href=["']([^"']+)["'][^>]*class="[^"]*dealButton/i)

        if (linkMatch) {
            return cleanUrl(linkMatch[1])
        }

        return null
    } catch (error) {
        log.debug('DealNews extraction failed', { error: error.message })
        return null
    }
}

/**
 * Extract merchant URL from TechBargains page
 */
async function extractTechBargainsUrl(url) {
    try {
        const html = await fetchPage(url)
        if (!html) return null

        const linkMatch = html.match(/data-outbound-url=["']([^"']+)["']/i) ||
            html.match(/href=["']([^"']+)["'][^>]*class="[^"]*deal-link/i)

        if (linkMatch) {
            return cleanUrl(linkMatch[1])
        }

        return null
    } catch (error) {
        log.debug('TechBargains extraction failed', { error: error.message })
        return null
    }
}

/**
 * Fetch page HTML
 */
async function fetchPage(url) {
    try {
        const html = await httpClient.get('url-resolver', url, {
            timeout: 15000,
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        return typeof html === 'string' ? html : null
    } catch (error) {
        return null
    }
}

/**
 * Clean and decode URL
 */
function cleanUrl(url) {
    if (!url) return null

    let cleaned = url

    // Remove HTML tags and artifacts
    cleaned = cleaned
        .replace(/<[^>]*>/g, '')           // Remove HTML tags like </a>, <wbr/>, etc.
        .replace(/u003C[^>]*>/gi, '')      // Remove Unicode-encoded tags like u003C/a>
        .replace(/\\u003C[^>]*>/gi, '')    // Remove escaped Unicode tags
        .replace(/<wbr\/?>/gi, '')         // Remove word break tags
        .replace(/&lt;[^&]*&gt;/gi, '')    // Remove HTML entity encoded tags

    // Decode HTML entities
    cleaned = cleaned
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\\u002F/g, '/')
        .replace(/\\/g, '')

    // Handle URL-encoded URLs
    if (cleaned.includes('%3A%2F%2F')) {
        try {
            cleaned = decodeURIComponent(cleaned)
        } catch { }
    }

    // Truncate at first invalid URL character (space, <, >, etc.)
    const invalidCharMatch = cleaned.match(/[\s<>"'{}|\\^\[\]`]/)
    if (invalidCharMatch) {
        cleaned = cleaned.substring(0, invalidCharMatch.index)
    }

    // Validate it's still a valid URL
    try {
        new URL(cleaned)
        return cleaned
    } catch {
        return null
    }
}

/**
 * Clear URL cache
 */
export function clearUrlCache() {
    urlCache.clear()
}

export default {
    resolveMerchantUrl,
    clearUrlCache
}
