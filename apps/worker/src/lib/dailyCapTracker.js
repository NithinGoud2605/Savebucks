/**
 * DAILY CAP TRACKER
 * Limits items ingested per source per day for safety
 */

import logger from './logger.js'
import CONFIG from '../config/ingestion.config.js'

const log = logger.child({ component: 'dailyCapTracker' })

// In-memory tracking (resets on restart, which is fine for safety limits)
const dailyCounts = new Map()
let lastResetDate = new Date().toDateString()

/**
 * Get the cap for a source
 */
function getCapForSource(source) {
    const caps = CONFIG.dailyCaps || {}
    return caps[source] || caps.default || 500
}

/**
 * Check if source has reached daily cap
 */
export function checkDailyCap(source) {
    maybeResetCounts()

    const current = dailyCounts.get(source) || 0
    const cap = getCapForSource(source)
    const remaining = cap - current

    return {
        allowed: remaining > 0,
        current,
        cap,
        remaining: Math.max(0, remaining)
    }
}

/**
 * Increment the daily count for a source
 */
export function incrementDailyCount(source, amount = 1) {
    maybeResetCounts()

    const current = dailyCounts.get(source) || 0
    dailyCounts.set(source, current + amount)

    const cap = getCapForSource(source)
    const newCount = current + amount

    if (newCount >= cap) {
        log.warn('Daily cap reached', { source, count: newCount, cap })
    }

    return newCount
}

/**
 * Get all daily counts
 */
export function getDailyCounts() {
    maybeResetCounts()
    return Object.fromEntries(dailyCounts)
}

/**
 * Reset counts at midnight
 */
function maybeResetCounts() {
    const today = new Date().toDateString()
    if (today !== lastResetDate) {
        log.info('Resetting daily caps', {
            previousDate: lastResetDate,
            counts: Object.fromEntries(dailyCounts)
        })
        dailyCounts.clear()
        lastResetDate = today
    }
}

export default {
    checkDailyCap,
    incrementDailyCount,
    getDailyCounts
}
