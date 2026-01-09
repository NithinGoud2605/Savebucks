/**
 * ChatWindow Component
 * Modern minimal ChatGPT-style chat interface with progressive loading states
 */

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useChat, { ChatState } from '../../hooks/useChat'
import ChatMessage from './ChatMessage'
import { api } from '../../lib/api'
import { Sparkles, Plus, Send, Loader2 } from 'lucide-react'

// Welcome message with rich formatting
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `# Welcome to SaveBucks AI! 👋

Your personal deals assistant, here to help you find the best savings.

## What I can do:
• 🔍 **Find deals** - Search for products with discounts
• 🎫 **Get coupons** - Find verified coupon codes for stores
• ⚖️ **Compare products** - Side-by-side comparisons with recommendations
• 📊 **Buying advice** - Know if it's the right time to buy
• 🔥 **Trending deals** - See what's hot in the community

## Get started:
Try asking me:
- "Find laptop deals under $800"
- "Coupons for Amazon"
- "Compare iPhone vs Samsung"
- "Should I buy this TV now?"
- "What's trending today?"

**I always show real prices, discount percentages, and community ratings.** Let's start saving! 💰`,
  isWelcome: true
}

// Quick suggestion prompts
const QUICK_SUGGESTIONS = [
  { text: 'Find trending deals', query: 'Show me today\'s trending deals' },
  { text: 'Best coupons', query: 'What are the best coupon codes right now?' },
  { text: 'Flash sales', query: 'Any flash sales happening now?' },
  { text: 'Budget options', query: 'Show me deals under $50' }
]

// Status states for progressive loading
const STATUS_STATES = {
  IDLE: { text: 'Ready', color: '#10b981', icon: null },
  THINKING: { text: 'Thinking...', color: '#8b5cf6', icon: 'think' },
  SEARCHING: { text: 'Searching deals...', color: '#3b82f6', icon: 'search' },
  ANALYZING: { text: 'Analyzing results...', color: '#10b981', icon: 'analyze' },
  STREAMING: { text: 'Generating response...', color: '#14b8a6', icon: 'stream' }
}

export default function ChatWindow({
  conversationId: initialConversationId = null,
  onNewConversation = null,
  embedded = false,
  className = ''
}) {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q')

  const {
    messages,
    state,
    error,
    isLoading,
    isStreaming,
    sendMessage,
    clear,
    retry
  } = useChat({
    conversationId: initialConversationId,
    streaming: true
  })

  const [input, setInput] = useState('')
  const [statusState, setStatusState] = useState(STATUS_STATES.IDLE)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const hasProcessedInitialQuery = useRef(false)

  // Update status state based on chat state
  useEffect(() => {
    if (isLoading) {
      setStatusState(STATUS_STATES.THINKING)
    } else if (isStreaming) {
      // Progressively update status during streaming
      setTimeout(() => setStatusState(STATUS_STATES.SEARCHING), 500)
      setTimeout(() => setStatusState(STATUS_STATES.ANALYZING), 1500)
      setTimeout(() => setStatusState(STATUS_STATES.STREAMING), 2500)
    } else {
      setStatusState(STATUS_STATES.IDLE)
    }
  }, [isLoading, isStreaming])

  // Smart scroll anchoring - only auto-scroll if user is near bottom
  useEffect(() => {
    if (!userHasScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming, userHasScrolled])

  // Reset scroll lock when streaming ends
  useEffect(() => {
    if (!isStreaming && !isLoading) {
      setUserHasScrolled(false)
    }
  }, [isStreaming, isLoading])

  // Detect user scroll
  const handleScroll = (e) => {
    const container = e.target
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (!isNearBottom && isStreaming) {
      setUserHasScrolled(true)
    } else if (isNearBottom) {
      setUserHasScrolled(false)
    }
  }

  // Process initial query from URL
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQuery.current && messages.length === 0) {
      hasProcessedInitialQuery.current = true
      sendMessage(initialQuery)
    }
  }, [initialQuery, sendMessage, messages.length])

  // Focus input on mount
  useEffect(() => {
    if (!embedded) {
      inputRef.current?.focus()
    }
  }, [embedded])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isStreaming) return

    sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion.query)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e)
    }
  }

  const handleFeedback = async (messageId, rating) => {
    try {
      await api.submitAIFeedback({ messageId, rating })
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  const handleNewChat = () => {
    clear()
    if (onNewConversation) {
      onNewConversation()
    }
  }

  // Display messages with welcome if empty
  const displayMessages = messages.length > 0 ? messages : [WELCOME_MESSAGE]
  const showWelcome = messages.length === 0

  return (
    <div className={`chat-window ${embedded ? 'embedded' : ''} ${className}`}>
      {/* Header */}
      {!embedded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="chat-header"
        >
          <div className="header-left">
            <motion.div
              className="header-icon"
              animate={
                statusState === STATUS_STATES.THINKING ||
                  statusState === STATUS_STATES.SEARCHING ||
                  statusState === STATUS_STATES.ANALYZING
                  ? { scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1],
                repeatType: 'reverse'
              }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <div className="header-info">
              <h2>SaveBucks AI</h2>
              <motion.span
                className="status"
                style={{ color: statusState.color }}
                key={statusState.text}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {statusState.text}
              </motion.span>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="header-btn"
              onClick={handleNewChat}
              title="New chat"
              aria-label="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <AnimatePresence mode="popLayout">
          {displayMessages.map((message, index) => (
            <ChatMessage
              key={message.id || index}
              message={message}
              isStreaming={isStreaming && index === displayMessages.length - 1}
              showFeedback={message.id !== 'welcome' && !message.isWelcome}
              onFeedback={handleFeedback}
              isWelcome={message.isWelcome || message.id === 'welcome'}
            />
          ))}
        </AnimatePresence>

        {/* Quick suggestions on welcome */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="quick-suggestions"
          >
            {QUICK_SUGGESTIONS.map((suggestion, i) => (
              <motion.button
                key={i}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                {suggestion.text}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Error message */}
        {error && state === ChatState.ERROR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="error-message"
          >
            <p>{error}</p>
            <button onClick={retry} className="retry-btn">
              Try Again
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <motion.div
          className="input-container"
          initial={false}
          animate={{
            borderColor: input.trim() ? '#3b82f6' : '#e5e7eb',
            boxShadow: input.trim()
              ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
              : 'none'
          }}
          transition={{ duration: 0.15 }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about deals, coupons, or products..."
            disabled={isLoading || isStreaming}
            rows={1}
            className="chat-textarea"
            style={{
              minHeight: '24px',
              maxHeight: '120px',
              height: `${Math.min(input.split('\n').length * 24, 120)}px`
            }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading || isStreaming}
            className={`send-btn ${input.trim() ? 'active' : ''}`}
            whileHover={input.trim() ? { scale: 1.05 } : {}}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
          >
            {isLoading || isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>

          {/* Keyboard hints */}
          <div className="keyboard-hints">
            <span className="hint">
              <kbd>↵</kbd> Send
            </span>
            <span className="hint">
              <kbd>⇧</kbd><kbd>↵</kbd> New line
            </span>
          </div>
        </motion.div>
        <p className="input-hint">
          SaveBucks AI can make mistakes. Always verify deal details before purchasing.
        </p>
      </form>

      <style jsx>{`
        .chat-window {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100vh;
          background: #ffffff;
        }
        
        .chat-window.embedded {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        
        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .header-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .header-info h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          line-height: 1.2;
        }
        
        .status {
          font-size: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
        
        .header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .header-btn:hover {
          background: #f9fafb;
          color: #374151;
          border-color: #d1d5db;
        }
        
        /* Messages - with 3D Orb Background */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
          position: relative;
          overflow-x: hidden;
        }
        
        .chat-messages::before {
          content: '';
          position: fixed;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(139, 92, 246, 0.35) 0%,
            rgba(124, 58, 237, 0.25) 30%,
            rgba(109, 40, 217, 0.15) 50%,
            rgba(139, 92, 246, 0.05) 70%,
            transparent 100%
          );
          filter: blur(40px);
          right: -100px;
          top: 150px;
          animation: orbFloat 8s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        
        .chat-messages::after {
          content: '';
          position: fixed;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 70% 70%,
            rgba(59, 130, 246, 0.3) 0%,
            rgba(99, 102, 241, 0.2) 40%,
            rgba(139, 92, 246, 0.1) 60%,
            transparent 100%
          );
          filter: blur(50px);
          left: -50px;
          bottom: 200px;
          animation: orbFloat2 10s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        
        @keyframes orbFloat {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-30px) translateX(20px) scale(1.05);
          }
          50% {
            transform: translateY(-10px) translateX(-15px) scale(0.95);
          }
          75% {
            transform: translateY(-40px) translateX(10px) scale(1.02);
          }
        }
        
        @keyframes orbFloat2 {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          33% {
            transform: translateY(25px) translateX(-20px) scale(1.08);
          }
          66% {
            transform: translateY(-20px) translateX(30px) scale(0.92);
          }
        }
        
        .quick-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
          padding-left: 48px;
        }
        
        .suggestion-chip {
          padding: 8px 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 500;
        }
        
        .suggestion-chip:hover {
          background: #f3f4f6;
          border-color: #8b5cf6;
          color: #8b5cf6;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          margin: 16px 0;
        }
        
        .error-message p {
          margin: 0;
          flex: 1;
        }
        
        .retry-btn {
          padding: 6px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .retry-btn:hover {
          background: #b91c1c;
        }
        
        /* Input */
        .chat-input-form {
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
        }
        
        .input-container {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.15s ease;
        }
        
        .chat-textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          font-size: 15px;
          line-height: 1.5;
          background: transparent;
          color: #111827;
          font-family: inherit;
        }
        
        .chat-textarea::placeholder {
          color: #9ca3af;
        }
        
        .send-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .send-btn.active {
          background: #3b82f6;
          color: white;
        }
        
        .send-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        .input-hint {
          margin: 8px 0 0;
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
        }
        
        /* Mobile */
        @media (max-width: 640px) {
          .chat-header {
            padding: 12px 16px;
          }
          
          .chat-messages {
            padding: 16px;
          }
          
          .chat-input-form {
            padding: 12px 16px;
          }
          
          .quick-suggestions {
            padding-left: 0;
          }
        }
      `}</style>
    </div>
  )
}
