/**
 * PRODUCTION-GRADE INGESTION CONFIGURATION
 * Comprehensive settings for all ingestion operations
 */

export const CONFIG = {
    // =====================================================
    // QUEUE SETTINGS
    // =====================================================
    queue: {
        redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryDelayOnFailover: 100,
            retryDelayOnClusterDown: 100,
            connectTimeout: 10000,
            lazyConnect: true
        },

        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: {
                age: 3600, // Keep completed jobs for 1 hour
                count: 1000 // Keep last 1000 completed jobs
            },
            removeOnFail: {
                age: 86400 // Keep failed jobs for 24 hours
            }
        }
    },

    // =====================================================
    // RATE LIMITING
    // =====================================================
    rateLimit: {
        // Global rate limit for all sources
        global: {
            maxRequestsPerSecond: 20,  // Increased from 10
            maxConcurrentJobs: 10      // Increased from 5
        },

        // Per-source defaults
        default: {
            requests: 120,   // Increased from 60
            window: 60000    // 1 minute
        }
    },

    // =====================================================
    // CIRCUIT BREAKER SETTINGS
    // =====================================================
    circuitBreaker: {
        // Number of failures before circuit opens
        failureThreshold: 10,  // Increased from 5

        // Time in ms before attempting to close circuit
        resetTimeout: 30000,   // Reduced from 60000 (30 seconds)

        // Number of successful requests to close circuit
        successThreshold: 2,   // Reduced from 3

        // Time window for counting failures
        monitorWindow: 60000   // Increased from 30000 (1 minute)
    },

    // =====================================================
    // RETRY SETTINGS
    // =====================================================
    retry: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        multiplier: 2,

        // Retryable error codes
        retryableErrors: [
            'ETIMEDOUT',
            'ECONNRESET',
            'ECONNREFUSED',
            'ENOTFOUND',
            'EAI_AGAIN',
            'EPIPE',
            'EHOSTUNREACH',
            'ENETUNREACH',
            'EADDRINUSE',
            'ERR_SOCKET_TIMEOUT'
        ],

        // Retryable HTTP status codes
        retryableStatusCodes: [408, 429, 500, 502, 503, 504, 522, 524]
    },

    // =====================================================
    // VALIDATION SETTINGS
    // =====================================================
    validation: {
        deal: {
            minTitleLength: 10,
            maxTitleLength: 500,
            minDescriptionLength: 0,
            maxDescriptionLength: 5000,
            minDiscount: 1, // Minimum 1% discount
            maxDiscount: 99, // Maximum 99% discount
            minPrice: 0,
            maxPrice: 1000000
        },

        coupon: {
            minCodeLength: 2,
            maxCodeLength: 50,
            minTitleLength: 5,
            maxTitleLength: 300
        }
    },

    // =====================================================
    // DEDUPLICATION SETTINGS
    // =====================================================
    deduplication: {
        // Title similarity threshold (0-1)
        titleSimilarityThreshold: 0.85,

        // Price difference threshold (percentage)
        priceVarianceThreshold: 0.05, // 5%

        // Time window for similarity check
        lookbackDays: 7,

        // Maximum candidates to check
        maxCandidates: 100
    },

    // =====================================================
    // EXPIRY SETTINGS
    // =====================================================
    expiry: {
        // Schedule: Every hour at minute 0
        schedule: '0 * * * *',

        // Days before deleting expired deals
        dealRetentionDays: 60,

        // Days before deleting expired coupons
        couponRetentionDays: 90,

        // Batch size for expiry operations
        batchSize: 500
    },

    // =====================================================
    // LOGGING SETTINGS
    // =====================================================
    logging: {
        level: process.env.LOG_LEVEL || 'info',

        // Log levels: error, warn, info, debug, trace
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        },

        // Include stack traces for errors
        includeStackTrace: process.env.NODE_ENV !== 'production',

        // Log to database
        logToDatabase: true,

        // Max context size in bytes
        maxContextSize: 10000
    },

    // =====================================================
    // MONITORING SETTINGS
    // =====================================================
    monitoring: {
        // Health check interval
        healthCheckInterval: 30000, // 30 seconds

        // Metrics collection interval
        metricsInterval: 60000, // 1 minute

        // Alert thresholds
        alerts: {
            errorRateThreshold: 0.1, // 10% error rate
            queueDepthThreshold: 1000,
            processingTimeThreshold: 30000 // 30 seconds
        }
    },

    // =====================================================
    // HTTP CLIENT SETTINGS
    // =====================================================
    http: {
        timeout: 30000, // 30 seconds

        headers: {
            'User-Agent': 'SavebucksBot/1.0 (+https://savebucks.com)',
            'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        },

        // Proxy settings (optional)
        proxy: process.env.HTTP_PROXY ? {
            host: process.env.PROXY_HOST,
            port: parseInt(process.env.PROXY_PORT) || 8080,
            auth: process.env.PROXY_AUTH ? {
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD
            } : undefined
        } : undefined
    },

    // =====================================================
    // AUTO-APPROVAL SETTINGS
    // All deals go to pending state for admin review
    // =====================================================
    autoApproval: {
        // DISABLED: All deals require admin approval
        // Set trustedSources to [] to require approval for all sources
        trustedSources: [],

        // Minimum quality score (not used when trustedSources is empty)
        minQualityScore: 0.7,

        // Require verified company (not used when trustedSources is empty)
        requireVerifiedCompany: false
    },

    // =====================================================
    // DAILY CAPS - Safety limits per source
    // =====================================================
    dailyCaps: {
        // Default cap for all sources
        default: 500,

        // Per-source overrides
        slickdeals_rss: 200,
        dealnews_rss: 200,
        slickdeals_coupons: 100,
        dealnews_coupons: 100,
        techbargains_rss: 150
    }
}

export default CONFIG
