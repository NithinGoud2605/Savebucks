import React, { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '../Toast'
import { formatDate, dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

// Mock WebSocket connection for real-time updates
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
      
      // Start sending mock updates
      this.startMockUpdates()
    }, 1000)
  }
  
  startMockUpdates() {
    // Send periodic updates for demo
    this.updateInterval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 5 seconds
        const updates = [
          {
            type: 'new_reply',
            thread_id: Math.floor(Math.random() * 100) + 1,
            thread_title: 'Sample Discussion Thread',
            author: `User${Math.floor(Math.random() * 1000)}`,
            content: 'Just posted a new reply to the thread',
            created_at: new Date().toISOString()
          },
          {
            type: 'thread_vote',
            thread_id: Math.floor(Math.random() * 100) + 1,
            vote_change: Math.random() > 0.5 ? 1 : -1
          },
          {
            type: 'user_typing',
            thread_id: Math.floor(Math.random() * 100) + 1,
            user: `User${Math.floor(Math.random() * 1000)}`,
            typing: true
          },
          {
            type: 'thread_updated',
            thread_id: Math.floor(Math.random() * 100) + 1,
            changes: ['title', 'tags']
          }
        ]
        
        const update = updates[Math.floor(Math.random() * updates.length)]
        this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(update) }))
      }
    }, 5000)
  }
  
  send(data) {
    console.log('WebSocket send:', data)
  }
  
  close() {
    this.readyState = WebSocket.CLOSED
    clearInterval(this.updateInterval)
    this.onclose?.(new CloseEvent('close'))
  }
}

export function RealTimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const wsRef = useRef(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    // Initialize WebSocket connection
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4001'
    wsRef.current = new MockWebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      setIsConnected(true)
      setConnectionStatus('connected')
      console.log('Real-time connection established')
    }
    
    wsRef.current.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        handleRealTimeUpdate(update)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    wsRef.current.onclose = () => {
      setIsConnected(false)
      setConnectionStatus('disconnected')
      console.log('Real-time connection closed')
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        setConnectionStatus('reconnecting')
        // In a real app, you'd reconnect here
      }, 3000)
    }
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('error')
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const handleRealTimeUpdate = (update) => {
    switch (update.type) {
      case 'new_reply':
        // Update thread reply count
        queryClient.setQueryData(['thread', update.thread_id], (old) => {
          if (old) {
            return {
              ...old,
              reply_count: (old.reply_count || 0) + 1,
              last_reply_at: update.created_at,
              last_reply_author: update.author
            }
          }
          return old
        })
        
        // Invalidate thread list to show updated timestamps
        queryClient.invalidateQueries(['threads'])
        
        // Show notification if user is subscribed
        if (update.notify_user) {
          toast.info(`New reply in "${update.thread_title}" by ${update.author}`)
        }
        break
        
      case 'thread_vote':
        // Update thread vote count
        queryClient.setQueryData(['thread', update.thread_id], (old) => {
          if (old) {
            return {
              ...old,
              votes: (old.votes || 0) + update.vote_change
            }
          }
          return old
        })
        break
        
      case 'thread_updated':
        // Invalidate and refetch thread data
        queryClient.invalidateQueries(['thread', update.thread_id])
        break
        
      case 'user_mention':
        // Show notification for mentions
        toast.info(`${update.author} mentioned you in "${update.thread_title}"`, {
          action: {
            label: 'View',
            onClick: () => window.open(`/forums/${update.forum_slug}/${update.thread_id}`, '_blank')
          }
        })
        break
        
      default:
        console.log('Unknown update type:', update.type)
    }
  }

  // Provide WebSocket instance to children
  return (
    <RealTimeContext.Provider value={{
      ws: wsRef.current,
      isConnected,
      connectionStatus,
      sendMessage: (message) => wsRef.current?.send(JSON.stringify(message))
    }}>
      {children}
    </RealTimeContext.Provider>
  )
}

const RealTimeContext = React.createContext()

export function useRealTime() {
  const context = React.useContext(RealTimeContext)
  if (!context) {
    throw new Error('useRealTime must be used within RealTimeProvider')
  }
  return context
}

// Connection status indicator
export function ConnectionStatus({ className = '' }) {
  const { isConnected, connectionStatus } = useRealTime()
  
  const statusConfig = {
    connecting: { color: 'text-yellow-500', icon: 'CONN', label: 'Connecting...' },
    connected: { color: 'text-green-500', icon: 'LIVE', label: 'Live' },
    disconnected: { color: 'text-red-500', icon: 'OFF', label: 'Disconnected' },
    reconnecting: { color: 'text-yellow-500', icon: 'RETRY', label: 'Reconnecting...' },
    error: { color: 'text-red-500', icon: 'ERR', label: 'Error' }
  }
  
  const status = statusConfig[connectionStatus] || statusConfig.disconnected
  
  return (
    <div className={clsx('flex items-center space-x-2 text-sm', status.color, className)}>
      <span className="text-xs">{status.icon}</span>
      <span className="font-medium">{status.label}</span>
    </div>
  )
}

// Live typing indicators
export function TypingIndicator({ threadId, className = '' }) {
  const [typingUsers, setTypingUsers] = useState([])
  const { ws, isConnected } = useRealTime()
  
  useEffect(() => {
    if (!isConnected || !ws) return
    
    const handleMessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        if (update.type === 'user_typing' && update.thread_id === threadId) {
          setTypingUsers(prev => {
            if (update.typing) {
              if (!prev.find(u => u.user === update.user)) {
                return [...prev, { user: update.user, timestamp: Date.now() }]
              }
            } else {
              return prev.filter(u => u.user !== update.user)
            }
            return prev
          })
          
          // Auto-remove typing indicators after 5 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => Date.now() - u.timestamp < 5000))
          }, 5000)
        }
      } catch (error) {
        console.error('Failed to parse typing message:', error)
      }
    }
    
    ws.addEventListener('message', handleMessage)
    return () => ws.removeEventListener('message', handleMessage)
  }, [ws, isConnected, threadId])
  
  if (typingUsers.length === 0) return null
  
  return (
    <div className={clsx('flex items-center space-x-2 text-sm text-gray-500 className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {typingUsers.length === 1 
          ? `${typingUsers[0].user} is typing...`
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  )
}

// Live activity feed
export function LiveActivityFeed({ forumSlug, limit = 10, className = '' }) {
  const [activities, setActivities] = useState([])
  const [isVisible, setIsVisible] = useState(true)
  const { ws, isConnected } = useRealTime()
  
  useEffect(() => {
    if (!isConnected || !ws) return
    
    const handleMessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        if (update.forum_slug === forumSlug || !forumSlug) {
          setActivities(prev => {
            const newActivity = {
              id: Date.now(),
              ...update,
              timestamp: new Date().toISOString()
            }
            return [newActivity, ...prev.slice(0, limit - 1)]
          })
        }
      } catch (error) {
        console.error('Failed to parse activity message:', error)
      }
    }
    
    ws.addEventListener('message', handleMessage)
    return () => ws.removeEventListener('message', handleMessage)
  }, [ws, isConnected, forumSlug, limit])
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="sr-only">Show live activity</span>
      </button>
    )
  }
  
  return (
    <div className={clsx('fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200"
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="font-semibold text-gray-900 Activity</h3>"
        </div>
        
        <div className="flex items-center space-x-2">
          <ConnectionStatus />
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Activity List */}
      <div className="max-h-64 overflow-y-auto">
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-200"
            {activities.map(activity => (
              <div key={activity.id} className="p-3 hover:bg-gray-50"
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <ActivityItem activity={activity} />
                    <div className="text-xs text-gray-500 mt-1">
                      {dateAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500"
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-sm">No live activity yet</div>
            <div className="text-xs">Activity will appear here in real-time</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityItem({ activity }) {
  switch (activity.type) {
    case 'new_reply':
      return (
        <div className="text-sm">
          <span className="font-medium text-gray-900"
          <span className="text-gray-600 replied to </span>"
          <span className="font-medium text-blue-600"
        </div>
      )
    case 'thread_vote':
      return (
        <div className="text-sm text-gray-600"
          Thread received {activity.vote_change > 0 ? 'an upvote' : 'a downvote'}
        </div>
      )
    case 'user_mention':
      return (
        <div className="text-sm">
          <span className="font-medium text-gray-900"
          <span className="text-gray-600 mentioned you in </span>"
          <span className="font-medium text-blue-600"
        </div>
      )
    default:
      return (
        <div className="text-sm text-gray-600"
          {activity.type.replace('_', ' ')}
        </div>
      )
  }
}

// Hook to send typing indicators
export function useTypingIndicator(threadId) {
  const { sendMessage } = useRealTime()
  const typingTimeoutRef = useRef(null)
  
  const sendTyping = (isTyping) => {
    if (sendMessage) {
      sendMessage({
        type: 'user_typing',
        thread_id: threadId,
        typing: isTyping
      })
    }
  }
  
  const startTyping = () => {
    sendTyping(true)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 3000)
  }
  
  const stopTyping = () => {
    sendTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])
  
  return { startTyping, stopTyping }
}
