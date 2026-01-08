import React, { useState, useEffect } from 'react'
import { useToast } from '../Toast'

export function BookmarkButton({ dealId, size = 'sm' }) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDeals') || '[]')
    setIsBookmarked(bookmarks.includes(dealId))
  }, [dealId])

  const handleToggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDeals') || '[]')

    if (isBookmarked) {
      const updated = bookmarks.filter(id => id !== dealId)
      localStorage.setItem('bookmarkedDeals', JSON.stringify(updated))
      setIsBookmarked(false)
      toast.success('Bookmark removed')
    } else {
      const updated = [...bookmarks, dealId]
      localStorage.setItem('bookmarkedDeals', JSON.stringify(updated))
      setIsBookmarked(true)
      toast.success('Deal bookmarked!')
    }
  }

  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  return (
    <button
      onClick={handleToggleBookmark}
      className={`p-1.5 rounded-full hover:bg-gray-50 transition-colors ${isBookmarked
        ? 'text-yellow-500'
        : 'text-gray-400 hover:text-yellow-500'
        }`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this deal'}
    >
      <svg className={iconSize} fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}
