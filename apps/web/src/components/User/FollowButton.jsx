import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../Toast'
import { clsx } from 'clsx'

export function FollowButton({ 
  userId, 
  className = '', 
  size = 'md',
  variant = 'default',
  showFollowerCount = false,
  disabled = false 
}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const currentUserId = localStorage.getItem('user_handle')

  // Check if already following
  const { data: isFollowing = false, isLoading } = useQuery({
    queryKey: ['is-following', currentUserId, userId],
    queryFn: async () => {
      // Determine following by checking followers list for current user
      const followers = await api.getUserFollowers(userId)
      const handle = localStorage.getItem('user_handle')
      return Array.isArray(followers) && followers.some(f => f.profiles?.handle === handle)
    },
    enabled: !!currentUserId && !!userId,
  })

  // Get follower count
  const { data: followerData } = useQuery({
    queryKey: ['user-followers', userId],
    queryFn: () => api.getUserFollowers(userId),
    enabled: showFollowerCount && !!userId,
  })

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: () => api.toggleFollowUser(userId),
    onSuccess: () => {
      toast.success('Updated follow status')
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['is-following', currentUserId, userId] })
      queryClient.invalidateQueries({ queryKey: ['user-followers', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-following', currentUserId] })
      queryClient.invalidateQueries({ queryKey: ['user-activity', userId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update follow status')
    }
  })

  const handleClick = () => {
    if (!currentUserId) {
      toast.error('Please log in to follow users')
      return
    }
    
    followMutation.mutate()
  }

  // Don't show button for own profile
  if (!userId) {
    return null
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    default: isFollowing 
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
      : 'bg-blue-600 text-white hover:bg-blue-700',
    outline: isFollowing
      ? 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
      : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: isFollowing
      ? 'text-gray-700 hover:bg-gray-100'
      : 'text-blue-600 hover:bg-blue-50'
  }

  const buttonText = isFollowing ? 'Following' : 'Follow'
  const isProcessing = followMutation.isPending || isLoading

  return (
    <div className={clsx('flex items-center space-x-2', className)}>
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={clsx(
          'relative flex items-center justify-center space-x-2 font-medium rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses[size],
          variantClasses[variant],
          isProcessing && 'opacity-50 cursor-not-allowed',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Loading Spinner */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Button Content */}
        <div className={clsx('flex items-center space-x-2', isProcessing && 'invisible')}>
          {/* Follow Icon */}
          {isFollowing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          
          <span>{buttonText}</span>
        </div>
      </button>

      {/* Follower Count */}
      {showFollowerCount && followerData && (
        <span className="text-sm text-gray-500">
          {followerData.count} {followerData.count === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  )
}

// Compact version for use in lists
export function FollowButtonCompact({ userId, className = '' }) {
  return (
    <FollowButton 
      userId={userId}
      size="sm"
      variant="outline"
      className={className}
    />
  )
}

// Follow/Following indicator (non-interactive)
export function FollowStatus({ userId, className = '' }) {
  const currentUserId = localStorage.getItem('demo_user')
  
  const { data: isFollowing = false } = useQuery({
    queryKey: ['is-following', currentUserId, userId],
    queryFn: () => api.isFollowing(userId),
    enabled: !!currentUserId && !!userId && currentUserId !== userId,
  })

  if (!currentUserId || currentUserId === userId) {
    return null
  }

  return (
    <div className={clsx('flex items-center space-x-1 text-sm', className)}>
      {isFollowing ? (
        <>
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-green-600 font-medium">Following</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-gray-500">Not Following</span>
        </>
      )}
    </div>
  )
}
