/**
 * TypewriterText Component - Character-by-character text reveal
 * Features: Smooth typing animation, cursor blink, skip option
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TypewriterText({
    text = '',
    speed = 20, // ms per character
    onComplete = null,
    showCursor = true,
    className = '',
    skipable = true
}) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)
    const [isSkipped, setIsSkipped] = useState(false)
    const indexRef = useRef(0)
    const intervalRef = useRef(null)

    useEffect(() => {
        if (!text) return

        // Reset on new text
        setDisplayedText('')
        setIsComplete(false)
        setIsSkipped(false)
        indexRef.current = 0

        // Skip if already shown or skipped
        if (isSkipped) {
            setDisplayedText(text)
            setIsComplete(true)
            return
        }

        intervalRef.current = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayedText(text.slice(0, indexRef.current + 1))
                indexRef.current++
            } else {
                clearInterval(intervalRef.current)
                setIsComplete(true)
                if (onComplete) onComplete()
            }
        }, speed)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [text, speed, isSkipped])

    const handleSkip = () => {
        if (skipable && !isComplete) {
            setIsSkipped(true)
            setDisplayedText(text)
            setIsComplete(true)
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            if (onComplete) onComplete()
        }
    }

    return (
        <span className={`relative ${className}`} onClick={handleSkip}>
            {displayedText}
            <AnimatePresence>
                {showCursor && !isComplete && (
                    <motion.span
                        className="inline-block w-0.5 h-[1.1em] bg-current ml-0.5 align-middle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'steps(1)' }}
                    />
                )}
            </AnimatePresence>
        </span>
    )
}

// Streaming text variant - for real-time streaming content
export function StreamingText({
    content = '',
    className = '',
    renderMarkdown = false
}) {
    const [chunks, setChunks] = useState([])
    const prevLengthRef = useRef(0)

    useEffect(() => {
        if (content.length > prevLengthRef.current) {
            const newChunk = content.slice(prevLengthRef.current)
            setChunks(prev => [...prev, { id: Date.now(), text: newChunk }])
            prevLengthRef.current = content.length
        }
    }, [content])

    return (
        <span className={className}>
            {chunks.map((chunk, i) => (
                <motion.span
                    key={chunk.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {chunk.text}
                </motion.span>
            ))}
            {/* Cursor */}
            <motion.span
                className="inline-block w-0.5 h-[1em] bg-violet-500 ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'steps(1)' }}
            />
        </span>
    )
}

// Word-by-word reveal for a different effect
export function WordReveal({
    text = '',
    staggerDelay = 0.03,
    className = ''
}) {
    const words = text.split(' ')

    return (
        <span className={className}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: i * staggerDelay, duration: 0.3 }}
                    className="inline-block mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    )
}
