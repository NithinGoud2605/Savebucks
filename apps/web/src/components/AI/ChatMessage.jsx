/**
 * ChatMessage Component
 * Enhanced message rendering with rich markdown, deal cards, and animations
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseMarkdown } from '../../lib/markdown'
import { SocialDealCard } from '../Homepage/SocialDealCard'
import { Copy, Check, ThumbsUp, ThumbsDown, ChevronDown, Brain } from 'lucide-react'
import LoadingAnimation, { LoadingType, DealCardSkeletonPremium } from './LoadingAnimation'

// Mini coupon card (keeping this for now as it's compact)
function InlineCouponCard({ coupon }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(coupon.coupon_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-coupon-card"
    >
      <div className="coupon-info">
        <div className="coupon-discount">
          {coupon.discount_type === 'percentage'
            ? `${coupon.discount_value}% OFF`
            : `$${coupon.discount_value} OFF`
          }
        </div>
        <h5 className="coupon-title">{coupon.title}</h5>
        <div className="coupon-store">{coupon.company?.name || 'Store'}</div>
      </div>
      <div className="coupon-code-section">
        <code className="coupon-code">{coupon.coupon_code}</code>
        <motion.button
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </motion.button>
      </div>
    </motion.div>
  )
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

// Deal card skeleton loader
function DealCardSkeleton() {
  return (
    <div className="deal-skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line long" />
        <div className="skeleton-meta">
          <div className="skeleton-badge" />
          <div className="skeleton-text" />
        </div>
      </div>
    </div>
  )
}

// Text skeleton loader
function TextSkeleton() {
  return (
    <div className="text-skeleton">
      <div className="skeleton-line long" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
    </div>
  )
}

// Thought Process Component (for reasoning models) - Glassmorphic Design
function ThoughtProcess({ content, isStreaming = false }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      className="thought-process"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        className={`thought-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="thought-toggle-left">
          <motion.div
            className="thought-icon-wrapper"
            animate={isStreaming ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Brain className="w-4 h-4" />
          </motion.div>
          <span>AI Reasoning</span>
          {isStreaming && (
            <motion.span
              className="streaming-badge"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Live
            </motion.span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="thought-content-wrapper"
          >
            <div className="thought-content">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ChatMessage({
  message,
  isStreaming = false,
  showFeedback = true,
  onFeedback = null,
  isWelcome = false
}) {
  const [feedback, setFeedback] = useState(null)
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const hasContent = message.content && message.content.trim()

  // Extract thinking process - prefer separate thinking property, fallback to content parsing
  let thinkingContent = message.thinking || null
  let displayContent = message.content || ''

  // Fallback: extract from content if no separate thinking property (legacy/non-streaming)
  if (!thinkingContent && displayContent.includes('<think>') && displayContent.includes('</think>')) {
    const match = displayContent.match(/<think>([\s\S]*?)<\/think>/)
    if (match) {
      thinkingContent = match[1].trim()
      displayContent = displayContent.replace(/<think>[\s\S]*?<\/think>/, '').trim()
    }
  } else if (!thinkingContent && displayContent.includes('<think>') && isStreaming) {
    // Handle streaming where closing tag might not be there yet
    const match = displayContent.match(/<think>([\s\S]*)/)
    if (match) {
      thinkingContent = match[1].trim()
      displayContent = ''
    }
  }

  // Parse JSON response if the AI returns structured data
  // DeepSeek R1 sometimes returns {"message": "...", "dealIds": [...]}
  if (displayContent && displayContent.trim().startsWith('{') && displayContent.includes('"message"')) {
    try {
      const parsed = JSON.parse(displayContent)
      if (parsed && typeof parsed.message === 'string') {
        displayContent = parsed.message
      }
    } catch (e) {
      // Not valid JSON, display as-is (might still be streaming)
    }
  }

  const handleFeedback = (rating) => {
    setFeedback(rating)
    if (onFeedback) {
      onFeedback(message.id, rating)
    }
  }

  const handleCopy = async () => {
    if (!displayContent) return
    try {
      await navigator.clipboard.writeText(displayContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Parse markdown content
  const markdownHtml = displayContent ? parseMarkdown(displayContent) : null

  // Message animation variants (optimized for 60fps)
  const messageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1] // Custom easing for smooth feel
      }
    }
  }

  // Deal card stagger variants (optimized timing)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  return (
    <motion.div
      className={`chat-message ${isUser ? 'user' : 'assistant'} ${isWelcome ? 'welcome' : ''}`}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      {/* Avatar */}
      <div className="message-avatar">
        {isUser ? (
          <motion.div
            className="avatar user-avatar"
            whileHover={{ scale: 1.05 }}
          >
            <span>👤</span>
          </motion.div>
        ) : (
          <motion.div
            className="avatar ai-avatar"
            animate={
              isStreaming && !displayContent && !thinkingContent
                ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>🤖</span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="message-content">
        {/* Welcome message special styling */}
        {isWelcome ? (
          <motion.div
            className="welcome-card"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {markdownHtml && (
              <div
                className="message-text welcome-text"
                dangerouslySetInnerHTML={{ __html: markdownHtml }}
              />
            )}
          </motion.div>
        ) : (
          <>
            {/* Thinking Process logic */}
            {thinkingContent && (
              <ThoughtProcess content={thinkingContent} />
            )}

            {/* Message text */}
            <div className="message-text">
              {isStreaming && !displayContent && !thinkingContent ? (
                <LoadingAnimation type={LoadingType.THINKING} size={60} />
              ) : (
                <>
                  {markdownHtml && (
                    <div
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: markdownHtml }}
                    />
                  )}
                  {isStreaming && hasContent && (
                    <motion.span
                      className="cursor-blink"
                      animate={{ opacity: [1, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      |
                    </motion.span>
                  )}
                </>
              )}
            </div>

            {/* Loading skeletons for deals */}
            {isStreaming && !message.deals && (
              <motion.div
                className="deals-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="deal-card-wrapper"
                  >
                    <DealCardSkeletonPremium />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Copy button for assistant messages */}
            {isAssistant && hasContent && !isStreaming && (
              <motion.button
                className="copy-button"
                onClick={handleCopy}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Copy message"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </motion.button>
            )}

            {/* Deal cards in grid */}
            {message.deals && message.deals.length > 0 && (
              <motion.div
                className="deals-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {message.deals.map((deal, index) => (
                  <motion.div
                    key={deal.id || index}
                    variants={itemVariants}
                    className="deal-card-wrapper"
                  >
                    <SocialDealCard deal={deal} index={index} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Coupon cards */}
            {message.coupons && message.coupons.length > 0 && (
              <motion.div
                className="coupons-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {message.coupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id || index}
                    variants={itemVariants}
                  >
                    <InlineCouponCard coupon={coupon} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Feedback buttons */}
            {isAssistant && showFeedback && !isStreaming && !feedback && (
              <motion.div
                className="message-feedback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  className="feedback-btn"
                  onClick={() => handleFeedback('positive')}
                  title="Good response"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ThumbsUp className="w-4 h-4" />
                </motion.button>
                <motion.button
                  className="feedback-btn"
                  onClick={() => handleFeedback('negative')}
                  title="Bad response"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ThumbsDown className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {feedback && (
              <motion.div
                className="feedback-thanks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Thanks for your feedback!
              </motion.div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .chat-message {
          display: flex;
          gap: 12px;
          padding: 16px 0;
          position: relative;
        }
        
        .chat-message.user {
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          flex-shrink: 0;
        }
        
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        
        .user-avatar {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }
        
        .ai-avatar {
          background: linear-gradient(135deg, #10b981, #14b8a6);
        }
        
        .message-content {
          flex: 1;
          min-width: 0;
          max-width: 85%;
          position: relative;
        }
        
        .user .message-content {
          text-align: right;
        }
        
        .message-text {
          display: inline-block;
          padding: 12px 16px;
          border-radius: 16px;
          line-height: 1.6;
          text-align: left;
          background: #f9fafb;
          color: #111827;
          border-bottom-left-radius: 4px;
          position: relative;
        }
        
        .user .message-text {
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: white;
          border-bottom-right-radius: 4px;
          border-bottom-left-radius: 16px;
        }
        
        .welcome-card {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #fbbf24;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15);
        }
        
        .welcome-text {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        /* Markdown styling */
        .markdown-content :global(h1),
        .markdown-content :global(h2),
        .markdown-content :global(h3),
        .markdown-content :global(h4) {
          margin: 16px 0 8px;
          font-weight: 600;
          line-height: 1.3;
        }
        
        .markdown-content :global(h1) {
          font-size: 24px;
          color: #111827;
        }
        
        .markdown-content :global(h2) {
          font-size: 20px;
          color: #374151;
        }
        
        .markdown-content :global(h3) {
          font-size: 18px;
          color: #4b5563;
        }
        
        .markdown-content :global(h4) {
          font-size: 16px;
          color: #6b7280;
        }
        
        .markdown-content :global(p) {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        .markdown-content :global(ul),
        .markdown-content :global(ol) {
          margin: 12px 0;
          padding-left: 24px;
        }
        
        .markdown-content :global(li) {
          margin: 6px 0;
          line-height: 1.6;
        }
        
        .markdown-content :global(strong) {
          font-weight: 600;
          color: inherit;
        }
        
        .markdown-content :global(code) {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .markdown-content :global(pre) {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
        }
        
        .markdown-content :global(pre code) {
          background: none;
          padding: 0;
        }
        
        .markdown-content :global(a) {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .user .markdown-content :global(a) {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
        }
        
        .cursor-blink {
          display: inline-block;
          margin-left: 2px;
          color: #3b82f6;
          font-weight: 400;
        }
        
        /* Deal cards grid */
        .deals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        
        @media (min-width: 768px) {
          .deals-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .deal-card-wrapper {
          width: 100%;
        }
        
        /* Coupons */
        .coupons-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        
        .inline-coupon-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px dashed #f59e0b;
          border-radius: 12px;
        }
        
        .coupon-info {
          flex: 1;
        }
        
        .coupon-discount {
          font-size: 18px;
          font-weight: 700;
          color: #b45309;
          margin-bottom: 2px;
        }
        
        .coupon-title {
          margin: 0 0 2px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        
        .coupon-store {
          font-size: 12px;
          color: #6b7280;
        }
        
        .coupon-code-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .coupon-code {
          padding: 8px 12px;
          background: white;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
        }
        
        .copy-btn {
          padding: 8px 12px;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .copy-btn:hover {
          background: #d97706;
        }
        
        .copy-btn.copied {
          background: #10b981;
        }
        
        .copy-button {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .message-content:hover .copy-button {
          opacity: 1;
        }
        
        .copy-button:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        /* Feedback */
        .message-feedback {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .feedback-btn {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          background: transparent;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }
        
        .feedback-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #374151;
        }
        
        .feedback-thanks {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }
        
        /* Loading skeletons */
        .deal-skeleton {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        
        .skeleton-image {
          width: 60px;
          height: 60px;
          background: linear-gradient(
            90deg,
            #f3f4f6 25%,
            #e5e7eb 50%,
            #f3f4f6 75%
          );
          background-size: 200% 100%;
          border-radius: 8px;
          animation: shimmer 1.5s infinite;
        }
        
        .skeleton-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .skeleton-line {
          height: 12px;
          background: linear-gradient(
            90deg,
            #f3f4f6 25%,
            #e5e7eb 50%,
            #f3f4f6 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }
        
        .skeleton-line.short {
          width: 40%;
        }
        
        .skeleton-line.medium {
          width: 70%;
        }
        
        .skeleton-line.long {
          width: 100%;
        }
        
        .skeleton-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        
        .skeleton-badge {
          width: 50px;
          height: 18px;
          background: linear-gradient(
            90deg,
            #f3f4f6 25%,
            #e5e7eb 50%,
            #f3f4f6 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }
        
        .skeleton-text {
          width: 60px;
          height: 14px;
          background: linear-gradient(
            90deg,
            #f3f4f6 25%,
            #e5e7eb 50%,
            #f3f4f6 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }
        
        .text-skeleton {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        /* Thought Process - Glassmorphic Design */
        .thought-process {
          margin-bottom: 16px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
          border: 1px solid rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08);
        }

        .thought-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #7c3aed;
          transition: all 0.2s;
        }

        .thought-toggle-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .thought-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 8px;
          color: white;
        }

        .streaming-badge {
          padding: 2px 8px;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        .thought-toggle:hover {
          background: rgba(139, 92, 246, 0.08);
        }

        .thought-toggle.open {
          border-bottom: 1px solid rgba(139, 92, 246, 0.15);
        }

        .thought-content-wrapper {
          overflow: hidden;
        }

        .thought-content {
          padding: 16px;
          font-size: 13px;
          line-height: 1.7;
          color: #4b5563;
          background: rgba(255, 255, 255, 0.6);
          white-space: pre-wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          max-height: 300px;
          overflow-y: auto;
        }

        .thought-content::-webkit-scrollbar {
          width: 6px;
        }

        .thought-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }

        .thought-content::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .message-content {
            max-width: 90%;
          }
          
          .message-text {
            padding: 10px 14px;
          }
          
          .deals-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  )
}
