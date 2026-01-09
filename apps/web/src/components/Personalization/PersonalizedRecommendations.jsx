import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Star,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { FeedItemCard } from '../Homepage/FeedItemCard'
import { Skeleton } from '../ui/Skeleton'

/**
 * PersonalizedRecommendations - For You Feed
 * 
 * Uses smart backend algorithm (/api/for-you) to show personalized deals.
 * Works for BOTH guests and authenticated users.
 * Always shows minimum 12 deals (guaranteed by backend).
 */
const PersonalizedRecommendations = ({ limit = 24, showTitle = true, className = '' }) => {
  const { user } = useAuth()

  // Fetch from /api/for-you endpoint
  // Works for both guests and authenticated users
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['for-you-feed', limit],
    queryFn: () => api.getForYouFeed({ limit }),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false
  })

  const deals = data?.data || data?.items || []
  const meta = data?.meta || {}
  const isPersonalized = meta.personalized

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900">For You</h2>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error && deals.length === 0) {
    return (
      <div className={className}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 mb-4">Failed to load recommendations</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {showTitle && (
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">For You</h2>
              <p className="text-sm text-gray-500">
                {isPersonalized
                  ? `Personalized • ${meta.user_categories?.length || 0} interests tracked`
                  : 'Trending deals picked for you'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>
      )}

      {/* Personalization indicator for logged-in users */}
      {isPersonalized && meta.user_categories?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Star className="w-3 h-3" />
            Based on:
          </span>
          {meta.user_categories.slice(0, 4).map((cat, i) => (
            <span
              key={cat}
              className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Deals Grid */}
      {deals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id || deal.content_id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <FeedItemCard
                item={deal}
                index={index}
              />
              {/* Recommendation reason badge */}
              {deal.recommendation_reason && (
                <div className="mt-1 px-2 py-1 text-xs text-amber-600 bg-amber-50 rounded-lg inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {deal.recommendation_reason}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
          <p className="text-gray-600">
            Check back soon for personalized recommendations!
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Skeleton card for loading state
 */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-4">
      <div className="flex gap-4">
        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  )
}

export default PersonalizedRecommendations
