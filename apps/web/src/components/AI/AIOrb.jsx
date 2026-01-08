/**
 * AIOrb Component - Premium Animated AI Indicator
 * Features: Pulsing gradient, orbiting particles, state-based animations
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Orb states
export const OrbState = {
    IDLE: 'idle',
    THINKING: 'thinking',
    SEARCHING: 'searching',
    RESPONDING: 'responding'
}

// Particle component for orbiting effect
function Particle({ index, total, isActive }) {
    const angle = (index / total) * 360
    const delay = index * 0.1

    return (
        <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-white"
            style={{
                left: '50%',
                top: '50%',
                marginLeft: -3,
                marginTop: -3,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={isActive ? {
                opacity: [0, 1, 0.5, 1, 0],
                scale: [0, 1, 1, 1, 0],
                x: [0, Math.cos(angle * Math.PI / 180) * 24, Math.cos((angle + 180) * Math.PI / 180) * 24, Math.cos(angle * Math.PI / 180) * 24, 0],
                y: [0, Math.sin(angle * Math.PI / 180) * 24, Math.sin((angle + 180) * Math.PI / 180) * 24, Math.sin(angle * Math.PI / 180) * 24, 0],
            } : { opacity: 0, scale: 0 }}
            transition={{
                duration: 2,
                delay,
                repeat: isActive ? Infinity : 0,
                ease: 'easeInOut'
            }}
        />
    )
}

// Radar wave for searching state
function RadarWave({ isActive }) {
    return (
        <AnimatePresence>
            {isActive && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border-2 border-violet-400/50"
                            initial={{ scale: 0.5, opacity: 0.8 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{
                                duration: 1.5,
                                delay: i * 0.5,
                                repeat: Infinity,
                                ease: 'easeOut'
                            }}
                        />
                    ))}
                </>
            )}
        </AnimatePresence>
    )
}

export default function AIOrb({
    state = OrbState.IDLE,
    size = 40,
    className = ''
}) {
    const isActive = state !== OrbState.IDLE
    const isThinking = state === OrbState.THINKING
    const isSearching = state === OrbState.SEARCHING
    const isResponding = state === OrbState.RESPONDING

    // Particles for orbiting effect
    const particles = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

    // Dynamic gradient based on state
    const gradientClass = useMemo(() => {
        switch (state) {
            case OrbState.THINKING:
                return 'from-violet-500 via-purple-500 to-fuchsia-500'
            case OrbState.SEARCHING:
                return 'from-blue-500 via-cyan-500 to-teal-500'
            case OrbState.RESPONDING:
                return 'from-emerald-500 via-green-500 to-lime-500'
            default:
                return 'from-violet-500 via-purple-500 to-fuchsia-500'
        }
    }, [state])

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {/* Outer glow ring */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    boxShadow: isActive
                        ? [
                            `0 0 20px rgba(139, 92, 246, 0.4)`,
                            `0 0 40px rgba(139, 92, 246, 0.6)`,
                            `0 0 20px rgba(139, 92, 246, 0.4)`,
                        ]
                        : '0 0 10px rgba(139, 92, 246, 0.2)'
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Radar waves for searching */}
            <RadarWave isActive={isSearching} />

            {/* Orbiting particles for thinking */}
            {particles.map((i) => (
                <Particle
                    key={i}
                    index={i}
                    total={particles.length}
                    isActive={isThinking || isResponding}
                />
            ))}

            {/* Main orb */}
            <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center overflow-hidden`}
                animate={{
                    scale: isActive ? [1, 1.08, 1] : 1,
                    rotate: isThinking ? [0, 360] : 0,
                }}
                transition={{
                    scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: 8, repeat: Infinity, ease: 'linear' }
                }}
            >
                {/* Inner shine effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Sparkle icon */}
                <motion.svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-1/2 h-1/2 text-white relative z-10"
                    animate={isResponding ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 15, -15, 0],
                    } : {}}
                    transition={{ duration: 0.5, repeat: isResponding ? Infinity : 0 }}
                >
                    <path
                        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                </motion.svg>
            </motion.div>

            {/* Activity indicator dot */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        className="absolute -right-0.5 -top-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 rounded-full bg-green-400"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Mini version for inline use
export function AISparkle({ size = 16, animate = true, className = '' }) {
    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            className={`text-violet-500 ${className}`}
            style={{ width: size, height: size }}
            animate={animate ? {
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1],
            } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
            <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="currentColor"
            />
        </motion.svg>
    )
}
