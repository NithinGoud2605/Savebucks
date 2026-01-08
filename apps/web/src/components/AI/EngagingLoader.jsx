/**
 * EngagingLoader Component - Keep users entertained while AI thinks
 * Features: Fun facts, tips, animated progress, engaging animations
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Fun facts and tips to show while loading
const LOADING_INSIGHTS = [
    { type: 'tip', text: 'Pro tip: Compare prices across multiple stores before buying' },
    { type: 'tip', text: 'Check for cashback offers to stack with discounts' },
    { type: 'fact', text: 'The average shopper saves $1,200/year using deal sites' },
    { type: 'tip', text: 'Set price alerts for items you want to track' },
    { type: 'fact', text: 'Flash sales often offer the deepest discounts' },
    { type: 'tip', text: 'Subscribe to store newsletters for exclusive coupons' },
    { type: 'fact', text: 'Black Friday deals often repeat throughout the year' },
    { type: 'tip', text: 'Check bundle deals for better value' },
    { type: 'fact', text: 'Prices drop an average of 30% during holiday sales' },
    { type: 'tip', text: 'Use browser extensions to auto-apply coupons' },
]

// Loading stages with descriptions
const STAGES = [
    { text: 'Understanding your request', icon: '🧠' },
    { text: 'Searching our deal database', icon: '🔍' },
    { text: 'Analyzing best matches', icon: '⚡' },
    { text: 'Preparing your results', icon: '✨' },
]

export default function EngagingLoader({ className = '' }) {
    const [insight, setInsight] = useState(() =>
        LOADING_INSIGHTS[Math.floor(Math.random() * LOADING_INSIGHTS.length)]
    )
    const [stageIndex, setStageIndex] = useState(0)

    // Rotate insights every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setInsight(LOADING_INSIGHTS[Math.floor(Math.random() * LOADING_INSIGHTS.length)])
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    // Progress through stages
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (stageIndex < STAGES.length - 1) {
                setStageIndex(prev => prev + 1)
            }
        }, 1500)
        return () => clearTimeout(timeout)
    }, [stageIndex])

    const stage = STAGES[stageIndex]

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Main loading indicator */}
            <div className="flex items-start gap-4">
                {/* Animated emoji */}
                <motion.div
                    className="text-2xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {stage.icon}
                </motion.div>

                <div className="flex-1">
                    {/* Stage text */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={stageIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-gray-900 font-medium"
                        >
                            {stage.text}
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                ...
                            </motion.span>
                        </motion.p>
                    </AnimatePresence>

                    {/* Progress bar */}
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>

            {/* Fun insight */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={insight.text}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2 px-3 py-2 bg-violet-50 rounded-lg"
                >
                    <span className="text-violet-500 flex-shrink-0">
                        {insight.type === 'tip' ? '💡' : '📊'}
                    </span>
                    <p className="text-sm text-violet-700">
                        <span className="font-medium">
                            {insight.type === 'tip' ? 'Tip: ' : 'Did you know? '}
                        </span>
                        {insight.text}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Animated dots pattern */}
            <div className="flex justify-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-violet-300 rounded-full"
                        animate={{
                            y: [0, -6, 0],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.1,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

// Typing indicator with character animation
export function TypingIndicator({ text = 'AI is thinking', className = '' }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                            duration: 0.5,
                            delay: i * 0.1,
                            repeat: Infinity
                        }}
                    />
                ))}
            </div>
            <motion.span
                className="text-sm text-gray-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {text}
            </motion.span>
        </div>
    )
}
