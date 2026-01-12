/**
 * DATA SOURCE REGISTRY
 * Configuration for all deal/coupon ingestion sources
 * 
 * All deals go to PENDING state for admin review
 */

export const SOURCES = {
    // ========================================
    // RSS FEEDS - Always available, legal
    // ========================================

    slickdeals_rss: {
        enabled: true,
        type: 'rss',
        priority: 1,
        schedule: '*/25 * * * *', // Every 25 minutes
        rateLimit: { requests: 1, window: 1500000 }, // 1 request per 25 min
        config: {
            feedUrl: 'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1'
        },
        fetcher: './rssFetcher.js'
    },

    dealnews_rss: {
        enabled: false, // Disabled - returns 0 items, feed may be blocked or format changed
        type: 'rss',
        priority: 2,
        schedule: '*/15 * * * *', // Every 15 minutes
        rateLimit: { requests: 1, window: 900000 },
        config: {
            feedUrl: 'https://www.dealnews.com/rss/',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        },
        fetcher: './rssFetcher.js'
    },

    techbargains_rss: {
        enabled: false, // Disabled - permanently 403 Forbidden
        type: 'rss',
        priority: 3,
        schedule: '0 */2 * * *', // Every 2 hours
        rateLimit: { requests: 1, window: 7200000 },
        config: {
            feedUrl: 'https://www.techbargains.com/rss',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        },
        fetcher: './rssFetcher.js'
    },

    // ========================================
    // COUPON FEEDS
    // ========================================

    slickdeals_coupons: {
        enabled: true,
        type: 'rss',
        entity: 'deal', // Ingest as deals to unify content
        priority: 2,
        schedule: '*/25 * * * *', // Every 25 minutes
        rateLimit: { requests: 1, window: 1500000 },
        config: {
            // Search for "coupon" | "code" on Slickdeals
            feedUrl: 'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1&q=coupon+code'
        },
        fetcher: './rssFetcher.js'
    },

    dealnews_coupons: {
        enabled: false, // Disabled - returns 0 items, feed may be blocked
        type: 'rss',
        entity: 'coupon',
        priority: 2,
        schedule: '*/30 * * * *', // Every 30 minutes
        rateLimit: { requests: 1, window: 1800000 },
        config: {
            feedUrl: 'https://www.dealnews.com/c494/Coupons/rss/',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        },
        fetcher: './rssFetcher.js'
    },

    // ========================================
    // AFFILIATE APIS - Require API keys
    // ========================================

    cj_affiliate: {
        enabled: false, // Enable after getting API key
        type: 'api',
        priority: 1,
        schedule: '*/30 * * * *', // Every 30 min
        rateLimit: { requests: 1000, window: 3600000 },
        config: {
            apiKey: process.env.CJ_API_KEY,
            websiteId: process.env.CJ_WEBSITE_ID,
            endpoint: 'https://advertiser-lookup.api.cj.com/v3/advertiser-lookup'
        },
        fetcher: './cjAffiliate.js'
    },

    amazon_pa: {
        enabled: false, // Enable after getting API credentials
        type: 'api',
        priority: 1,
        schedule: '*/20 * * * *', // Every 20 min
        rateLimit: { requests: 1, window: 1000 }, // 1 req/sec
        config: {
            accessKey: process.env.AMAZON_ACCESS_KEY,
            secretKey: process.env.AMAZON_SECRET_KEY,
            partnerTag: process.env.AMAZON_PARTNER_TAG,
            region: 'us-east-1'
        },
        fetcher: './amazonPA.js'
    },

    impact: {
        enabled: false, // Enable when approved
        type: 'api',
        priority: 1,
        schedule: '0 */3 * * *', // Every 3 hours
        rateLimit: { requests: 100, window: 60000 },
        config: {
            accountSid: process.env.IMPACT_ACCOUNT_SID,
            authToken: process.env.IMPACT_AUTH_TOKEN,
            endpoint: 'https://api.impact.com'
        },
        fetcher: './impactAPI.js'
    },

    shareasale: {
        enabled: false,
        type: 'api',
        priority: 2,
        schedule: '0 */4 * * *', // Every 4 hours
        rateLimit: { requests: 50, window: 60000 },
        config: {
            token: process.env.SHAREASALE_TOKEN,
            secret: process.env.SHAREASALE_SECRET
        },
        fetcher: './shareasaleAPI.js'
    },

    // ========================================
    // WEB SCRAPERS - Use carefully, low priority
    // ========================================

    walmart_scraper: {
        enabled: false, // Enable with caution
        type: 'scraper',
        priority: 4,
        schedule: '0 */8 * * *', // Every 8 hours
        rateLimit: { requests: 5, window: 60000 },
        config: {
            baseUrl: 'https://www.walmart.com/shop/deals',
            useProxy: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        fetcher: './webScraper.js'
    }
}

/**
 * Get enabled sources
 */
export function getEnabledSources() {
    return Object.entries(SOURCES)
        .filter(([_, config]) => config.enabled)
        .map(([key, config]) => ({ key, ...config }))
        .sort((a, b) => a.priority - b.priority)
}

/**
 * Get sources by type
 */
export function getSourcesByType(type) {
    return Object.entries(SOURCES)
        .filter(([_, config]) => config.enabled && config.type === type)
        .map(([key, config]) => ({ key, ...config }))
}

/**
 * Get source by key
 */
export function getSource(key) {
    return SOURCES[key] ? { key, ...SOURCES[key] } : null
}

/**
 * Check if source is enabled
 */
export function isSourceEnabled(key) {
    return SOURCES[key]?.enabled === true
}

export default SOURCES
