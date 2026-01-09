/**
 * SparkleEffect Component - Particle burst animation for AI messages
 * Creates a burst of sparkle particles when AI response arrives
 */

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Generate random particles
function generateParticles(count = 8) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (i / count) * 360 + Math.random() * 30 - 15,
        distance: 40 + Math.random() * 30,
        size: 4 + Math.random() * 4,
        delay: Math.random() * 0.2,
        duration: 0.6 + Math.random() * 0.4,
        color: [
            'rgba(139, 92, 246, 0.9)',   // Violet
            'rgba(168, 85, 247, 0.9)',   // Purple
            'rgba(59, 130, 246, 0.9)',   // Blue
            'rgba(56, 239, 125, 0.9)',   // Green
            'rgba(251, 191, 36, 0.9)',   // Amber
        ][Math.floor(Math.random() * 5)]
    }))
}

// Single Sparkle Particle
function SparkleParticle({ particle, trigger }) {
    const x = Math.cos(particle.angle * Math.PI / 180) * particle.distance
    const y = Math.sin(particle.angle * Math.PI / 180) * particle.distance

    return (
        <motion.div
            className="sparkle-particle"
            style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                borderRadius: '50%',
                background: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                left: '50%',
                top: '50%',
                marginLeft: -particle.size / 2,
                marginTop: -particle.size / 2,
                pointerEvents: 'none',
                zIndex: 10,
            }}
            initial={{
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0
            }}
            animate={trigger ? {
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0],
                x: [0, x * 0.5, x, x * 1.2],
                y: [0, y * 0.5, y, y * 1.2],
            } : {
                opacity: 0,
                scale: 0
            }}
            transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.16, 1, 0.3, 1]
            }}
        />
    )
}

// Ring pulse effect
function RingPulse({ trigger, delay = 0 }) {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 20,
                height: 20,
                marginLeft: -10,
                marginTop: -10,
                borderRadius: '50%',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                pointerEvents: 'none',
                zIndex: 5,
            }}
            initial={{
                opacity: 0,
                scale: 0
            }}
            animate={trigger ? {
                opacity: [0, 0.8, 0],
                scale: [0.5, 3, 4],
            } : {
                opacity: 0,
                scale: 0
            }}
            transition={{
                duration: 0.8,
                delay,
                ease: 'easeOut'
            }}
        />
    )
}

// Main SparkleEffect component
export default function SparkleEffect({
    trigger = false,
    particleCount = 8,
    showRings = true,
    className = ''
}) {
    const particles = useMemo(() => generateParticles(particleCount), [particleCount])

    return (
        <div
            className={`sparkle-effect-container ${className}`}
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 10,
            }}
        >
            {/* Ring pulses */}
            {showRings && (
                <>
                    <RingPulse trigger={trigger} delay={0} />
                    <RingPulse trigger={trigger} delay={0.15} />
                </>
            )}

            {/* Sparkle particles */}
            {particles.map((particle) => (
                <SparkleParticle
                    key={particle.id}
                    particle={particle}
                    trigger={trigger}
                />
            ))}
        </div>
    )
}

// Mini sparkle for inline use (like orb icon)
export function MiniSparkle({ size = 16, color = '#8b5cf6', animate = true }) {
    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            style={{ width: size, height: size }}
            animate={animate ? {
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.7, 1, 0.7],
            } : {}}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        >
            <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill={color}
                stroke={color}
                strokeWidth="0.5"
            />
        </motion.svg>
    )
}

// Floating sparkles background effect
export function FloatingSparkles({ count = 5, active = false }) {
    const sparkles = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 3 + Math.random() * 3,
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 2,
        })),
        [count]
    )

    return (
        <AnimatePresence>
            {active && sparkles.map((sparkle) => (
                <motion.div
                    key={sparkle.id}
                    style={{
                        position: 'absolute',
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                        width: sparkle.size,
                        height: sparkle.size,
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.6)',
                        boxShadow: '0 0 8px rgba(139, 92, 246, 0.8)',
                        pointerEvents: 'none',
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        y: [0, -20, -40],
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                        duration: sparkle.duration,
                        delay: sparkle.delay,
                        repeat: Infinity,
                        ease: 'easeOut'
                    }}
                />
            ))}
        </AnimatePresence>
    )
}
