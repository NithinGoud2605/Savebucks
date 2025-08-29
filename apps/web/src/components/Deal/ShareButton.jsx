import React from 'react'
import { useToast } from '../Toast'

export function ShareButton({ deal, size = 'sm' }) {
  const toast = useToast()

  const handleShare = async () => {
    const shareData = {
      title: deal.title,
      text: `Check out this deal: ${deal.title} - ${deal.price ? `$${deal.price}` : 'Free'} at ${deal.merchant}`,
      url: `${window.location.origin}/deal/${deal.id}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        toast.success('Shared successfully!')
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareData.url)
        }
      }
    } else {
      copyToClipboard(shareData.url)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        toast.success('Link copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy link')
      }
      textArea.remove()
    }
  }

  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  return (
    <button
      onClick={handleShare}
      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
      title="Share this deal"
    >
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    </button>
  )
}
