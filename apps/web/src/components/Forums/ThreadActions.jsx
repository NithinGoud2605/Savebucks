import React from 'react'
import { useToast } from '../Toast'

export function ThreadActions({ thread }) {
  const toast = useToast()

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: thread.title,
        url: url,
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard(url)
      })
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Link copied to clipboard!')
      }).catch(() => {
        toast.error('Failed to copy link')
      })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        toast.success('Link copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy link')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleSubscribe = () => {
    // Mock subscription - in real app would call API
    const isSubscribed = localStorage.getItem(`subscribed_${thread.id}`)
    if (isSubscribed) {
      localStorage.removeItem(`subscribed_${thread.id}`)
      toast.success('Unsubscribed from thread notifications')
    } else {
      localStorage.setItem(`subscribed_${thread.id}`, 'true')
      toast.success('Subscribed to thread notifications')
    }
  }

  const isSubscribed = localStorage.getItem(`subscribed_${thread.id}`)

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleShare}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
        aria-label="Share thread"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <span>Share</span>
      </button>

      <button
        onClick={handleSubscribe}
        className={`flex items-center space-x-1 text-sm focus-ring rounded ${
          isSubscribed
            ? 'text-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label={isSubscribed ? "Unsubscribe from thread" : "Subscribe to thread"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h2.586L9 9.586V7zM9 7V5a2 2 0 012-2h4a2 2 0 012 2v2M9 7l6 6" />
        </svg>
        <span>{isSubscribed ? 'Unsubscribe' : 'Subscribe'}</span>
      </button>
    </div>
  )
}
