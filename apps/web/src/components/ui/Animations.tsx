/**
 * Premium Animation Components
 * Reusable scroll reveal and micro-interaction effects
 */

import React from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/**
 * Scroll Reveal - Animates when element enters viewport
 */
export function ScrollReveal({
    children,
    className = '',
    delay = 0,
    direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'fade'
    distance = 20,
    duration = 0.5,
    once = true,
}: {
    children: React.ReactNode
    className?: string
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
    distance?: number
    duration?: number
    once?: boolean
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, margin: '-50px' })

    const directions = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { x: distance, y: 0 },
        right: { x: -distance, y: 0 },
        fade: { x: 0, y: 0 },
    }

    const initial = {
        opacity: 0,
        ...directions[direction],
    }

    const animate = isInView
        ? { opacity: 1, x: 0, y: 0 }
        : initial

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={initial}
            animate={animate}
            transition={{
                duration,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Staggered Children - Container that staggers child animations
 */
export function StaggerChildren({
    children,
    className = '',
    staggerDelay = 0.1,
}: {
    children: React.ReactNode
    className?: string
    staggerDelay?: number
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Stagger Item - Child of StaggerChildren
 */
export function StaggerItem({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            transition={{
                duration: 0.4,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Hover Scale - Subtle scale on hover
 */
export function HoverScale({
    children,
    className = '',
    scale = 1.02,
}: {
    children: React.ReactNode
    className?: string
    scale?: number
}) {
    return (
        <motion.div
            className={className}
            whileHover={{ scale }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Pulse - Subtle attention-grabbing pulse
 */
export function Pulse({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div
            className={className}
            animate={{
                scale: [1, 1.05, 1],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
            }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Number Counter - Animates from 0 to target
 */
export function AnimatedNumber({
    value,
    duration = 1,
    className = '',
}: {
    value: number
    duration?: number
    className?: string
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
        >
            {isInView ? (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {value.toLocaleString()}
                </motion.span>
            ) : (
                '0'
            )}
        </motion.span>
    )
}

/**
 * Shimmer - Loading shimmer effect
 */
export function Shimmer({ className = '' }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
    )
}

/**
 * Floating - Gentle floating animation
 */
export function Floating({
    children,
    className = '',
    amplitude = 8,
}: {
    children: React.ReactNode
    className?: string
    amplitude?: number
}) {
    return (
        <motion.div
            className={className}
            animate={{
                y: [0, -amplitude, 0],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
            }}
        >
            {children}
        </motion.div>
    )
}
