/**
 * LoadingAnimation Component
 * Premium Lottie-based loading states for AI chat
 */

import { useMemo } from 'react'
import Lottie from 'lottie-react'
import { motion } from 'framer-motion'

// Inline animation data (search/loading animation)
const searchAnimationData = {
    "v": "5.7.4",
    "fr": 30,
    "ip": 0,
    "op": 60,
    "w": 100,
    "h": 100,
    "nm": "Search",
    "ddd": 0,
    "assets": [],
    "layers": [{
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Circle",
        "sr": 1,
        "ks": {
            "o": { "a": 0, "k": 100 },
            "r": {
                "a": 1,
                "k": [
                    { "t": 0, "s": [0], "e": [360] },
                    { "t": 60, "s": [360] }
                ]
            },
            "p": { "a": 0, "k": [50, 45, 0] },
            "s": { "a": 0, "k": [100, 100, 100] }
        },
        "shapes": [{
            "ty": "gr",
            "it": [{
                "ty": "el",
                "s": { "a": 0, "k": [40, 40] },
                "p": { "a": 0, "k": [0, 0] }
            }, {
                "ty": "st",
                "c": { "a": 0, "k": [0.545, 0.361, 0.965, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 4 },
                "lc": 2,
                "lj": 1,
                "d": [{ "n": "d", "nm": "dash", "v": { "a": 0, "k": 30 } }, { "n": "g", "nm": "gap", "v": { "a": 0, "k": 120 } }, { "n": "o", "nm": "offset", "v": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [150] }, { "t": 60, "s": [150] }] } }]
            }, {
                "ty": "tr",
                "p": { "a": 0, "k": [0, 0] }
            }]
        }]
    }, {
        "ddd": 0,
        "ind": 2,
        "ty": 4,
        "nm": "Handle",
        "sr": 1,
        "ks": {
            "o": { "a": 0, "k": 100 },
            "r": { "a": 0, "k": 45 },
            "p": { "a": 0, "k": [64, 64, 0] },
            "s": {
                "a": 1,
                "k": [
                    { "t": 0, "s": [100, 100, 100], "e": [110, 110, 100] },
                    { "t": 30, "s": [110, 110, 100], "e": [100, 100, 100] },
                    { "t": 60, "s": [100, 100, 100] }
                ]
            }
        },
        "shapes": [{
            "ty": "gr",
            "it": [{
                "ty": "rc",
                "d": 1,
                "s": { "a": 0, "k": [4, 20] },
                "p": { "a": 0, "k": [0, 10] },
                "r": { "a": 0, "k": 2 }
            }, {
                "ty": "fl",
                "c": { "a": 0, "k": [0.545, 0.361, 0.965, 1] },
                "o": { "a": 0, "k": 100 }
            }, {
                "ty": "tr",
                "p": { "a": 0, "k": [0, 0] }
            }]
        }]
    }]
}

// Thinking animation (brain/pulse)
const thinkingAnimationData = {
    "v": "5.7.4",
    "fr": 30,
    "ip": 0,
    "op": 60,
    "w": 100,
    "h": 100,
    "nm": "Thinking",
    "ddd": 0,
    "assets": [],
    "layers": [{
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Dots",
        "sr": 1,
        "ks": {
            "o": { "a": 0, "k": 100 },
            "p": { "a": 0, "k": [50, 50, 0] }
        },
        "shapes": [
            {
                "ty": "gr",
                "it": [{
                    "ty": "el",
                    "s": { "a": 0, "k": [12, 12] },
                    "p": { "a": 0, "k": [-24, 0] }
                }, {
                    "ty": "fl",
                    "c": { "a": 0, "k": [0.545, 0.361, 0.965, 1] },
                    "o": {
                        "a": 1,
                        "k": [
                            { "t": 0, "s": [30], "e": [100] },
                            { "t": 10, "s": [100], "e": [30] },
                            { "t": 20, "s": [30] }
                        ]
                    }
                }, {
                    "ty": "tr",
                    "p": { "a": 0, "k": [0, 0] }
                }]
            },
            {
                "ty": "gr",
                "it": [{
                    "ty": "el",
                    "s": { "a": 0, "k": [12, 12] },
                    "p": { "a": 0, "k": [0, 0] }
                }, {
                    "ty": "fl",
                    "c": { "a": 0, "k": [0.545, 0.361, 0.965, 1] },
                    "o": {
                        "a": 1,
                        "k": [
                            { "t": 10, "s": [30], "e": [100] },
                            { "t": 20, "s": [100], "e": [30] },
                            { "t": 30, "s": [30] }
                        ]
                    }
                }, {
                    "ty": "tr",
                    "p": { "a": 0, "k": [0, 0] }
                }]
            },
            {
                "ty": "gr",
                "it": [{
                    "ty": "el",
                    "s": { "a": 0, "k": [12, 12] },
                    "p": { "a": 0, "k": [24, 0] }
                }, {
                    "ty": "fl",
                    "c": { "a": 0, "k": [0.545, 0.361, 0.965, 1] },
                    "o": {
                        "a": 1,
                        "k": [
                            { "t": 20, "s": [30], "e": [100] },
                            { "t": 30, "s": [100], "e": [30] },
                            { "t": 40, "s": [30] }
                        ]
                    }
                }, {
                    "ty": "tr",
                    "p": { "a": 0, "k": [0, 0] }
                }]
            }
        ]
    }]
}

// Animation types
export const LoadingType = {
    THINKING: 'thinking',
    SEARCHING: 'searching',
    ANALYZING: 'analyzing'
}

// Status messages
const STATUS_MESSAGES = {
    [LoadingType.THINKING]: ['Thinking...', 'Processing your request...', 'Understanding your query...'],
    [LoadingType.SEARCHING]: ['Searching for deals...', 'Finding the best prices...', 'Scanning stores...'],
    [LoadingType.ANALYZING]: ['Analyzing results...', 'Comparing options...', 'Preparing your deals...']
}

export default function LoadingAnimation({ type = LoadingType.THINKING, size = 80 }) {
    const animationData = useMemo(() => {
        switch (type) {
            case LoadingType.SEARCHING:
                return searchAnimationData
            case LoadingType.THINKING:
            case LoadingType.ANALYZING:
            default:
                return thinkingAnimationData
        }
    }, [type])

    const messages = STATUS_MESSAGES[type] || STATUS_MESSAGES[LoadingType.THINKING]
    const randomMessage = useMemo(() => messages[Math.floor(Math.random() * messages.length)], [messages])

    return (
        <motion.div
            className="loading-animation-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
        >
            <div className="lottie-wrapper">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    style={{ width: size, height: size }}
                />
            </div>
            <motion.p
                className="loading-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {randomMessage}
            </motion.p>

            <style jsx>{`
        .loading-animation-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
        }

        .lottie-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          font-weight: 500;
          text-align: center;
        }
      `}</style>
        </motion.div>
    )
}

// Enhanced skeleton with shimmer
export function EnhancedSkeleton({ width = '100%', height = 16, borderRadius = 8 }) {
    return (
        <motion.div
            className="enhanced-skeleton"
            style={{ width, height, borderRadius }}
            animate={{
                backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
            }}
        >
            <style jsx>{`
        .enhanced-skeleton {
          background: linear-gradient(
            90deg,
            #f3f4f6 0%,
            #e5e7eb 25%,
            #d1d5db 50%,
            #e5e7eb 75%,
            #f3f4f6 100%
          );
          background-size: 200% 100%;
        }
      `}</style>
        </motion.div>
    )
}

// Premium deal card skeleton
export function DealCardSkeletonPremium() {
    return (
        <motion.div
            className="deal-skeleton-premium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <div className="skeleton-image-wrapper">
                <EnhancedSkeleton width={80} height={80} borderRadius={12} />
            </div>
            <div className="skeleton-content">
                <EnhancedSkeleton width="70%" height={14} />
                <EnhancedSkeleton width="90%" height={12} />
                <div className="skeleton-meta">
                    <EnhancedSkeleton width={60} height={20} borderRadius={10} />
                    <EnhancedSkeleton width={80} height={12} />
                </div>
            </div>

            <style jsx>{`
        .deal-skeleton-premium {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .skeleton-image-wrapper {
          flex-shrink: 0;
        }

        .skeleton-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .skeleton-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
      `}</style>
        </motion.div>
    )
}
