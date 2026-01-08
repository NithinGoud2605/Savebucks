/**
 * InfinityOrb Component - Innovative AI Symbol
 * Features: Morphing infinity symbol with aurora gradient, pulsing glow
 */

import { motion } from 'framer-motion'

export const OrbState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
}

export default function InfinityOrb({
    state = OrbState.IDLE,
    size = 40,
    className = ''
}) {
    const isActive = state !== OrbState.IDLE
    const isThinking = state === OrbState.THINKING
    const isSpeaking = state === OrbState.SPEAKING

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Outer glow pulse */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    boxShadow: isActive
                        ? [
                            '0 0 20px rgba(139, 92, 246, 0.3)',
                            '0 0 30px rgba(139, 92, 246, 0.5)',
                            '0 0 20px rgba(139, 92, 246, 0.3)'
                        ]
                        : '0 0 10px rgba(139, 92, 246, 0.1)'
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Main SVG - Infinity morphing into shapes */}
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    {/* Aurora gradient animation */}
                    <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <motion.stop
                            offset="0%"
                            animate={{ stopColor: ['#a78bfa', '#8b5cf6', '#7c3aed', '#a78bfa'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.stop
                            offset="50%"
                            animate={{ stopColor: ['#8b5cf6', '#c084fc', '#a78bfa', '#8b5cf6'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.stop
                            offset="100%"
                            animate={{ stopColor: ['#7c3aed', '#a78bfa', '#c084fc', '#7c3aed'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Infinity symbol */}
                <motion.path
                    d="M30 50 C30 35, 45 35, 50 50 C55 65, 70 65, 70 50 C70 35, 55 35, 50 50 C45 65, 30 65, 30 50"
                    fill="none"
                    stroke="url(#auroraGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    animate={isThinking ? {
                        pathLength: [0, 1],
                        strokeDasharray: ['0 200', '200 0'],
                    } : isSpeaking ? {
                        scale: [1, 1.1, 1],
                    } : {}}
                    transition={{
                        duration: isThinking ? 2 : 0.8,
                        repeat: Infinity,
                        ease: isThinking ? 'linear' : 'easeInOut'
                    }}
                    style={{ transformOrigin: 'center' }}
                />

                {/* Center sparkle for active state */}
                {isActive && (
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="4"
                        fill="url(#auroraGradient)"
                        animate={{
                            r: [3, 5, 3],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    />
                )}
            </svg>

            {/* Orbiting particle for thinking */}
            {isThinking && (
                <motion.div
                    className="absolute w-2 h-2 bg-violet-400 rounded-full"
                    animate={{
                        rotate: 360,
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                        transformOrigin: `${size / 2}px ${size / 2}px`,
                        left: size - 8,
                        top: size / 2 - 4,
                    }}
                />
            )}
        </div>
    )
}

// Wave typing animation - innovative pulse effect
export function WaveTyping({ className = '' }) {
    const waves = 5

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {Array.from({ length: waves }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-gradient-to-t from-violet-600 to-violet-400 rounded-full"
                    animate={{
                        height: [8, 20, 8],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 0.6,
                        delay: i * 0.08,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            ))}
        </div>
    )
}

// Ripple typing animation - concentric circles
export function RippleTyping({ className = '' }) {
    return (
        <div className={`relative w-8 h-8 flex items-center justify-center ${className}`}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full border-2 border-violet-500"
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{
                        duration: 1.2,
                        delay: i * 0.4,
                        repeat: Infinity,
                        ease: 'easeOut'
                    }}
                />
            ))}
            <div className="w-2 h-2 bg-violet-500 rounded-full" />
        </div>
    )
}

// DNA helix typing animation
export function HelixTyping({ className = '' }) {
    const dots = 4

    return (
        <div className={`flex items-center gap-2 h-6 ${className}`} style={{ perspective: '100px' }}>
            {Array.from({ length: dots }).map((_, i) => (
                <motion.div
                    key={i}
                    className="relative w-3 h-full flex flex-col items-center justify-center"
                >
                    {/* Top dot */}
                    <motion.div
                        className="absolute w-2 h-2 bg-violet-500 rounded-full"
                        animate={{
                            y: [-6, 6, -6],
                            scale: [1, 0.7, 1],
                            opacity: [1, 0.5, 1]
                        }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.15,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                    {/* Bottom dot */}
                    <motion.div
                        className="absolute w-2 h-2 bg-violet-300 rounded-full"
                        animate={{
                            y: [6, -6, 6],
                            scale: [0.7, 1, 0.7],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.15,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                </motion.div>
            ))}
        </div>
    )
}

// Morphing shape typing
export function MorphTyping({ className = '' }) {
    return (
        <motion.div
            className={`w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 ${className}`}
            animate={{
                borderRadius: ['20%', '50%', '30%', '50%', '20%'],
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        />
    )
}
