/**
 * PremiumAIChat Component
 * ChatGPT-style AI chat with streaming, animations, and inline results
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles,
    Send,
    X,
    RefreshCw,
    Copy,
    Check,
    ExternalLink,
    TrendingUp,
    Tag,
    Zap,
    ChevronDown
} from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import { cn } from '../../lib/utils'

// Suggestions
const QUICK_PROMPTS = [
    { icon: <TrendingUp className="w-4 h-4" />, text: 'Trending deals', query: 'Show me today\'s trending deals' },
    { icon: <Tag className="w-4 h-4" />, text: 'Best coupons', query: 'What are the best coupon codes right now?' },
    { icon: <Zap className="w-4 h-4" />, text: 'Flash sales', query: 'Any flash sales happening now?' },
]

// Typing indicator component
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 py-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-typing" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-typing" style={{ animationDelay: '300ms' }} />
        </div>
    )
}

// Message component
function AIMessage({ message, isLast }) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'
    const isStreaming = message.isStreaming

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                'flex gap-3 px-4 py-4',
                isUser ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            {/* Avatar */}
            <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                isUser
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
            )}>
                {isUser ? '👤' : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Content */}
            <div className={cn(
                'flex-1 max-w-[85%]',
                isUser && 'flex justify-end'
            )}>
                <div className={cn(
                    'group relative rounded-2xl px-4 py-3',
                    isUser
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-bl-md'
                )}>
                    {isStreaming && !message.content ? (
                        <TypingIndicator />
                    ) : (
                        <>
                            <p className={cn(
                                'text-sm leading-relaxed whitespace-pre-wrap',
                                isUser ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                            )}>
                                {message.content}
                                {isStreaming && (
                                    <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse rounded-sm" />
                                )}
                            </p>

                            {/* Copy button for assistant */}
                            {!isUser && message.content && (
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {copied ? (
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Inline Deals */}
                {message.deals && message.deals.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {message.deals.slice(0, 4).map((deal) => (
                            <motion.a
                                key={deal.id}
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                            >
                                {deal.image_url && (
                                    <img
                                        src={deal.image_url}
                                        alt=""
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                        {deal.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-lg font-bold text-emerald-500">${deal.price}</span>
                                        {deal.discount_percent && (
                                            <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                                -{deal.discount_percent}%
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400">{deal.merchant}</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </motion.a>
                        ))}
                    </div>
                )}

                {/* Inline Coupons */}
                {message.coupons && message.coupons.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {message.coupons.slice(0, 3).map((coupon) => (
                            <motion.div
                                key={coupon.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-dashed border-amber-400 rounded-xl"
                            >
                                <div>
                                    <span className="text-lg font-bold text-amber-600">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                                    </span>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{coupon.title}</p>
                                </div>
                                <code className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 rounded-lg font-mono text-sm font-semibold">
                                    {coupon.coupon_code}
                                </code>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// Main chat component
export default function PremiumAIChat({
    embedded = false,
    onClose,
    initialQuery
}) {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const {
        messages,
        state,
        error,
        sendMessage,
        clear,
        retry,
        isLoading,
        isStreaming
    } = useChat({ streaming: true })

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Handle initial query
    useEffect(() => {
        if (initialQuery && messages.length === 0) {
            sendMessage(initialQuery)
        }
    }, [initialQuery])

    const handleSubmit = (e) => {
        e?.preventDefault()
        if (!input.trim() || isLoading || isStreaming) return
        sendMessage(input.trim())
        setInput('')
    }

    const handleQuickPrompt = (query) => {
        sendMessage(query)
    }

    return (
        <div className={cn(
            'flex flex-col bg-slate-50 dark:bg-slate-900',
            embedded ? 'h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden' : 'min-h-screen'
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">SaveBucks AI</h2>
                        <span className="text-xs text-emerald-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <button
                            onClick={clear}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            title="Clear chat"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            How can I help you today?
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                            Ask me anything about deals, coupons, prices, or shopping advice.
                        </p>

                        {/* Quick prompts */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {QUICK_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickPrompt(prompt.query)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-all hover:shadow-md"
                                >
                                    {prompt.icon}
                                    {prompt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-2">
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <AIMessage
                                    key={msg.id || i}
                                    message={msg}
                                    isLast={i === messages.length - 1}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Error */}
                        {error && (
                            <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                <button
                                    onClick={retry}
                                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about deals, coupons, prices..."
                            disabled={isLoading || isStreaming}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || isStreaming}
                        className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                            input.trim()
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        )}
                    >
                        {isLoading || isStreaming ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
                <p className="text-xs text-center text-slate-400 mt-2">
                    Press ⌘K anytime to open command menu
                </p>
            </div>
        </div>
    )
}
