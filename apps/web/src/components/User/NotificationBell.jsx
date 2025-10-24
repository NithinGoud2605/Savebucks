import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiRequest } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../../lib/toast'
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

const NotificationBell = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/api/notifications?limit=10'),
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => apiRequest('/api/notifications/mark-read', { method: 'POST', body: { notification_ids: notificationIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast.success('Notification marked as read')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to mark notification as read')
    }
  })

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter(n => n.status === 'pending').length
    setUnreadCount(unread)
  }, [notifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate([notificationId])
  }

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications
      .filter(n => n.status === 'pending')
      .map(n => n.id)
    
    if (unreadIds.length > 0) {
      markAsReadMutation.mutate(unreadIds)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'push':
        return <BellIcon className="h-4 w-4 text-blue-500" />
      case 'email':
        return <ExclamationTriangleIcon className="h-4 w-4 text-green-500" />
      case 'in_app':
        return <EyeIcon className="h-4 w-4 text-purple-500" />
      default:
        return <BellIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationPriorityColor = (priority) => {
    switch (priority) {
      case 5:
        return 'border-l-red-500'
      case 4:
        return 'border-l-orange-500'
      case 3:
        return 'border-l-yellow-500'
      case 2:
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const formatNotificationTime = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInMinutes = Math.floor((now - created) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!user) return null

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-colors flex-shrink-0"
      >
        <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-red-500 text-white text-[9px] sm:text-[10px] rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  We'll notify you when there's something new
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={clsx(
                      'p-4 hover:bg-gray-50 transition-colors border-l-4',
                      getNotificationPriorityColor(notification.priority),
                      notification.status === 'pending' ? 'bg-blue-50' : ''
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {notification.status === 'pending' && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatNotificationTime(notification.created_at)}</span>
                          </div>
                          
                          {notification.action_url && (
                            <Link
                              to={notification.action_url}
                              onClick={() => setIsOpen(false)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View
                            </Link>
                          )}
                        </div>
                        
                        {/* Related Content */}
                        {(notification.deal || notification.coupon || notification.saved_search) && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            {notification.deal && (
                              <div className="text-gray-600">
                                <span className="font-medium">Deal:</span> {notification.deal.title}
                                {notification.deal.price && (
                                  <span className="text-green-600 ml-1">${notification.deal.price}</span>
                                )}
                              </div>
                            )}
                            {notification.coupon && (
                              <div className="text-gray-600">
                                <span className="font-medium">Coupon:</span> {notification.coupon.title}
                                {notification.coupon.code && (
                                  <span className="text-purple-600 ml-1">Code: {notification.coupon.code}</span>
                                )}
                              </div>
                            )}
                            {notification.saved_search && (
                              <div className="text-gray-600">
                                <span className="font-medium">Search:</span> {notification.saved_search.name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage notification preferences
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
