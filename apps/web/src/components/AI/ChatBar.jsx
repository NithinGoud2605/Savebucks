/**
 * ChatBar Component
 * Floating AI chat input bar at the bottom of the page
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Suggested queries for quick access
const SUGGESTED_QUERIES = [
    '🔥 Hot deals today',
    '💻 Laptop deals under $800',
    '🎫 Amazon coupons',
    '📱 Best phone deals',
    '🏠 Home deals'
]

export default function ChatBar({
    onSubmit,
    isLoading = false,
    placeholder = 'Ask SaveBucks AI...',
    showSuggestions = true,
    expanded = false,
    onExpandToggle = null
}) {
    const [input, setInput] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef(null)
    const navigate = useNavigate()

    // Keyboard shortcut: Cmd/Ctrl + K to focus
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
            // Escape to blur
            if (e.key === 'Escape' && isFocused) {
                inputRef.current?.blur()
                setIsFocused(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFocused])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        if (onSubmit) {
            onSubmit(input.trim())
        } else {
            // Navigate to chat page with query
            navigate(`/chat?q=${encodeURIComponent(input.trim())}`)
        }

        setInput('')
    }

    const handleSuggestionClick = (suggestion) => {
        const query = suggestion.replace(/^[^\s]+\s/, '') // Remove emoji prefix
        if (onSubmit) {
            onSubmit(query)
        } else {
            navigate(`/chat?q=${encodeURIComponent(query)}`)
        }
    }

    return (
        <div className={`chat-bar-container ${isFocused ? 'focused' : ''} ${expanded ? 'expanded' : ''}`}>
            {/* Suggestions */}
            {showSuggestions && isFocused && !input && (
                <div className="chat-suggestions">
                    <span className="suggestions-label">Try asking:</span>
                    <div className="suggestions-list">
                        {SUGGESTED_QUERIES.map((suggestion, i) => (
                            <button
                                key={i}
                                className="suggestion-chip"
                                onClick={() => handleSuggestionClick(suggestion)}
                                type="button"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="chat-bar">
                <div className="chat-bar-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder={placeholder}
                    disabled={isLoading}
                    className="chat-input"
                    autoComplete="off"
                />

                {/* Keyboard shortcut hint */}
                {!isFocused && !input && (
                    <div className="keyboard-hint">
                        <kbd>⌘</kbd><kbd>K</kbd>
                    </div>
                )}

                {/* Send button */}
                <button
                    type="submit"
                    className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? (
                        <svg className="spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" opacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    )}
                </button>

                {/* Expand button */}
                {onExpandToggle && (
                    <button
                        type="button"
                        className="chat-expand-btn"
                        onClick={onExpandToggle}
                        title="Open full chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                    </button>
                )}
            </form>

            <style jsx>{`
        .chat-bar-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1rem;
          background: linear-gradient(to top, rgba(var(--bg-rgb, 255, 255, 255), 1) 60%, rgba(var(--bg-rgb, 255, 255, 255), 0));
          pointer-events: none;
        }
        
        .chat-bar-container > * {
          pointer-events: auto;
        }
        
        .chat-suggestions {
          max-width: 640px;
          margin: 0 auto 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--card-bg, #fff);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-color, #e5e7eb);
          animation: slideUp 0.2s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .suggestions-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
          margin-bottom: 0.5rem;
        }
        
        .suggestions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .suggestion-chip {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          border-radius: 9999px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg, #f9fafb);
          color: var(--text, #374151);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        
        .suggestion-chip:hover {
          background: var(--primary, #3b82f6);
          color: white;
          border-color: var(--primary, #3b82f6);
        }
        
        .chat-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 640px;
          margin: 0 auto;
          padding: 0.75rem 1rem;
          background: var(--card-bg, #fff);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
          border: 1px solid var(--border-color, #e5e7eb);
          transition: all 0.2s ease;
        }
        
        .focused .chat-bar {
          border-color: var(--primary, #3b82f6);
          box-shadow: 0 4px 24px rgba(59, 130, 246, 0.15);
        }
        
        .chat-bar-icon {
          flex-shrink: 0;
          color: var(--primary, #3b82f6);
        }
        
        .chat-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1rem;
          background: transparent;
          color: var(--text, #111827);
        }
        
        .chat-input::placeholder {
          color: var(--text-tertiary, #9ca3af);
        }
        
        .keyboard-hint {
          display: flex;
          gap: 2px;
          opacity: 0.5;
        }
        
        .keyboard-hint kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 4px;
          font-size: 0.6875rem;
          font-family: inherit;
          background: var(--bg, #f3f4f6);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          color: var(--text-secondary, #6b7280);
        }
        
        .chat-send-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: var(--bg, #f3f4f6);
          color: var(--text-tertiary, #9ca3af);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .chat-send-btn.active {
          background: var(--primary, #3b82f6);
          color: white;
        }
        
        .chat-send-btn:disabled {
          cursor: not-allowed;
        }
        
        .chat-expand-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .chat-expand-btn:hover {
          background: var(--bg, #f3f4f6);
          color: var(--text, #374151);
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Mobile adjustments */
        @media (max-width: 640px) {
          .chat-bar-container {
            padding: 0.75rem;
          }
          
          .chat-bar {
            padding: 0.625rem 0.875rem;
            border-radius: 12px;
          }
          
          .keyboard-hint {
            display: none;
          }
          
          .suggestion-chip {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
        }
      `}</style>
        </div>
    )
}
