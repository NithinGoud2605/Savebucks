/**
 * PRODUCTION-GRADE LOGGER
 * Structured logging with multiple outputs and context tracking
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import CONFIG from '../config/ingestion.config.js'

// Load environment variables FIRST
dotenv.config()

// Lazy-loaded Supabase client
let supabase = null

function getSupabase() {
    if (!supabase) {
        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

        if (url && key) {
            supabase = createClient(url, key, {
                auth: { autoRefreshToken: false, persistSession: false }
            })
        }
    }
    return supabase
}

// Log level values
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
}

// Current log level
const currentLevel = LOG_LEVELS[CONFIG.logging.level] || LOG_LEVELS.info

// Format timestamp
const timestamp = () => new Date().toISOString()

// Truncate context if too large
const truncateContext = (context) => {
    const str = JSON.stringify(context)
    if (str.length > CONFIG.logging.maxContextSize) {
        return {
            _truncated: true,
            _originalSize: str.length,
            _preview: str.substring(0, 500) + '...'
        }
    }
    return context
}

// Format log message
const formatMessage = (level, message, context = {}) => {
    return {
        timestamp: timestamp(),
        level,
        message,
        context: truncateContext(context),
        pid: process.pid
    }
}

// Output to console with colors
const consoleOutput = (level, formatted) => {
    const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[35m', // Magenta
        trace: '\x1b[90m'  // Gray
    }
    const reset = '\x1b[0m'

    const color = colors[level] || ''
    const prefix = `${color}[${formatted.timestamp}] [${level.toUpperCase()}]${reset}`

    if (level === 'error') {
        console.error(prefix, formatted.message, formatted.context)
    } else if (level === 'warn') {
        console.warn(prefix, formatted.message, formatted.context)
    } else {
        console.log(prefix, formatted.message, Object.keys(formatted.context).length > 0 ? formatted.context : '')
    }
}

// Log to database (errors only by default)
const dbOutput = async (level, formatted, errorStack = null) => {
    if (!CONFIG.logging.logToDatabase) return
    if (level !== 'error') return

    const db = getSupabase()
    if (!db) return // Skip if Supabase not configured

    try {
        await db.from('ingestion_errors').insert({
            source: formatted.context?.source || 'system',
            error_type: formatted.context?.errorType || 'runtime',
            error_message: formatted.message,
            error_stack: errorStack,
            context: formatted.context
        })
    } catch (err) {
        // Avoid infinite loop - just log to console
        console.error('[Logger] Failed to log to database:', err.message)
    }
}

/**
 * Main logger object
 */
export const logger = {
    error: (message, context = {}, error = null) => {
        if (currentLevel >= LOG_LEVELS.error) {
            const formatted = formatMessage('error', message, context)
            consoleOutput('error', formatted)
            dbOutput('error', formatted, error?.stack || null)
        }
    },

    warn: (message, context = {}) => {
        if (currentLevel >= LOG_LEVELS.warn) {
            const formatted = formatMessage('warn', message, context)
            consoleOutput('warn', formatted)
        }
    },

    info: (message, context = {}) => {
        if (currentLevel >= LOG_LEVELS.info) {
            const formatted = formatMessage('info', message, context)
            consoleOutput('info', formatted)
        }
    },

    debug: (message, context = {}) => {
        if (currentLevel >= LOG_LEVELS.debug) {
            const formatted = formatMessage('debug', message, context)
            consoleOutput('debug', formatted)
        }
    },

    trace: (message, context = {}) => {
        if (currentLevel >= LOG_LEVELS.trace) {
            const formatted = formatMessage('trace', message, context)
            consoleOutput('trace', formatted)
        }
    },

    // Create child logger with preset context
    child: (defaultContext) => ({
        error: (msg, ctx = {}) => logger.error(msg, { ...defaultContext, ...ctx }),
        warn: (msg, ctx = {}) => logger.warn(msg, { ...defaultContext, ...ctx }),
        info: (msg, ctx = {}) => logger.info(msg, { ...defaultContext, ...ctx }),
        debug: (msg, ctx = {}) => logger.debug(msg, { ...defaultContext, ...ctx }),
        trace: (msg, ctx = {}) => logger.trace(msg, { ...defaultContext, ...ctx })
    })
}

export default logger
