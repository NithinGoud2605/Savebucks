/**
 * ParticleField Component - Ambient floating particles
 * Creates a subtle, animated background for premium feel
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'

function Particle({
    size,
    x,
    y,
    duration,
    delay,
    color = 'rgba(139, 92, 246, 0.3)'
}) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
            initial={{
                opacity: 0,
                scale: 0,
                y: 0
            }}
            animate={{
                opacity: [0, 0.6, 0.4, 0.6, 0],
                scale: [0, 1, 1.2, 1, 0],
                y: [0, -30, -60, -90, -120],
                x: [0, 10, -10, 5, 0]
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        />
    )
}

export default function ParticleField({
    count = 12,
    className = '',
    active = true
}) {
    // Generate particles with random properties
    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            size: Math.random() * 8 + 4,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 4 + 4,
            delay: Math.random() * 3,
            color: i % 3 === 0
                ? 'rgba(139, 92, 246, 0.3)' // violet
                : i % 3 === 1
                    ? 'rgba(59, 130, 246, 0.25)' // blue 
                    : 'rgba(236, 72, 153, 0.2)' // pink
        }))
    }, [count])

    if (!active) return null

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {particles.map((p) => (
                <Particle key={p.id} {...p} />
            ))}
        </div>
    )
}

// Gradient mesh background for extra premium feel
export function GradientMesh({ className = '', animate = true }) {
    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            <motion.div
                className="absolute w-[150%] h-[150%] -left-1/4 -top-1/4"
                style={{
                    background: `
            radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)
          `,
                }}
                animate={animate ? {
                    rotate: [0, 360],
                } : {}}
                transition={{
                    duration: 60,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
        </div>
    )
}

// Spotlight effect that follows activity
export function Spotlight({
    x = 50,
    y = 50,
    size = 300,
    color = 'rgba(139, 92, 246, 0.15)',
    className = ''
}) {
    return (
        <motion.div
            className={`absolute pointer-events-none rounded-full blur-3xl ${className}`}
            style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
            animate={{
                left: `calc(${x}% - ${size / 2}px)`,
                top: `calc(${y}% - ${size / 2}px)`,
            }}
            transition={{
                type: 'spring',
                stiffness: 50,
                damping: 20
            }}
        />
    )
}
