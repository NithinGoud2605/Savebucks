import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { ChevronUpIcon as ChevronUpSolid, ChevronDownIcon as ChevronDownSolid } from '@heroicons/react/24/solid'

const VoteButtons = ({ 
  entityType, // 'deal' or 'coupon'
  entityId, 
  votes = { ups: 0, downs: 0, score: 0 },
  userVote = 0, // -1, 0, or 1
  size = 'md',
  orientation = 'vertical', // 'vertical' or 'horizontal'
  showCount = true,
  className = ''
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentVote, setCurrentVote] = useState(userVote)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ value }) => {
      if (entityType === 'deal') {
        return api.voteDeal(entityId, value)
      } else if (entityType === 'coupon') {
        return api.voteCoupon(entityId, value)
      }
      throw new Error('Invalid entity type')
    },
    onSuccess: (data, variables) => {
      setCurrentVote(variables.value)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      queryClient.invalidateQueries({ queryKey: ['deal', entityId] })
      queryClient.invalidateQueries({ queryKey: ['coupon', entityId] })
    },
    onError: (error) => {
      console.error('Vote error:', error)
      // Could show a toast notification here
    }
  })

  const handleVote = (value) => {
    if (!user) {
      // Redirect to login or show login modal
      window.location.href = '/signin'
      return
    }

    // If clicking the same vote, remove it (set to 0)
    const newValue = currentVote === value ? 0 : value
    voteMutation.mutate({ value: newValue })
  }

  // Calculate display scores
  const displayScore = votes.score + (currentVote - userVote)
  const displayUps = votes.ups + Math.max(0, currentVote - Math.max(0, userVote))
  const displayDowns = votes.downs + Math.max(0, -currentVote + Math.max(0, -userVote))

  const containerClass = orientation === 'horizontal' 
    ? 'flex items-center space-x-2' 
    : 'flex flex-col items-center space-y-1'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote(1)}
        disabled={voteMutation.isLoading}
        className={`
          ${sizeClasses[size]} flex items-center justify-center rounded-md transition-all
          ${currentVote === 1
            ? 'text-green-600 bg-green-50 hover:bg-green-100'
            : 'text-secondary-500 hover:text-green-600 hover:bg-green-50'
          }
          ${voteMutation.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={user ? 'Upvote' : 'Sign in to vote'}
      >
        {currentVote === 1 ? (
          <ChevronUpSolid className="w-full h-full" />
        ) : (
          <ChevronUpIcon className="w-full h-full" />
        )}
      </button>

      {/* Vote Count */}
      {showCount && (
        <div className={`
          ${textSizeClasses[size]} font-semibold text-center min-w-0
          ${displayScore > 0 ? 'text-green-600' : displayScore < 0 ? 'text-red-600' : 'text-secondary-600'}
        `}>
          {displayScore > 0 ? '+' : ''}{displayScore}
        </div>
      )}

      {/* Downvote Button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isLoading}
        className={`
          ${sizeClasses[size]} flex items-center justify-center rounded-md transition-all
          ${currentVote === -1
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-secondary-500 hover:text-red-600 hover:bg-red-50'
          }
          ${voteMutation.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={user ? 'Downvote' : 'Sign in to vote'}
      >
        {currentVote === -1 ? (
          <ChevronDownSolid className="w-full h-full" />
        ) : (
          <ChevronDownIcon className="w-full h-full" />
        )}
      </button>

      {/* Detailed Vote Breakdown (optional) */}
      {orientation === 'horizontal' && showCount && (
        <div className="flex items-center space-x-3 text-xs text-secondary-500">
          <span className="flex items-center space-x-1">
            <ChevronUpIcon className="w-3 h-3" />
            <span>{displayUps}</span>
          </span>
          <span className="flex items-center space-x-1">
            <ChevronDownIcon className="w-3 h-3" />
            <span>{displayDowns}</span>
          </span>
        </div>
      )}
    </div>
  )
}

export default VoteButtons
