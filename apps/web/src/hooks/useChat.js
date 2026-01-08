/**
 * useChat Hook
 * React hook for AI chat functionality with SSE streaming support
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '../lib/api'

// Message types
export const MessageRole = {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system'
}

// Chat states
export const ChatState = {
    IDLE: 'idle',
    LOADING: 'loading',
    STREAMING: 'streaming',
    ERROR: 'error'
}

/**
 * Custom hook for AI chat functionality
 * @param {Object} options - Hook options
 * @param {string} [options.conversationId] - Existing conversation ID
 * @param {boolean} [options.streaming=true] - Enable streaming responses
 * @param {Function} [options.onError] - Error callback
 * @returns {Object} Chat state and functions
 */
export function useChat({
    conversationId: initialConversationId = null,
    streaming = true,
    onError = null
} = {}) {
    // State
    const [messages, setMessages] = useState([])
    const [state, setState] = useState(ChatState.IDLE)
    const [error, setError] = useState(null)
    const [conversationId, setConversationId] = useState(initialConversationId)
    const [deals, setDeals] = useState([])
    const [coupons, setCoupons] = useState([])

    // Refs
    const abortRef = useRef(null)
    const streamCleanupRef = useRef(null)
    const currentMessageRef = useRef('')

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortRef.current) {
                abortRef.current.abort()
            }
            if (streamCleanupRef.current) {
                streamCleanupRef.current()
            }
        }
    }, [])

    /**
     * Send a message (non-streaming)
     */
    const sendMessageNonStreaming = useCallback(async (content) => {
        // Add user message optimistically
        const userMessage = {
            id: `temp-${Date.now()}`,
            role: MessageRole.USER,
            content,
            createdAt: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        setState(ChatState.LOADING)
        setError(null)
        setDeals([])
        setCoupons([])

        try {
            const response = await api.aiChat({
                message: content,
                conversationId,
                context: {
                    currentPage: window.location.pathname
                }
            })

            if (!response.success) {
                throw new Error(response.error || 'Failed to get response')
            }

            // Add assistant message
            const assistantMessage = {
                id: response.requestId,
                role: MessageRole.ASSISTANT,
                content: response.content,
                createdAt: new Date().toISOString(),
                deals: response.deals,
                coupons: response.coupons,
                cached: response.cached
            }

            setMessages(prev => [...prev, assistantMessage])

            if (response.deals) setDeals(response.deals)
            if (response.coupons) setCoupons(response.coupons)

            setState(ChatState.IDLE)

        } catch (err) {
            console.error('[useChat] Error:', err)
            setError(err.message)
            setState(ChatState.ERROR)
            if (onError) onError(err)
        }
    }, [conversationId, onError])

    /**
     * Send a message with streaming
     */
    const sendMessageStreaming = useCallback(async (content) => {
        // Add user message
        const userMessage = {
            id: `user-${Date.now()}`,
            role: MessageRole.USER,
            content,
            createdAt: new Date().toISOString()
        }

        // Add placeholder for assistant message
        const assistantMessage = {
            id: `assistant-${Date.now()}`,
            role: MessageRole.ASSISTANT,
            content: '',
            createdAt: new Date().toISOString(),
            isStreaming: true
        }

        setMessages(prev => [...prev, userMessage, assistantMessage])
        setState(ChatState.STREAMING)
        setError(null)
        setDeals([])
        setCoupons([])
        currentMessageRef.current = ''

        // Start SSE stream
        streamCleanupRef.current = api.aiChatStream(
            { message: content, conversationId },
            (event) => {
                switch (event.type) {
                    case 'start':
                        // Stream started
                        break

                    case 'text':
                        // Append text to current message
                        currentMessageRef.current += event.content
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastIndex = updated.length - 1
                            if (updated[lastIndex]?.role === MessageRole.ASSISTANT) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    content: currentMessageRef.current
                                }
                            }
                            return updated
                        })
                        break

                    case 'thinking':
                        // Append thinking/reasoning content separately
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastIndex = updated.length - 1
                            if (updated[lastIndex]?.role === MessageRole.ASSISTANT) {
                                const currentThinking = updated[lastIndex].thinking || ''
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    thinking: currentThinking + event.content
                                }
                            }
                            return updated
                        })
                        break

                    case 'deals':
                        // Received deal cards
                        setDeals(event.deals)
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastIndex = updated.length - 1
                            if (updated[lastIndex]?.role === MessageRole.ASSISTANT) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    deals: event.deals
                                }
                            }
                            return updated
                        })
                        break

                    case 'coupons':
                        // Received coupon cards
                        setCoupons(event.coupons)
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastIndex = updated.length - 1
                            if (updated[lastIndex]?.role === MessageRole.ASSISTANT) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    coupons: event.coupons
                                }
                            }
                            return updated
                        })
                        break

                    case 'done':
                        // Stream complete
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastIndex = updated.length - 1
                            if (updated[lastIndex]?.role === MessageRole.ASSISTANT) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    isStreaming: false
                                }
                            }
                            return updated
                        })
                        setState(ChatState.IDLE)
                        break

                    case 'error':
                        setError(event.error)
                        setState(ChatState.ERROR)
                        if (onError) onError(new Error(event.error))
                        break
                }
            },
            (error) => {
                setError('Connection lost. Please try again.')
                setState(ChatState.ERROR)
                if (onError) onError(error)
            }
        )
    }, [conversationId, onError])

    /**
     * Send a message
     */
    const sendMessage = useCallback((content) => {
        if (!content?.trim()) return
        if (state === ChatState.LOADING || state === ChatState.STREAMING) return

        if (streaming) {
            sendMessageStreaming(content.trim())
        } else {
            sendMessageNonStreaming(content.trim())
        }
    }, [streaming, state, sendMessageStreaming, sendMessageNonStreaming])

    /**
     * Cancel current request
     */
    const cancel = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort()
        }
        if (streamCleanupRef.current) {
            streamCleanupRef.current()
        }
        setState(ChatState.IDLE)
    }, [])

    /**
     * Clear chat history
     */
    const clear = useCallback(() => {
        setMessages([])
        setDeals([])
        setCoupons([])
        setError(null)
        setState(ChatState.IDLE)
        setConversationId(null)
    }, [])

    /**
     * Retry last message
     */
    const retry = useCallback(() => {
        if (messages.length === 0) return

        // Find last user message
        const lastUserMessage = [...messages].reverse().find(m => m.role === MessageRole.USER)
        if (!lastUserMessage) return

        // Remove failed assistant message if any
        setMessages(prev => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg?.role === MessageRole.ASSISTANT) {
                return prev.slice(0, -1)
            }
            return prev
        })

        // Resend
        sendMessage(lastUserMessage.content)
    }, [messages, sendMessage])

    /**
     * Load conversation history
     */
    const loadConversation = useCallback(async (convId) => {
        try {
            setState(ChatState.LOADING)
            const response = await api.getAIConversation(convId)

            if (response.success && response.messages) {
                setMessages(response.messages.map(m => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    createdAt: m.created_at,
                    metadata: m.metadata
                })))
                setConversationId(convId)
            }

            setState(ChatState.IDLE)
        } catch (err) {
            console.error('[useChat] Load conversation error:', err)
            setError(err.message)
            setState(ChatState.ERROR)
        }
    }, [])

    return {
        // State
        messages,
        state,
        error,
        isLoading: state === ChatState.LOADING,
        isStreaming: state === ChatState.STREAMING,
        deals,
        coupons,
        conversationId,

        // Actions
        sendMessage,
        cancel,
        clear,
        retry,
        loadConversation,

        // Setters for external control
        setMessages,
        setConversationId
    }
}

export default useChat
