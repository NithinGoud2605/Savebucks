import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../Toast'
import { clsx } from 'clsx'

export function VoteButton({ dealId, votes = 0, userVote, className }) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const voteMutation = useMutation({
    mutationFn: ({ value }) => api.voteDeal(dealId, value),
    onMutate: async ({ value }) => {
      // Optimistic update
      const queryKey = ['deal', dealId]
      await queryClient.cancelQueries({ queryKey })
      
      const previousData = queryClient.getQueryData(queryKey)
      if (previousData) {
        queryClient.setQueryData(queryKey, (old) => ({
          ...old,
          ups: old.ups + (value === 1 ? 1 : 0) - (userVote === 1 ? 1 : 0),
          downs: old.downs + (value === -1 ? 1 : 0) - (userVote === -1 ? 1 : 0),
        }))
      }
      
      return { previousData }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['deal', dealId], context.previousData)
      }
      toast.error('Failed to vote. Please try again.')
    },
    onSuccess: () => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })

  const handleVote = (value) => {
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to vote')
      return
    }
    
    // Toggle vote if same value, otherwise set new value
    const newValue = userVote === value ? 0 : value
    voteMutation.mutate({ value: newValue })
  }

  const score = votes || 0

  return (
    <div className={clsx('flex items-center', className)}>
      <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 border border-gray-200">
        <button
          onClick={() => handleVote(1)}
          disabled={voteMutation.isPending}
          className={clsx(
            'p-1 rounded transition-colors focus-ring',
            userVote === 1
              ? 'text-green-600'
              : 'text-gray-400 hover:text-green-600',
            voteMutation.isPending && 'opacity-50'
          )}
          aria-label="Upvote"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <span className={clsx(
          'text-sm font-medium py-1 min-w-[2rem] text-center',
          score > 0 ? 'text-green-600' : 
          score < 0 ? 'text-red-600' : 
          'text-gray-600'
        )}>
          {score > 0 ? `+${score}` : score}
        </span>
        
        <button
          onClick={() => handleVote(-1)}
          disabled={voteMutation.isPending}
          className={clsx(
            'p-1 rounded transition-colors focus-ring',
            userVote === -1
              ? 'text-red-600'
              : 'text-gray-400 hover:text-red-600',
            voteMutation.isPending && 'opacity-50'
          )}
          aria-label="Downvote"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
