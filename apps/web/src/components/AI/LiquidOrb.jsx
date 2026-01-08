/**
 * LiquidOrb Component - Siri-inspired Voice/AI Indicator
 * Clean white theme with liquid morphing effects
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'

export const OrbState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
}

// Liquid blob shape generator
function generateBlobPath(points = 6, radius = 40, variance = 8) {
    const angleStep = (Math.PI * 2) / points
    const path = []

    for (let i = 0; i < points; i++) {
        const angle = i * angleStep
        const r = radius + (Math.random() - 0.5) * variance
        const x = Math.cos(angle) * r + 50
        const y = Math.sin(angle) * r + 50
        path.push({ x, y })
    }

    // Create smooth bezier curve
    let d = `M ${path[0].x} ${path[0].y}`
    for (let i = 0; i < path.length; i++) {
        const p1 = path[i]
        const p2 = path[(i + 1) % path.length]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        d += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`
    }
    d += ' Z'
    return d
}

export default function LiquidOrb({
    state = OrbState.IDLE,
    size = 48,
    className = ''
}) {
    const isActive = state !== OrbState.IDLE

    // Generate multiple blob paths for morphing
    const blobPaths = useMemo(() => [
        generateBlobPath(6, 38, 6),
        generateBlobPath(6, 40, 8),
        generateBlobPath(6, 36, 10),
        generateBlobPath(6, 42, 6),
    ], [])

    return (
        <div
            className={`relative ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Outer glow - subtle aurora effect - always visible */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: isActive ? 1.5 : 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
                style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                    filter: 'blur(8px)',
                }}
            />

            {/* Main liquid orb */}
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ overflow: 'visible' }}
            >
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="orbActiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor="#f0f0f0" />
                        <stop offset="100%" stopColor="#e0e0e0" />
                    </linearGradient>
                    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                    </filter>
                    <filter id="innerGlow">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Morphing liquid blob - ALWAYS moving */}
                <motion.path
                    fill="url(#orbGradient)"
                    filter="url(#softShadow)"
                    animate={{
                        d: blobPaths,
                    }}
                    transition={{
                        duration: isActive ? 0.6 : 1.5,
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: 'easeInOut'
                    }}
                />

                {/* Inner highlight */}
                <motion.ellipse
                    cx="42"
                    cy="38"
                    rx="12"
                    ry="8"
                    fill="white"
                    opacity="0.6"
                    animate={{
                        rx: isActive ? [12, 14, 12] : 12,
                        ry: isActive ? [8, 10, 8] : 8,
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Sparkle icon in center */}
                <motion.g
                    transform="translate(50, 50)"
                    animate={{
                        scale: isActive ? [1, 1.1, 1] : 1,
                        rotate: state === OrbState.THINKING ? [0, 180, 360] : 0,
                    }}
                    transition={{
                        scale: { duration: 1, repeat: Infinity },
                        rotate: { duration: 4, repeat: Infinity, ease: 'linear' }
                    }}
                >
                    <path
                        d="M0 -12 L2.5 -3 L12 0 L2.5 3 L0 12 L-2.5 3 L-12 0 L-2.5 -3 Z"
                        fill="white"
                        opacity="0.9"
                    />
                </motion.g>
            </svg>

            {/* Pulse rings for active states */}
            {isActive && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-violet-400/40"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{
                                duration: 2,
                                delay: i * 0.6,
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

// Bouncing dots loader - clean white theme
export function BouncingDots({ className = '' }) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 bg-violet-500 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                        duration: 0.6,
                        delay: i * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            ))}
        </div>
    )
}

// Waveform animation for speaking state
export function Waveform({ isActive = false, className = '' }) {
    const bars = 5

    return (
        <div className={`flex items-center gap-0.5 h-4 ${className}`}>
            {Array.from({ length: bars }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-0.5 bg-violet-500 rounded-full"
                    animate={isActive ? {
                        height: [4, 16, 8, 14, 4],
                    } : { height: 4 }}
                    transition={{
                        duration: 1,
                        delay: i * 0.1,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            ))}
        </div>
    )
}

// Simple thinking indicator with bouncing dots and rotating status text
const STATUS_MESSAGES = ['AI is thinking', 'Searching deals', 'Analyzing prices', 'Finding savings']

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

            {/* Cycling status text */}
            <div className="relative overflow-hidden h-5">
                {STATUS_MESSAGES.map((msg, i) => (
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
                            repeatDelay: (STATUS_MESSAGES.length - 1) * 3,
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
        </div>
    )
}

