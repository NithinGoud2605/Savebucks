/**
 * AIFeedSearch Component - Clean White Innovative Design
 * Inspired by Apple Siri and modern AI interfaces
 * Features: Liquid orb, morphing shapes, aurora glow, minimal white theme
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '../../hooks/useChat'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated, useTrail } from '@react-spring/web'
import {
  ArrowUp,
  X,
  TrendingUp,
  Percent,
  Tag,
  Zap,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { formatPrice } from '../../lib/format'
import LiquidOrb, { OrbState, SimpleThinkingIndicator } from './LiquidOrb'
import EngagingLoader from './EngagingLoader'

// AI Suggestions - Clean white design
const AI_SUGGESTIONS = [
  { icon: TrendingUp, label: 'Trending deals', query: 'Show me trending deals right now' },
  { icon: Percent, label: '50% off or more', query: 'Find deals with 50% or more discount' },
  { icon: Tag, label: 'Under $25', query: 'Great deals under $25' },
  { icon: Zap, label: 'Ending soon', query: 'Deals ending soon' },
]

// Loading stage configuration
const LOADING_STAGES = [
  { stage: 'connecting', text: 'Connecting...', duration: 500 },
  { stage: 'thinking', text: 'Thinking...', duration: 1500 },
  { stage: 'searching', text: 'Finding deals...', duration: 2000 },
  { stage: 'generating', text: 'Generating response...', duration: 0 }
]

export default function AIFeedSearch({ onAIActive, isAIActive = false }) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [loadingStage, setLoadingStage] = useState(0)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const chatState = useChat({ streaming: true })
  const { messages, deals, coupons, sendMessage, clear, isLoading, isStreaming, error, retry } = chatState

  // Determine orb state
  const orbState = useMemo(() => {
    if (isStreaming) return OrbState.SPEAKING
    if (isLoading) return OrbState.THINKING
    if (isFocused) return OrbState.LISTENING
    return OrbState.IDLE
  }, [isLoading, isStreaming, isFocused])

  // Progress through loading stages
  useEffect(() => {
    if (!isLoading) {
      setLoadingStage(0)
      return
    }

    let timeout
    const advanceStage = (index) => {
      if (index >= LOADING_STAGES.length - 1) return
      timeout = setTimeout(() => {
        setLoadingStage(index + 1)
        advanceStage(index + 1)
      }, LOADING_STAGES[index].duration)
    }

    advanceStage(0)
    return () => clearTimeout(timeout)
  }, [isLoading])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && isAIActive) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAIActive])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading || isStreaming) return
    if (onAIActive) onAIActive(true)
    sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestionClick = (query) => {
    if (onAIActive) onAIActive(true)
    sendMessage(query)
  }

  const handleClose = () => {
    clear()
    if (onAIActive) onAIActive(false)
  }

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col relative">
      {/* Subtle aurora glow background */}
      <AnimatePresence>
        {(isFocused || isAIActive) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 -z-10 pointer-events-none"
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.02) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Content */}
      <AnimatePresence>
        {isAIActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 py-4 space-y-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    delay: i * 0.05
                  }}
                >
                  {msg.role === 'user' ? (
                    <UserMessage content={msg.content} />
                  ) : (
                    <AIMessage
                      content={msg.content}
                      thinking={msg.thinking}
                      deals={i === messages.length - 1 ? deals : null}
                      coupons={i === messages.length - 1 ? coupons : null}
                      isStreaming={isStreaming && i === messages.length - 1}
                      copiedId={copiedId}
                      onCopyCode={copyCode}
                    />
                  )}
                </motion.div>
              ))}

              {/* Loading State - Engaging */}
              {isLoading && messages.length === 0 && (
                <EngagingLoader />
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-4 border border-red-100"
                >
                  <p className="text-sm text-red-500 mb-2">{error}</p>
                  <button
                    onClick={retry}
                    className="text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    Try again
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions - Clean minimal pills */}
      <AnimatePresence>
        {isFocused && !isAIActive && !input && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-2 pb-4"
          >
            <p className="text-[10px] text-gray-400 mb-3 font-medium uppercase tracking-wider">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              {AI_SUGGESTIONS.map((s, i) => (
                <SuggestionPill key={i} suggestion={s} index={i} onClick={() => handleSuggestionClick(s.query)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar - Clean white floating design */}
      <div className="px-4">
        <form onSubmit={handleSubmit}>
          <motion.div
            animate={{
              boxShadow: isFocused || isAIActive
                ? '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)'
                : '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)'
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-full"
          >
            {/* Pulse Orb - Always moving */}
            <LiquidOrb state={orbState} size={40} />

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder={isAIActive ? "Ask a follow-up..." : "Ask anything about deals..."}
              disabled={isLoading || isStreaming}
              className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />

            {/* Keyboard hint */}
            {!isFocused && !isAIActive && !input && (
              <div className="hidden sm:flex items-center">
                <kbd className="px-2 py-1 bg-gray-50 rounded-md text-[10px] font-medium text-gray-400 border border-gray-100">⌘K</kbd>
              </div>
            )}

            {/* Close button */}
            {isAIActive && (
              <motion.button
                type="button"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading || isStreaming}
              whileHover={{ scale: input.trim() ? 1.05 : 1 }}
              whileTap={{ scale: input.trim() ? 0.95 : 1 }}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                ${input.trim()
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isLoading || isStreaming ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Subtle footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused || isAIActive ? 0.5 : 0 }}
          className="text-center text-[10px] text-gray-400 mt-2"
        >
          AI can make mistakes. Verify deal details before purchasing.
        </motion.p>
      </div>
    </div>
  )
}

/**
 * User Message - Clean minimal design
 */
function UserMessage({ content }) {
  return (
    <div className="flex justify-end">
      <motion.div
        className="max-w-[80%] bg-gray-900 text-white px-4 py-3 rounded-2xl rounded-br-md"
        whileHover={{ scale: 1.005 }}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </motion.div>
    </div>
  )
}

/**
 * AI Message - Clean white card design
 */
function AIMessage({ content, thinking, deals, coupons, isStreaming, copiedId, onCopyCode }) {
  // Parse JSON if needed
  let displayContent = content || ''
  if (displayContent && displayContent.trim().startsWith('{') && displayContent.includes('"message"')) {
    try {
      const parsed = JSON.parse(displayContent)
      if (parsed && typeof parsed.message === 'string') {
        displayContent = parsed.message
      }
    } catch (e) { }
  }

  return (
    <div className="space-y-4">
      {/* Thinking section - Compact, no scroll */}
      {thinking && (
        <ThinkingSection content={thinking} isStreaming={isStreaming} />
      )}

      {/* Main message - Floating text, no box */}
      {displayContent ? (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3"
        >
          <LiquidOrb state={isStreaming ? OrbState.SPEAKING : OrbState.IDLE} size={32} className="flex-shrink-0 mt-0.5" />
          <p className="text-gray-800 leading-relaxed text-[15px]">{displayContent}</p>
        </motion.div>
      ) : isStreaming ? (
        <div className="flex items-center gap-3">
          <LiquidOrb state={OrbState.SPEAKING} size={32} />
          <SimpleThinkingIndicator />
        </div>
      ) : null}

      {/* Deal Cards */}
      {deals && deals.length > 0 && (
        <DealCardsGrid deals={deals.slice(0, 4)} />
      )}

      {/* Coupon Cards */}
      {coupons && coupons.length > 0 && (
        <div className="space-y-2">
          {coupons.slice(0, 3).map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              copied={copiedId === coupon.id}
              onCopy={() => onCopyCode(coupon.code, coupon.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Thinking Section - Minimal collapsible
 */
function ThinkingSection({ content, isStreaming }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-full cursor-pointer hover:bg-violet-100 transition-colors"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <motion.div
        animate={isStreaming ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="w-2 h-2 bg-violet-500 rounded-full"
      />
      <span className="text-xs font-medium text-violet-600">
        {isStreaming ? 'Thinking...' : 'View reasoning'}
      </span>
      <motion.svg
        animate={{ rotate: isOpen ? 180 : 0 }}
        className="w-3 h-3 text-violet-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9l6 6 6-6" />
      </motion.svg>

      {/* Expanded content - appears below */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-gray-600 leading-relaxed font-mono max-h-40 overflow-y-auto">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Loading State - Clean minimal
 */
function LoadingState({ stage }) {
  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <LiquidOrb state={OrbState.THINKING} size={36} />
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-md border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BouncingDots />
          <span className="text-sm text-gray-500">{stage.text}</span>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Deal Cards Grid
 */
function DealCardsGrid({ deals }) {
  const trail = useTrail(deals.length, {
    from: { opacity: 0, y: 20, scale: 0.95 },
    to: { opacity: 1, y: 0, scale: 1 },
    config: { tension: 300, friction: 25 }
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {trail.map((style, i) => (
        <animated.div key={deals[i].id} style={style}>
          <DealCard deal={deals[i]} />
        </animated.div>
      ))}
    </div>
  )
}

/**
 * Suggestion Pill - Clean minimal
 */
function SuggestionPill({ suggestion, index, onClick }) {
  const Icon = suggestion.icon

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left group"
    >
      <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
        {suggestion.label}
      </span>
    </motion.button>
  )
}

/**
 * Deal Card - Clean white design
 */
function DealCard({ deal }) {
  const [isHovered, setIsHovered] = useState(false)
  const discount = deal.discount_percentage ||
    (deal.original_price && deal.price ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100) : 0)

  const springStyle = useSpring({
    transform: isHovered
      ? 'translateY(-2px)'
      : 'translateY(0px)',
    boxShadow: isHovered
      ? '0 8px 24px rgba(0, 0, 0, 0.08)'
      : '0 1px 3px rgba(0, 0, 0, 0.04)',
    config: { tension: 300, friction: 20 }
  })

  return (
    <animated.a
      href={`/deal/${deal.id}`}
      style={springStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block bg-white rounded-xl p-3 border border-gray-100"
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {deal.image_url ? (
            <img src={deal.image_url} alt="" className="w-full h-full object-contain p-1.5" />
          ) : (
            <ShoppingBag className="w-5 h-5 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-800 line-clamp-2">
            {deal.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-gray-900">
              {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
            </span>
            {discount > 0 && (
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
            {deal.merchant || deal.company?.name}
            <ExternalLink className="w-2.5 h-2.5" />
          </p>
        </div>
      </div>
    </animated.a>
  )
}

/**
 * Coupon Card - Clean minimal design
 */
function CouponCard({ coupon, copied, onCopy }) {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
    >
      <div className="flex-shrink-0 text-center px-2">
        <div className="text-lg font-bold text-gray-900">
          {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : '$'}
        </div>
        <div className="text-[9px] text-gray-400 uppercase font-medium tracking-wide">OFF</div>
      </div>
      <div className="flex-1 min-w-0 border-l border-gray-100 pl-3">
        <p className="text-sm font-medium text-gray-700 line-clamp-1">
          {coupon.title || coupon.description}
        </p>
        <p className="text-[11px] text-gray-400">{coupon.company?.name}</p>
      </div>
      <motion.button
        onClick={onCopy}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${copied
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
      >
        {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />{coupon.code}</>}
      </motion.button>
    </motion.div>
  )
}
