import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  SparklesIcon,
  ArrowPathIcon,
  EyeIcon,
  HeartIcon,
  BookmarkIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../../lib/toast'
import { formatPrice, dateAgo } from '../../lib/format'
import { getCompanyName } from '../../lib/companyUtils'
import ImageWithFallback from '../ui/ImageWithFallback'

const PersonalizedRecommendations = ({ limit = 6, showTitle = true, className = '' }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch personalized recommendations
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['user-recommendations', limit],
    queryFn: () => api.getUserRecommendations({ type: 'deal', limit }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })

  // Fetch fallback deals if no recommendations
  const { data: fallbackDeals } = useQuery({
    queryKey: ['fallback-deals', limit],
    queryFn: () => api.getDeals({ limit, sort_by: 'trending' }),
    enabled: !!user && (!recommendations || recommendations.length === 0),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000 // 5 minutes
  })

  // Generate new recommendations mutation
  const generateRecommendationsMutation = useMutation({
    mutationFn: api.generateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries(['user-recommendations'])
      setIsRefreshing(false)
      toast.success('Recommendations updated!')
    },
    onError: (error) => {
      setIsRefreshing(false)
      toast.error('Failed to generate recommendations')
    }
  })

  // Auto-generate recommendations if none exist
  useEffect(() => {
    if (user && !isLoading && (!recommendations || recommendations.length === 0) && !generateRecommendationsMutation.isPending) {
      generateRecommendationsMutation.mutate()
    }
  }, [user, isLoading, recommendations, generateRecommendationsMutation])

  // Track recommendation views
  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach(rec => {
        api.trackUserActivity({
          activity_type: 'recommendation_view',
          target_type: 'deal',
          target_id: rec.target_id,
          metadata: {
            recommendation_id: rec.id,
            score: rec.score,
            confidence: rec.confidence
          }
        }).catch(() => {}) // Silent fail
      })
    }
  }, [recommendations])

  const handleRefresh = () => {
    setIsRefreshing(true)
    generateRecommendationsMutation.mutate()
  }

  const handleDealClick = (dealId, recommendationId) => {
    api.trackUserActivity({
      activity_type: 'recommendation_click',
      target_type: 'deal',
      target_id: dealId,
      metadata: {
        recommendation_id: recommendationId
      }
    }).catch(() => {}) // Silent fail
  }

  if (!user) {
    return null // Don't show recommendations for non-logged-in users
  }

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-500" />
              Recommended for You
            </h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Determine what to display
  const displayData = recommendations && recommendations.length > 0 ? recommendations : fallbackDeals
  const isFallback = !recommendations || recommendations.length === 0

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-500" />
            {isFallback ? 'Just for You' : 'Recommended for You'}
          </h2>
          {!isFallback && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayData && displayData.length > 0 ? displayData.map((item, index) => {
          // Handle both recommendation objects and deal objects
          const isRecommendation = item.recommendation_type
          const deal = isRecommendation ? item.metadata : item
          const recId = isRecommendation ? item.id : `fallback-${item.id}`
          
          return (
          <div key={recId} className="group relative">
            {/* Recommendation Badge */}
            {isRecommendation && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  <SparklesIcon className="w-3 h-3" />
                  <span>Recommended</span>
                </div>
              </div>
            )}

            {/* Confidence Score */}
            {isRecommendation && (
              <div className="absolute top-3 right-3 z-10">
                <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs rounded-full">
                  <StarIcon className="w-3 h-3" />
                  <span>{(item.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            <Link
              to={`/deal/${deal.id}`}
              onClick={() => handleDealClick(deal.id, isRecommendation ? item.id : null)}
              className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:border-blue-300"
            >
              {/* Deal Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <ImageWithFallback
                  src={deal.featured_image || deal.image_url || deal.deal_images?.[0]}
                  alt={deal.title || 'Deal image'}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Deal Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {deal.title || `Deal ${deal.id}`}
                </h3>

                {/* Price */}
                {deal.price && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(deal.price)}
                    </span>
                    {deal.original_price && deal.original_price > deal.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(deal.original_price)}
                      </span>
                    )}
                  </div>
                )}

                {/* Discount */}
                {deal.discount_percentage && (
                  <div className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded mb-2">
                    {deal.discount_percentage}% OFF
                  </div>
                )}

                {/* Recommendation Reason */}
                {isRecommendation && item.reason && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.reason}
                  </p>
                )}

                {/* Deal Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    {deal.views_count && (
                      <div className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
                        <span>{deal.views_count}</span>
                      </div>
                    )}
                    {deal.upvotes && (
                      <div className="flex items-center gap-1">
                        <HeartIcon className="w-3 h-3" />
                        <span>{deal.upvotes}</span>
                      </div>
                    )}
                  </div>
                  {deal.created_at && (
                    <span>{dateAgo(deal.created_at)}</span>
                  )}
                </div>

                {/* Company Info */}
                {getCompanyName(deal) && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">from</span>
                      <span className="text-sm font-medium text-gray-700">
                        {getCompanyName(deal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </div>
          )
        }) : (
          <div className="col-span-full text-center py-12">
            <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading recommendations...</h3>
            <p className="text-gray-600">Finding the best deals for you!</p>
          </div>
        )}
      </div>

      {/* View All Recommendations Link */}
      <div className="mt-6 text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Recommendations
          <ArrowPathIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default PersonalizedRecommendations
