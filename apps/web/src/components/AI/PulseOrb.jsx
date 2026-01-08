/**
 * PulseOrb Component - Always in Motion AI Indicator
 * Features: Continuous rotating glow, pulsing rings, morphing gradient
 */

import { motion } from 'framer-motion'

export const OrbState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
}

export default function PulseOrb({
    state = OrbState.IDLE,
    size = 40,
    className = ''
}) {
    const isActive = state !== OrbState.IDLE

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Always rotating gradient ring */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'conic-gradient(from 0deg, #a78bfa, #8b5cf6, #7c3aed, #a78bfa)',
                    padding: 3,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
                <div className="w-full h-full rounded-full bg-white" />
            </motion.div>

            {/* Inner pulsing orb */}
            <motion.div
                className="absolute rounded-full bg-gradient-to-br from-violet-400 to-purple-600"
                style={{
                    width: size * 0.6,
                    height: size * 0.6,
                }}
                animate={{
                    scale: isActive ? [1, 1.15, 1] : [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: isActive ? 0.8 : 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Sparkle center */}
            <motion.div
                className="absolute w-2 h-2 bg-white rounded-full"
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Orbiting particles for active state */}
            {isActive && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 bg-violet-400 rounded-full"
                            style={{
                                transformOrigin: `${size / 2}px ${size / 2}px`,
                            }}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 2,
                                delay: i * 0.6,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                            initial={{
                                x: size / 2 + 5,
                                y: 0,
                            }}
                        />
                    ))}
                </>
            )}

            {/* Pulse rings for active state */}
            {isActive && (
                <>
                    {[0, 1].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-violet-300"
                            initial={{ scale: 0.8, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
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
        </div>
    )
}

// AI Status Text with bouncing dots
const STATUS_MESSAGES = [
    'AI is thinking',
    'Searching deals',
    'Analyzing prices',
    'Finding savings',
]

export function ThinkingIndicator({ className = '' }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Bouncing dots */}
            <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: 0.5,
                            delay: i * 0.12,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>

            {/* Rotating status text */}
            <StatusText messages={STATUS_MESSAGES} />
        </div>
    )
}

// Rotating status text component
function StatusText({ messages }) {
    return (
        <motion.div className="overflow-hidden h-5">
            <motion.div
                animate={{
                    y: messages.map((_, i) => -i * 20)
                }}
                transition={{
                    duration: messages.length * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    times: messages.map((_, i) => i / messages.length)
                }}
            >
                {messages.map((msg, i) => (
                    <motion.p
                        key={i}
                        className="text-sm text-gray-500 h-5 leading-5"
                    >
                        {msg}
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            ...
                        </motion.span>
                    </motion.p>
                ))}
            </motion.div>
        </motion.div>
    )
}

// Simple version with single cycling text
export function SimpleThinkingIndicator({ className = '' }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Bouncing dots */}
            <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: 0.5,
                            delay: i * 0.12,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>

            {/* Cycling text */}
            <CyclingText />
        </div>
    )
}

function CyclingText() {
    const messages = ['AI is thinking', 'Searching deals', 'Analyzing prices', 'Finding savings']

    return (
        <div className="relative overflow-hidden h-5">
            {messages.map((msg, i) => (
                <motion.p
                    key={i}
                    className="absolute text-sm text-gray-500 whitespace-nowrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        y: [10, 0, 0, -10]
                    }}
                    transition={{
                        duration: 3,
                        delay: i * 3,
                        repeat: Infinity,
                        repeatDelay: (messages.length - 1) * 3,
                        ease: 'easeInOut'
                    }}
                >
                    {msg}
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        ...
                    </motion.span>
                </motion.p>
            ))}
        </div>
    )
}
