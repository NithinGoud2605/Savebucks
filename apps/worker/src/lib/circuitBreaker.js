/**
 * CIRCUIT BREAKER IMPLEMENTATION
 * Prevents cascade failures by opening circuit when errors exceed threshold
 */

import CONFIG from '../config/ingestion.config.js'
import logger from './logger.js'

const { failureThreshold, resetTimeout, successThreshold, monitorWindow } = CONFIG.circuitBreaker

// Circuit states
const STATES = {
    CLOSED: 'CLOSED',     // Normal operation
    OPEN: 'OPEN',         // Circuit tripped, rejecting requests
    HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
}

// Store circuit states per source
const circuits = new Map()

/**
 * Get or create circuit state for a source
 */
function getCircuit(source) {
    if (!circuits.has(source)) {
        circuits.set(source, {
            state: STATES.CLOSED,
            failures: [],
            successes: 0,
            lastFailure: null,
            openedAt: null
        })
    }
    return circuits.get(source)
}

/**
 * Check if circuit allows request
 */
export function canExecute(source) {
    const circuit = getCircuit(source)

    switch (circuit.state) {
        case STATES.CLOSED:
            return true

        case STATES.OPEN:
            // Check if reset timeout has passed
            if (Date.now() - circuit.openedAt >= resetTimeout) {
                circuit.state = STATES.HALF_OPEN
                circuit.successes = 0
                logger.info('Circuit half-open', { source, state: circuit.state })
                return true
            }
            return false

        case STATES.HALF_OPEN:
            return true

        default:
            return true
    }
}

/**
 * Record successful execution
 */
export function recordSuccess(source) {
    const circuit = getCircuit(source)

    if (circuit.state === STATES.HALF_OPEN) {
        circuit.successes++

        if (circuit.successes >= successThreshold) {
            circuit.state = STATES.CLOSED
            circuit.failures = []
            circuit.successes = 0
            circuit.openedAt = null
            logger.info('Circuit closed after recovery', { source })
        }
    } else if (circuit.state === STATES.CLOSED) {
        // Clear old failures outside monitor window
        const now = Date.now()
        circuit.failures = circuit.failures.filter(
            time => now - time < monitorWindow
        )
    }
}

/**
 * Record failed execution
 */
export function recordFailure(source, error) {
    const circuit = getCircuit(source)
    const now = Date.now()

    // Remove old failures outside window
    circuit.failures = circuit.failures.filter(
        time => now - time < monitorWindow
    )

    circuit.failures.push(now)
    circuit.lastFailure = now

    if (circuit.state === STATES.HALF_OPEN) {
        // Any failure in half-open reopens circuit
        circuit.state = STATES.OPEN
        circuit.openedAt = now
        logger.warn('Circuit reopened due to failure in half-open', {
            source,
            error: error?.message
        })
    } else if (circuit.state === STATES.CLOSED) {
        // Check if threshold exceeded
        if (circuit.failures.length >= failureThreshold) {
            circuit.state = STATES.OPEN
            circuit.openedAt = now
            logger.error('Circuit opened due to failures', {
                source,
                failureCount: circuit.failures.length,
                threshold: failureThreshold
            })
        }
    }
}

/**
 * Get circuit status for monitoring
 */
export function getCircuitStatus(source) {
    const circuit = getCircuit(source)
    return {
        source,
        state: circuit.state,
        failures: circuit.failures.length,
        lastFailure: circuit.lastFailure,
        openedAt: circuit.openedAt
    }
}

/**
 * Get all circuit statuses
 */
export function getAllCircuitStatuses() {
    const statuses = []
    for (const [source] of circuits) {
        statuses.push(getCircuitStatus(source))
    }
    return statuses
}

/**
 * Reset circuit (for testing or manual intervention)
 */
export function resetCircuit(source) {
    circuits.set(source, {
        state: STATES.CLOSED,
        failures: [],
        successes: 0,
        lastFailure: null,
        openedAt: null
    })
    logger.info('Circuit manually reset', { source })
}

/**
 * Wrapper function with circuit breaker
 */
export async function withCircuitBreaker(source, fn) {
    if (!canExecute(source)) {
        const circuit = getCircuit(source)
        const waitTime = resetTimeout - (Date.now() - circuit.openedAt)
        throw new Error(`Circuit breaker OPEN for ${source}. Retry in ${Math.ceil(waitTime / 1000)}s`)
    }

    try {
        const result = await fn()
        recordSuccess(source)
        return result
    } catch (error) {
        recordFailure(source, error)
        throw error
    }
}

export default {
    canExecute,
    recordSuccess,
    recordFailure,
    getCircuitStatus,
    getAllCircuitStatuses,
    resetCircuit,
    withCircuitBreaker
}
