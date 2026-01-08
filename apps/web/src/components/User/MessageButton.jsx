import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../Toast'
import { clsx } from 'clsx'

export function MessageButton({
  userId,
  userName,
  className = '',
  size = 'md',
  variant = 'default',
  disabled = false
}) {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')

  const toast = useToast()
  const queryClient = useQueryClient()
  const currentUserId = localStorage.getItem('demo_user') // Mock auth

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => api.sendMessage(messageData),
    onSuccess: () => {
      toast.success('Message sent successfully!')
      setShowModal(false)
      setMessage('')
      setSubject('')
      queryClient.invalidateQueries(['messages'])
      queryClient.invalidateQueries(['conversations'])
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message')
    }
  })

  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    sendMessageMutation.mutate({
      to: userId,
      subject: subject.trim() || 'New Message',
      content: message.trim()
    })
  }

  const handleOpenModal = () => {
    if (!currentUserId) {
      toast.error('Please log in to send messages')
      return
    }

    if (currentUserId === userId) {
      toast.error("You can't message yourself")
      return
    }

    setShowModal(true)
  }

  // Don't show button for own profile
  if (!currentUserId || currentUserId === userId) {
    return null
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50',
    secondary: 'bg-gray-50 text-gray-700 hover:bg-gray-200'
  }

  return (
    <>
      {/* Message Button */}
      <button
        onClick={handleOpenModal}
        disabled={disabled}
        className={clsx(
          'flex items-center justify-center space-x-2 font-medium rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses[size],
          variantClasses[variant],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Message</span>
      </button>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
              onClick={() => setShowModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Message to {userName}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-1 text-right text-xs text-gray-500">
                    {message.length}/1000
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMessage(prev => prev + " Thanks for the great deal!")}
                    className="px-3 py-1 text-xs bg-gray-50 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    + Thanks for deal
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage(prev => prev + " Is this deal still active?")}
                    className="px-3 py-1 text-xs bg-gray-50 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    + Ask about deal
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage(prev => prev + " Do you have any similar deals?")}
                    className="px-3 py-1 text-xs bg-gray-50 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    + Ask for similar
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !message.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Compact version
export function MessageButtonCompact({ userId, userName, className = '' }) {
  return (
    <MessageButton
      userId={userId}
      userName={userName}
      size="sm"
      variant="ghost"
      className={className}
    />
  )
}
