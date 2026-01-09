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
 * @param {boolean} [options.isAuthenticated=false] - Whether user is logged in
 * @param {Function} [options.onError] - Error callback
 * @returns {Object} Chat state and functions
 */
export function useChat({
    conversationId: initialConversationId = null,
    streaming = true,
    isAuthenticated: isAuthenticatedOverride = null,
    onError = null
} = {}) {
    // Auto-detect authentication from localStorage token if not explicitly provided
    const isAuthenticated = isAuthenticatedOverride ?? Boolean(localStorage.getItem('access_token'))

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
    const currentStreamingIdRef = useRef(null)  // Track which message is currently streaming

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

    // localStorage key for chat persistence (guest users only)
    const CHAT_STORAGE_KEY = 'savebucks_chat_history'

    // Load chat from database if logged in and conversationId provided
    useEffect(() => {
        if (isAuthenticated && initialConversationId) {
            // Load specific conversation from database
            const loadFromDatabase = async () => {
                try {
                    const response = await api.getAIConversation(initialConversationId)
                    if (response.success && response.messages?.length > 0) {
                        const loadedMessages = response.messages.map(msg => ({
                            id: msg.id,
                            role: msg.role,
                            content: msg.content,
                            createdAt: msg.created_at,
                            // Load actual deals from the response
                            deals: msg.deals || [],
                            coupons: msg.coupons || []
                        }))
                        setMessages(loadedMessages)
                    }
                } catch (e) {
                    console.error('[useChat] Failed to load conversation from DB:', e)
                    loadFromLocalStorage()
                }
            }
            loadFromDatabase()
        } else if (isAuthenticated && !initialConversationId) {
            // Auto-load most recent conversation for logged-in users (cross-device support)
            const loadRecentConversation = async () => {
                try {
                    const response = await api.getAIConversations()
                    if (response.success && response.conversations?.length > 0) {
                        // Load the most recent conversation
                        const recent = response.conversations[0]
                        console.log(`[useChat] Auto-loading recent conversation: ${recent.id}`)

                        const convResponse = await api.getAIConversation(recent.id)
                        if (convResponse.success && convResponse.messages?.length > 0) {
                            const loadedMessages = convResponse.messages.map(msg => ({
                                id: msg.id,
                                role: msg.role,
                                content: msg.content,
                                createdAt: msg.created_at,
                                // Load actual deals from the response
                                deals: msg.deals || [],
                                coupons: msg.coupons || []
                            }))
                            setMessages(loadedMessages)
                            setConversationId(recent.id)
                        }
                    }
                } catch (e) {
                    console.error('[useChat] Failed to load recent conversation:', e)
                    // Silent fail - start fresh conversation
                }
            }
            loadRecentConversation()
        } else if (!isAuthenticated) {
            // Guest user - load from localStorage
            loadFromLocalStorage()
        }
    }, [initialConversationId, isAuthenticated])

    // Helper function to load from localStorage
    const loadFromLocalStorage = () => {
        try {
            const saved = localStorage.getItem(CHAT_STORAGE_KEY)
            if (saved) {
                const { messages: savedMsgs, timestamp } = JSON.parse(saved)
                // Only load if less than 24 hours old
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && savedMsgs?.length) {
                    setMessages(savedMsgs)
                } else {
                    localStorage.removeItem(CHAT_STORAGE_KEY)
                }
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    // Save to localStorage for guest users only
    useEffect(() => {
        if (!isAuthenticated && messages.length > 0 && state !== ChatState.STREAMING) {
            try {
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
                    messages,
                    timestamp: Date.now()
                }))
            } catch (e) {
                // Ignore localStorage errors (quota exceeded, etc.)
            }
        }
    }, [messages, state, isAuthenticated])

    // Auto-create conversation for logged-in users on first message
    const ensureConversation = useCallback(async () => {
        if (isAuthenticated && !conversationId) {
            try {
                const response = await api.createAIConversation()
                if (response.success && response.conversation?.id) {
                    setConversationId(response.conversation.id)
                    return response.conversation.id
                }
            } catch (e) {
                console.error('[useChat] Failed to create conversation:', e)
            }
        }
        return conversationId
    }, [isAuthenticated, conversationId])

    /**
     * Send a message (non-streaming)
     */
    const sendMessageNonStreaming = useCallback(async (content) => {
        // Auto-create conversation for logged-in users
        const activeConversationId = await ensureConversation()

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
            // Build history from previous messages (last 10, including deals context)
            const history = messages
                .filter(m => m.content && m.content.trim())
                .slice(-10)
                .map(m => ({
                    role: m.role,
                    content: m.content,
                    // Include deals context for AI to reference in follow-ups
                    deals: m.deals?.slice(0, 4).map(d => ({ id: d.id, title: d.title, price: d.price, store: d.merchant })) || []
                }))

            const response = await api.aiChat({
                message: content,
                history,
                conversationId: activeConversationId,
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
    }, [messages, onError, ensureConversation])

    /**
     * Send a message with streaming
     */
    const sendMessageStreaming = useCallback(async (content) => {
        // Auto-create conversation for logged-in users
        const activeConversationId = await ensureConversation()

        // Add user message
        const userMessage = {
            id: `user-${Date.now()}`,
            role: MessageRole.USER,
            content,
            createdAt: new Date().toISOString()
        }

        // Add placeholder for assistant message with unique ID
        const currentAssistantId = `assistant-${Date.now()}`
        const assistantMessage = {
            id: currentAssistantId,
            role: MessageRole.ASSISTANT,
            content: '',
            createdAt: new Date().toISOString(),
            isStreaming: true
        }

        // Store the current streaming message ID for proper deal attachment
        currentStreamingIdRef.current = currentAssistantId

        setMessages(prev => [...prev, userMessage, assistantMessage])
        setState(ChatState.STREAMING)
        setError(null)
        // Don't clear deals/coupons - they should remain attached to their original message objects
        currentMessageRef.current = ''

        // Build history from previous messages (last 10, including deals context)
        const history = messages
            .filter(m => m.content && m.content.trim())
            .slice(-10)
            .map(m => ({
                role: m.role,
                content: m.content,
                // Include deals context for AI to reference in follow-ups
                deals: m.deals?.slice(0, 4).map(d => ({ id: d.id, title: d.title, price: d.price, store: d.merchant })) || []
            }))

        // Set up timeout handler
        const timeoutId = setTimeout(() => {
            if (streamCleanupRef.current) {
                streamCleanupRef.current()
            }
            setError('Request timed out. Please try again.')
            setState(ChatState.ERROR)
            // Update the assistant message to show timeout error
            setMessages(prev => {
                const updated = [...prev]
                const lastIndex = updated.length - 1
                if (updated[lastIndex]?.role === MessageRole.ASSISTANT && updated[lastIndex]?.isStreaming) {
                    updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: updated[lastIndex].content || 'Request timed out.',
                        isStreaming: false,
                        hasError: true
                    }
                }
                return updated
            })
        }, 30000) // 30 second timeout

        // Start SSE stream with history
        streamCleanupRef.current = api.aiChatStream(
            { message: content, history, conversationId: activeConversationId },
            (event) => {
                // Clear timeout on any successful event
                if (event.type !== 'error') {
                    clearTimeout(timeoutId)
                }

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
                        // Received deal cards - attach to the CURRENT streaming message by ID
                        setDeals(event.deals)
                        setMessages(prev => {
                            // Find the specific message by ID to attach deals
                            const targetId = currentStreamingIdRef.current
                            // Deep clone with map to ensure complete immutability
                            return prev.map(msg => {
                                if (msg.id === targetId && msg.role === MessageRole.ASSISTANT) {
                                    return { ...msg, deals: event.deals }
                                }
                                // Ensure we return a NEW object for React to detect changes
                                return { ...msg }
                            })
                        })
                        break

                    case 'coupons':
                        // Received coupon cards - attach to the CURRENT streaming message by ID
                        setCoupons(event.coupons)
                        setMessages(prev => {
                            const targetId = currentStreamingIdRef.current
                            return prev.map(msg => {
                                if (msg.id === targetId && msg.role === MessageRole.ASSISTANT) {
                                    return { ...msg, coupons: event.coupons }
                                }
                                return { ...msg }
                            })
                        })
                        break

                    case 'done':
                        // Stream complete
                        clearTimeout(timeoutId)
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
                        clearTimeout(timeoutId)
                        // Parse error type for better messaging
                        let errorMessage = event.error || 'Something went wrong'
                        let errorType = 'unknown'

                        if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
                            errorType = 'rate_limit'
                            errorMessage = 'Too many requests. Please wait a moment and try again.'
                        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
                            errorType = 'timeout'
                            errorMessage = 'Request timed out. Please try again.'
                        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                            errorType = 'network'
                            errorMessage = 'Network error. Please check your connection.'
                        } else if (errorMessage.includes('unavailable') || errorMessage.includes('disabled')) {
                            errorType = 'service_unavailable'
                            errorMessage = 'AI service is temporarily unavailable. Please try again later.'
                        }

                        setError(errorMessage)
                        setState(ChatState.ERROR)

                        // Update assistant message with error
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastIndex = updated.length - 1
                            if (updated[lastIndex]?.role === MessageRole.ASSISTANT) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    content: updated[lastIndex].content || errorMessage,
                                    isStreaming: false,
                                    hasError: true,
                                    errorType
                                }
                            }
                            return updated
                        })

                        if (onError) onError(new Error(errorMessage))
                        break
                }
            },
            (error) => {
                clearTimeout(timeoutId)
                // Categorize connection errors
                let errorMessage = 'Connection lost. Please try again.'
                let errorType = 'connection'

                if (error?.message?.includes('abort')) {
                    errorType = 'cancelled'
                    errorMessage = 'Request was cancelled.'
                } else if (error?.message?.includes('timeout')) {
                    errorType = 'timeout'
                    errorMessage = 'Connection timed out. Please try again.'
                }

                setError(errorMessage)
                setState(ChatState.ERROR)

                // Update assistant message
                setMessages(prev => {
                    const updated = [...prev]
                    const lastIndex = updated.length - 1
                    if (updated[lastIndex]?.role === MessageRole.ASSISTANT && updated[lastIndex]?.isStreaming) {
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: updated[lastIndex].content || errorMessage,
                            isStreaming: false,
                            hasError: true,
                            errorType
                        }
                    }
                    return updated
                })

                if (onError) onError(error)
            }
        )
    }, [messages, onError, ensureConversation])

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
        setConversationId,
        isAuthenticated
    }
}

export default useChat
