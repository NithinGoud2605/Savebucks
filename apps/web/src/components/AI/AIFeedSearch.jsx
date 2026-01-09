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
  Store,
  ExternalLink,
  Copy,
  Check,
  Square
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

export default function AIFeedSearch({ onAIActive, isAIActive = false, showInputBar = true, showOnlyInputBar = false, chatState }) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [loadingStage, setLoadingStage] = useState(0)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const internalChatState = useChat({ streaming: true })
  const { messages, deals, coupons, sendMessage, clear, isLoading, isStreaming, error, retry, isAuthenticated } = chatState || internalChatState
  const [guestUsage, setGuestUsage] = useState(0)
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  // Track guest usage
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const stored = localStorage.getItem('guest_ai_usage')
        if (stored) {
          const { count, date } = JSON.parse(stored)
          const today = new Date().toDateString()
          if (date === today) {
            setGuestUsage(count)
          } else {
            localStorage.setItem('guest_ai_usage', JSON.stringify({ count: 0, date: today }))
            setGuestUsage(0)
          }
        }
      } catch (e) {
        console.error('Error reading guest usage:', e)
      }
    }
  }, [isAuthenticated])

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

    // Guest limit check
    if (!isAuthenticated) {
      if (guestUsage >= 2) {
        setShowLimitWarning(true)
        setTimeout(() => setShowLimitWarning(false), 5000)
        return
      }

      const newCount = guestUsage + 1
      setGuestUsage(newCount)
      localStorage.setItem('guest_ai_usage', JSON.stringify({
        count: newCount,
        date: new Date().toDateString()
      }))
    }

    if (onAIActive) onAIActive(true)
    sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestionClick = (query) => {
    // Guest limit check for suggestions
    if (!isAuthenticated) {
      if (guestUsage >= 2) {
        setShowLimitWarning(true)
        setTimeout(() => setShowLimitWarning(false), 5000)
        return
      }

      const newCount = guestUsage + 1
      setGuestUsage(newCount)
      localStorage.setItem('guest_ai_usage', JSON.stringify({
        count: newCount,
        date: new Date().toDateString()
      }))
    }

    if (onAIActive) onAIActive(true)
    sendMessage(query)
  }

  const handleClose = () => {
    // We do NOT clear() here anymore to allow background persistence
    // clear()
    if (onAIActive) onAIActive(false)
  }

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Chat replaces the middle content area - uses parent's height
  // If showOnlyInputBar, only render the input bar
  // If showInputBar=false, hide the input bar (messages only)
  return (
    <div className={`flex flex-col relative ${isAIActive && !showOnlyInputBar ? 'h-full' : ''}`}>
      {/* Only show full content if NOT showOnlyInputBar mode */}
      {!showOnlyInputBar && (
        <>
          {/* Floating animated orbs background - ONLY when focused, NOT during active chat */}
          <AnimatePresence>
            {isFocused && !isAIActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
                style={{ top: '100px' }}
              >
                {/* Large floating orb - drifts left to right */}
                <motion.div
                  animate={{
                    x: ['-200px', 'calc(100vw + 200px)'],
                    y: ['50px', '150px', '50px'],
                  }}
                  transition={{
                    x: { duration: 20, repeat: Infinity, ease: 'linear' },
                    y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)',
                    filter: 'blur(80px)',
                  }}
                />

                {/* Medium orb - drifts right to left */}
                <motion.div
                  animate={{
                    x: ['calc(100vw + 200px)', '-200px'],
                    y: ['300px', '200px', '300px'],
                  }}
                  transition={{
                    x: { duration: 25, repeat: Infinity, ease: 'linear' },
                    y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{
                    position: 'absolute',
                    width: '350px',
                    height: '350px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0.15) 40%, transparent 70%)',
                    filter: 'blur(70px)',
                  }}
                />

                {/* Small accent orb - faster movement */}
                <motion.div
                  animate={{
                    x: ['-150px', 'calc(100vw + 150px)'],
                    y: ['500px', '350px', '500px'],
                  }}
                  transition={{
                    x: { duration: 15, repeat: Infinity, ease: 'linear' },
                    y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(168, 85, 247, 0.15) 40%, transparent 70%)',
                    filter: 'blur(60px)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* OUTER FOG CLOUDS - ONLY when focused, NOT during active chat */}
          <AnimatePresence>
            {isFocused && !isAIActive && (
              <>
                {/* Top fog cloud - subtle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 w-[110%] h-32 pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                {/* Purple accent glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-[120%] h-24 pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                  }}
                />

                {/* Bottom fog cloud - subtle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[110%] h-28 pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(255, 255, 255, 0.7) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                {/* Blue accent glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[120%] h-20 pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    filter: 'blur(25px)',
                  }}
                />

                {/* Left fog edge - subtle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-[-40px] top-1/3 w-24 h-[50%] pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse 100% 80% at 100% 50%, rgba(255, 255, 255, 0.6) 0%, transparent 100%)',
                    filter: 'blur(20px)',
                  }}
                />

                {/* Right fog edge - subtle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-[-40px] top-1/3 w-24 h-[50%] pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse 100% 80% at 0% 50%, rgba(255, 255, 255, 0.6) 0%, transparent 100%)',
                    filter: 'blur(20px)',
                  }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Messages Content - Clean container, no inner fog */}
          <AnimatePresence>
            {isAIActive && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{
                  type: 'spring',
                  stiffness: 120,
                  damping: 20,
                  mass: 0.8
                }}
                className="flex-1 min-h-0 relative z-30"
              >
                {/* Messages scroll container - scrollable with auto-scroll to bottom */}
                <div
                  className="px-4 pt-4 pb-4 space-y-4 overflow-y-auto scrollbar-hide h-full flex flex-col"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                >
                  {/* Spacer to push content down when few messages */}
                  <div className="flex-grow min-h-0" />
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id || i}
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
                          deals={msg.deals}
                          coupons={msg.coupons}
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

          {/* Suggestions - Clean, no inner fog */}
          <AnimatePresence>
            {isFocused && !isAIActive && !input && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 25 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 16,
                  mass: 0.8
                }}
                className="px-6 pb-5 pt-5"
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
        </>
      )}

      {/* Limit Warning Toast */}
      <AnimatePresence>
        {showLimitWarning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium"
          >
            <span className="bg-white/20 p-1 rounded-full"><LockIcon className="w-3 h-3" /></span>
            Guest limit reached (2/2). Sign in for unlimited AI.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar - only show if showInputBar is true OR if showOnlyInputBar mode */}
      {(showInputBar || showOnlyInputBar) && (
        <div className="">
          <form onSubmit={handleSubmit}>
            <motion.div
              animate={{
                boxShadow: isFocused || isAIActive
                  ? '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)'
                  : '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)'
              }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3 bg-white rounded-full ${!isAuthenticated && guestUsage >= 2 ? 'opacity-75' : ''}`}
            >
              {/* Pulse Orb - Always moving */}
              <LiquidOrb state={orbState} size={40} />

              <div className="flex-1 flex flex-col justify-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                  placeholder={!isAuthenticated && guestUsage >= 2 ? "Sign in to continue chatting..." : (isAIActive ? "Ask a follow-up..." : "Ask anything about deals...")}
                  disabled={isLoading || isStreaming || (!isAuthenticated && guestUsage >= 2)}
                  className="w-full bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none text-sm text-gray-900 placeholder:text-gray-400"
                />
                {/* Guest Limit Status Text */}
                {!isAuthenticated && (
                  <span className={`text-[9px] font-medium ml-1 transition-colors ${guestUsage >= 2 ? 'text-red-500' : 'text-gray-400'}`}>
                    {guestUsage >= 2 ? 'Guest limit reached' : `${2 - guestUsage} free search${2 - guestUsage !== 1 ? 'es' : ''} left`}
                  </span>
                )}
              </div>

              {/* Keyboard hint */}
              {!isFocused && !isAIActive && !input && isAuthenticated && (
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
                disabled={!input.trim() || isLoading || isStreaming || (!isAuthenticated && guestUsage >= 2)}
                whileHover={{ scale: input.trim() ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() ? 0.95 : 1 }}
                className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                ${input.trim() && (!isAuthenticated ? guestUsage < 2 : true)
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-400'
                  }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              >
                {isLoading || isStreaming ? (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      chatState.cancel();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-full h-full flex items-center justify-center bg-gray-900 text-white rounded-full"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </motion.button>
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
      )}
    </div>
  )
}

function LockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow transition-all text-left group"
    >
      <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors" />
      <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
        {suggestion.label}
      </span>
    </motion.button>
  )
}

/**
 * Deal Card - Compact design matching main feed
 */
function DealCard({ deal }) {
  const [isHovered, setIsHovered] = useState(false)
  const discount = deal.discount_percentage ||
    (deal.original_price && deal.price ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100) : 0)

  return (
    <a
      href={`/deal/${deal.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`block bg-white rounded-lg p-2.5 border border-gray-100 h-[80px]
                  transition-all duration-200 ${isHovered ? 'shadow-md border-gray-200 -translate-y-0.5' : ''}`}
    >
      <div className="flex gap-2.5 h-full">
        {/* Product Image - No padded box */}
        <div className="flex-shrink-0">
          {deal.image_url ? (
            <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-50">
              <img src={deal.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Store name */}
          <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
            <Store className="w-2.5 h-2.5" />
            {deal.merchant || deal.company?.name || 'Store'}
          </p>

          {/* Title - Single line */}
          <h4 className={`text-xs font-medium text-gray-800 line-clamp-1 mb-1 transition-colors ${isHovered ? 'text-violet-600' : ''}`}>
            {deal.title}
          </h4>

          {/* Price Row */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900">
              {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
            </span>
            {deal.original_price && deal.original_price > deal.price && (
              <span className="text-[10px] text-gray-400 line-through">
                {formatPrice(deal.original_price)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-[10px] font-semibold text-red-500">
                -{discount}%
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
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
