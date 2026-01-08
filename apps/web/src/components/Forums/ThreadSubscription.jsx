import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../Toast'
import { clsx } from 'clsx'

export function ThreadSubscription({ threadId, className = '' }) {
  const [showOptions, setShowOptions] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()
  const currentUserId = localStorage.getItem('demo_user') // Mock auth

  // Check subscription status
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['thread-subscription', threadId, currentUserId],
    queryFn: () => api.getThreadSubscription(threadId),
    enabled: !!currentUserId && !!threadId,
  })

  // Subscribe/unsubscribe mutations
  const subscribeMutation = useMutation({
    mutationFn: (options) => api.subscribeToThread(threadId, options),
    onSuccess: () => {
      toast.success('Successfully subscribed to thread!')
      queryClient.invalidateQueries(['thread-subscription', threadId, currentUserId])
      queryClient.invalidateQueries(['user-subscriptions', currentUserId])
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to subscribe to thread')
    }
  })

  const unsubscribeMutation = useMutation({
    mutationFn: () => api.unsubscribeFromThread(threadId),
    onSuccess: () => {
      toast.success('Unsubscribed from thread')
      queryClient.invalidateQueries(['thread-subscription', threadId, currentUserId])
      queryClient.invalidateQueries(['user-subscriptions', currentUserId])
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unsubscribe from thread')
    }
  })

  const updateSubscriptionMutation = useMutation({
    mutationFn: (options) => api.updateThreadSubscription(threadId, options),
    onSuccess: () => {
      toast.success('Subscription preferences updated')
      queryClient.invalidateQueries(['thread-subscription', threadId, currentUserId])
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update subscription')
    }
  })

  const handleSubscribe = (options = {}) => {
    subscribeMutation.mutate({
      notify_replies: true,
      notify_mentions: true,
      email_notifications: false,
      ...options
    })
    setShowOptions(false)
  }

  const handleUnsubscribe = () => {
    unsubscribeMutation.mutate()
    setShowOptions(false)
  }

  const handleUpdatePreferences = (updates) => {
    updateSubscriptionMutation.mutate(updates)
  }

  if (!currentUserId) return null

  const isSubscribed = !!subscription
  const isLoading_ = isLoading || subscribeMutation.isPending || unsubscribeMutation.isPending

  return (
    <div className={clsx('relative', className)}>
      {/* Main Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isLoading_}
        className={clsx(
          'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          isSubscribed
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200
            : 'bg-gray-50 text-gray-700 hover:bg-gray-200 border border-gray-200
          isLoading_ && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading_ ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isSubscribed ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 9l7 7 7-7-7-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
          </svg>
        )}

        <span>
          {isSubscribed ? 'Subscribed' : 'Subscribe'}
        </span>

        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Options Dropdown */}
      {showOptions && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowOptions(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Thread Notifications
                </h3>
                <p className="text-sm text-gray-600"
                  Choose how you want to be notified about this thread
                </p>
            </div>

            {isSubscribed ? (
                <div className="space-y-4">
                  {/* Notification Preferences */}
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={subscription.notify_replies}
                        onChange={(e) => handleUpdatePreferences({ notify_replies: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 replies</div>"
                        <div className="text-sm text-gray-600"
                          Get notified when someone posts a reply
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={subscription.notify_mentions}
                        onChange={(e) => handleUpdatePreferences({ notify_mentions: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 only</div>"
                        <div className="text-sm text-gray-600"
                          Only notify when someone mentions you
                        </div>
                      </div>
                    </label>

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={subscription.email_notifications}
              onChange={(e) => handleUpdatePreferences({ email_notifications: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 notifications</div>"
                        <div className="text-sm text-gray-600"
                Also send notifications via email
                        </div>
          </div>
        </label>

      <label className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={subscription.digest_frequency !== 'never'}
          onChange={(e) => handleUpdatePreferences({
            digest_frequency: e.target.checked ? 'daily' : 'never'
          })}
          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="font-medium text-gray-900 digest</div>"
                        <div className="text-sm text-gray-600"
            Include in weekly activity digest
                        </div>
    </div>
                    </label >
                  </div >

    {/* Subscription Info */ }
    < div className = "pt-3 border-t border-gray-200"
      < div className = "text-xs text-gray-500 mb-3" >
        Subscribed { subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'recently' }
                    </div >

    <button
      onClick={handleUnsubscribe}
      disabled={updateSubscriptionMutation.isPending}
      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    >
      Unsubscribe from thread
    </button>
                  </div >
                </div >
              ) : (
    <div className="space-y-3">
      {/* Quick Subscribe Options */}
      <button
        onClick={() => handleSubscribe({ notify_replies: true, notify_mentions: true })}
        disabled={subscribeMutation.isPending}
        className="w-full px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-left flex items-center justify-between"
      >
        <div>
          <div className="font-medium">Subscribe to all replies</div>
          <div className="text-sm text-blue-100">Get notified of every new reply</div>
        </div>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        onClick={() => handleSubscribe({ notify_replies: false, notify_mentions: true })}
        disabled={subscribeMutation.isPending}
        className="w-full px-4 py-3 bg-gray-50 text-gray-900 hover:bg-gray-200 rounded-lg transition-colors text-left flex items-center justify-between"
      >
        <div>
          <div className="font-medium">Mentions only</div>
          <div className="text-sm text-gray-600 when you're mentioned</div>"
                    </div>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="pt-2 text-xs text-gray-500"
        You can change notification preferences after subscribing
                  </div>
                </div >
              )
}
            </div >
          </div >
        </>
      )}
    </div >
  )
}

// Compact version for use in thread lists
export function ThreadSubscriptionCompact({ threadId, className = '' }) {
  const currentUserId = localStorage.getItem('demo_user')

  const { data: subscription } = useQuery({
    queryKey: ['thread-subscription', threadId, currentUserId],
    queryFn: () => api.getThreadSubscription(threadId),
    enabled: !!currentUserId && !!threadId,
  })

  if (!currentUserId || !subscription) return null

  return (
    <div className={clsx('flex items-center space-x-1 text-xs text-blue-600 className)}>
      < svg className = "w-3 h-3" fill = "currentColor" viewBox = "0 0 20 20" >
      <path d="M10 2L3 9l7 7 7-7-7-7z" />
      </svg >
      <span>Subscribed</span>
    </div >
  )
    }

      // Subscription management for multiple threads
      export function ThreadSubscriptionManager({ userId, className = '' }) {
    const [filter, setFilter] = useState('all') // all, active, muted

    const { data: subscriptions = [], isLoading } = useQuery({
      queryKey: ['user-subscriptions', userId],
      queryFn: () => api.getUserThreadSubscriptions(userId),
      enabled: !!userId,
    })

    const unsubscribeMutation = useMutation({
      mutationFn: (threadId) => api.unsubscribeFromThread(threadId),
      onSuccess: () => {
        queryClient.invalidateQueries(['user-subscriptions', userId])
      }
    })

    const filteredSubscriptions = subscriptions.filter(sub => {
      if (filter === 'active') return sub.notify_replies || sub.notify_mentions
      if (filter === 'muted') return !sub.notify_replies && !sub.notify_mentions
      return true
    })

    if (isLoading) {
      return (
        <div className={clsx('space-y-4', className)}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className={clsx('space-y-4', className)}>
        {/* Filter tabs */}
        <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All', count: subscriptions.length },
            { key: 'active', label: 'Active', count: subscriptions.filter(s => s.notify_replies || s.notify_mentions).length },
            { key: 'muted', label: 'Muted', count: subscriptions.filter(s => !s.notify_replies && !s.notify_mentions).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={clsx(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm
                  : 'text-gray-600 hover:text-gray-900
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Subscriptions list */}
        <div className="space-y-3">
          {filteredSubscriptions.length > 0 ? (
            filteredSubscriptions.map(subscription => (
              <div key={subscription.thread_id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {subscription.thread_title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500"
                    <span>{subscription.forum_name}</span>
                    <span>•</span>
                    <span>Subscribed {new Date(subscription.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Notification status */}
                  <div className="flex items-center space-x-3 mt-2">
                    {subscription.notify_replies && (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        All replies
                      </span>
                    )}
                    {subscription.notify_mentions && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        Mentions
                      </span>
                    )}
                    {subscription.email_notifications && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Email
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => unsubscribeMutation.mutate(subscription.thread_id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                  title="Unsubscribe"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
        ))
        ) : (
        <div className="text-center py-8 text-gray-500"
          {filter === 'all'
            ? "No thread subscriptions yet"
            : `No ${filter} subscriptions`}
          </div>
    )
  }
      </div >
    </div >
  )
}
