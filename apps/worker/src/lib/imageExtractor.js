/**
 * IMAGE EXTRACTOR
 * Extracts images from web pages when RSS doesn't provide them
 */

import httpClient from './httpClient.js'
import logger from './logger.js'

const log = logger.child({ component: 'imageExtractor' })

// Simple in-memory cache for extracted images
const imageCache = new Map()
const CACHE_TTL = 3600000 // 1 hour

/**
 * Extract single image from URL (for backward compatibility)
 */
export async function extractImageFromUrl(url) {
    if (!url) return null

    // Check cache first
    const cached = imageCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.imageUrl
    }

    try {
        // Fetch page HTML
        const html = await httpClient.get('image-extractor', url, {
            timeout: 10000,
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (typeof html !== 'string') {
            log.warn('Fetch did not return string', { url, type: typeof html })
            return null
        }

        log.debug('Page fetched for image extraction', { url: url.substring(0, 50), htmlLength: html.length })

        // Try extraction methods in order of priority
        const ogImage = extractOGImage(html)
        const twitterImage = extractTwitterImage(html)
        const schemaImage = extractSchemaImage(html)
        const contentImage = extractFirstContentImage(html)

        const imageUrl = ogImage || twitterImage || schemaImage || contentImage

        if (!imageUrl) {
            log.debug('No image found on page', { url: url.substring(0, 50) })
        }

        // Validate and cache
        if (imageUrl && isValidImageUrl(imageUrl)) {
            const absoluteUrl = makeAbsoluteUrl(imageUrl, url)
            imageCache.set(url, { imageUrl: absoluteUrl, timestamp: Date.now() })
            return absoluteUrl
        }

        return null

    } catch (error) {
        log.warn('Image extraction error', { url, error: error.message })
        return null
    }
}

/**
 * Extract multiple images from URL (up to 5)
 * Returns array of image URLs
 * For Slickdeals: targets the deal-specific gallery, excludes sidebar/popular deals
 */
export async function extractMultipleImagesFromUrl(url, maxImages = 5) {
    if (!url) return []

    try {
        const html = await httpClient.get('image-extractor', url, {
            timeout: 10000,
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (typeof html !== 'string') {
            return []
        }

        const images = new Set()
        const isSlickdeals = url.includes('slickdeals.net')

        // 1. Add OG image (primary - always reliable)
        const ogImage = extractOGImage(html)
        if (ogImage && isValidImageUrl(ogImage)) {
            images.add(makeAbsoluteUrl(ogImage, url))
        }

        // 2. Add Twitter image if different
        const twitterImage = extractTwitterImage(html)
        if (twitterImage && isValidImageUrl(twitterImage)) {
            images.add(makeAbsoluteUrl(twitterImage, url))
        }

        // 3. For Slickdeals, extract from deal-specific gallery only
        if (isSlickdeals) {
            const slickdealsGalleryImages = extractSlickdealsGalleryImages(html)
            for (const img of slickdealsGalleryImages) {
                if (images.size >= maxImages) break
                if (isValidImageUrl(img)) {
                    images.add(makeAbsoluteUrl(img, url))
                }
            }
        } else {
            // For non-Slickdeals sites, use general gallery extraction
            const galleryImages = extractGalleryImages(html)
            for (const img of galleryImages) {
                if (images.size >= maxImages) break
                if (isValidImageUrl(img)) {
                    images.add(makeAbsoluteUrl(img, url))
                }
            }

            const contentImages = extractContentImages(html)
            for (const img of contentImages) {
                if (images.size >= maxImages) break
                if (isValidImageUrl(img)) {
                    images.add(makeAbsoluteUrl(img, url))
                }
            }
        }

        const imageArray = Array.from(images).slice(0, maxImages)

        if (imageArray.length > 0) {
            log.debug('Multiple images extracted', { url: url.substring(0, 50), count: imageArray.length })
        }

        return imageArray

    } catch (error) {
        log.warn('Multi-image extraction error', { url, error: error.message })
        return []
    }
}

/**
 * Extract images from Slickdeals deal-specific gallery
 * Avoids sidebar, popular deals, and other rotating elements
 * Images are hosted on static.slickdealscdn.com
 */
function extractSlickdealsGalleryImages(html) {
    const images = []

    // Method 1: Look for images with dealImage__image class (most reliable)
    // Pattern: <img ... class="dealImage__image" ... src="https://static.slickdealscdn.com/..."
    // Note: src can come before or after class
    const dealImageRegex1 = /src="(https:\/\/static\.slickdealscdn\.com\/attachment\/[^"]+)"[^>]*class="[^"]*dealImage/gi
    let match1
    while ((match1 = dealImageRegex1.exec(html)) !== null) {
        if (!images.includes(match1[1])) {
            images.push(match1[1])
        }
    }

    // Method 2: src after class
    const dealImageRegex2 = /class="[^"]*dealImage__image[^"]*"[^>]*src="(https:\/\/static\.slickdealscdn\.com\/attachment\/[^"]+)"/gi
    let match2
    while ((match2 = dealImageRegex2.exec(html)) !== null) {
        if (!images.includes(match2[1])) {
            images.push(match2[1])
        }
    }

    // Method 3: Look for any slickdealscdn images with attachment in path (inside gallery container)
    // This catches lazyloaded images
    const cdnRegex = /src="(https:\/\/static\.slickdealscdn\.com\/attachment\/[^"]+)"/gi
    let match3
    while ((match3 = cdnRegex.exec(html)) !== null) {
        // Only add if it looks like a product image (has 450x450 or similar)
        if (!images.includes(match3[1]) && (match3[1].includes('450x450') || match3[1].includes('300x300'))) {
            images.push(match3[1])
        }
    }

    // Deduplicate and return unique images only
    return [...new Set(images)].slice(0, 10)
}

// Common Slickdeals site images to exclude (appear on every page)
const EXCLUDED_IMAGE_IDS = [
    '19293397',  // Common site element
    '19293733',  // Common site element
    '19290000',  // Placeholder
    '19285',     // Sidebar ad
    '19286',     // Sidebar ad
    '19292389',  // Common site element (appears in slot 2)
    '19294090',  // Common site element (appears in slot 3)
    '19289068',  // Common site element (appears in slot 4)
    '19293388',  // Common site element (appears in slot 5)
]

/**
 * Check if image is a common site element
 */
function isCommonSiteImage(url) {
    if (!url) return false

    // Check for known common image IDs
    for (const id of EXCLUDED_IMAGE_IDS) {
        if (url.includes(id)) return true
    }

    // Exclude small images (200x200 and 300x300 are typically site elements)
    if (url.includes('200x200')) return true
    if (url.includes('300x300')) return true

    // Only keep 450x450 images (these are usually the product thumbnails)
    // Skip images with other sizes that appear in multiple places
    if (url.includes('/attachment/') && !url.includes('450x450')) {
        return true
    }

    return false
}

/**
 * Extract gallery/product images (Slickdeals specific)
 */
function extractGalleryImages(html) {
    const images = []

    // Match Slickdeals attachment images
    const attachmentRegex = /https?:\/\/slickdeals\.net\/attachment\/[^"'\s<>]+/gi
    const attachmentMatches = html.match(attachmentRegex) || []
    for (const match of attachmentMatches) {
        // Skip common site images and duplicates
        if (!images.includes(match) && !isCommonSiteImage(match)) {
            images.push(match)
        }
    }

    // Match common gallery patterns
    const galleryRegex = /<img[^>]+(?:class|data-src)[^>]*(?:gallery|product|main)[^>]*src=["']([^"']+)["']/gi
    let match
    while ((match = galleryRegex.exec(html)) !== null) {
        if (!images.includes(match[1])) {
            images.push(match[1])
        }
    }

    return images.slice(0, 10)
}

/**
 * Extract content images
 */
function extractContentImages(html) {
    const images = []
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    let match

    while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
        const src = match[1]
        // Skip non-product images
        if (!src.includes('logo') &&
            !src.includes('icon') &&
            !src.includes('avatar') &&
            !src.includes('tracking') &&
            !src.includes('pixel') &&
            !src.includes('1x1') &&
            !src.includes('spacer') &&
            !src.includes('facebook') &&
            !src.includes('twitter') &&
            !src.includes('social')) {
            images.push(src)
        }
    }

    return images
}

/**
 * Extract Open Graph image
 */
function extractOGImage(html) {
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    return match?.[1]
}

/**
 * Extract Twitter card image
 */
function extractTwitterImage(html) {
    const match = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
    return match?.[1]
}

/**
 * Extract image from JSON-LD schema
 */
function extractSchemaImage(html) {
    const match = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (match) {
        try {
            const schema = JSON.parse(match[1])
            return schema.image?.url || schema.image || schema.thumbnailUrl
        } catch {
            return null
        }
    }
    return null
}

/**
 * Extract first meaningful content image
 */
function extractFirstContentImage(html) {
    // Look for images in main content areas
    const contentMatch = html.match(/<(?:main|article|div[^>]+class=["'][^"']*(?:content|product|deal)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:main|article|div)>/i)
    const searchArea = contentMatch?.[1] || html

    // Find first image with reasonable src
    const imgMatch = searchArea.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    if (imgMatch) {
        const src = imgMatch[1]
        // Skip common non-product images
        if (!src.includes('logo') &&
            !src.includes('icon') &&
            !src.includes('avatar') &&
            !src.includes('tracking') &&
            !src.includes('pixel') &&
            !src.includes('1x1')) {
            return src
        }
    }

    return null
}

/**
 * Validate image URL
 */
function isValidImageUrl(url) {
    if (!url) return false

    const lowerUrl = url.toLowerCase()

    // Reject tracking pixels and tiny images
    if (lowerUrl.includes('1x1') || lowerUrl.includes('pixel') || lowerUrl.includes('tracking')) {
        return false
    }

    // Accept common image extensions
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|avif|thumb|bmp|svg)(\?.*)?$/i.test(lowerUrl)

    // Accept CDN patterns
    const isCDN = /cloudinary|imgix|shopify|amazonaws|cloudfront|akamai/i.test(lowerUrl)

    // Accept Slickdeals attachment URLs
    const isSlickdealsImage = lowerUrl.includes('slickdeals.net/attachment')

    // Accept URLs with image-related paths
    const hasImagePath = lowerUrl.includes('/image') || lowerUrl.includes('/thumb') || lowerUrl.includes('/photo')

    return hasImageExtension || isCDN || isSlickdealsImage || hasImagePath
}

/**
 * Convert relative URL to absolute
 */
function makeAbsoluteUrl(imageUrl, pageUrl) {
    if (imageUrl.startsWith('http')) {
        return imageUrl
    }

    try {
        const base = new URL(pageUrl)
        return new URL(imageUrl, base).href
    } catch {
        return imageUrl
    }
}

/**
 * Clear the image cache
 */
export function clearImageCache() {
    imageCache.clear()
}

export default {
    extractImageFromUrl,
    clearImageCache
}
