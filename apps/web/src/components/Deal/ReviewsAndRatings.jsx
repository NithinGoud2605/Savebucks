import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../../lib/toast'
import { formatPrice, dateAgo } from '../../lib/format'
import {
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  UserCircleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarIconSolid,
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid'

// Star Rating Component
const StarRating = ({ rating, size = 'w-5 h-5', onRatingChange = null, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = readonly ? star <= rating : star <= (hoverRating || rating)
        const StarComponent = isFilled ? StarIconSolid : StarIcon

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onRatingChange?.(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`${size} ${readonly
              ? 'cursor-default'
              : 'cursor-pointer hover:scale-110 transition-transform'
              } ${isFilled ? 'text-yellow-400' : 'text-gray-300'
              }`}
          >
            <StarComponent />
          </button>
        )
      })}
    </div>
  )
}

// Review Item Component
const ReviewItem = ({ review, onVote }) => {
  const { user } = useAuth()
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (isHelpful) => {
    if (!user || isVoting) return

    setIsVoting(true)
    try {
      await onVote?.(review.id, isHelpful)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-10 h-10 text-gray-400" />
          )}
        </div>

        {/* Review Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">
              {review.user?.displayName || review.user?.username || 'Anonymous'}
            </span>
            {review.isVerifiedPurchase && (
              <CheckBadgeIcon className="w-4 h-4 text-blue-500" title="Verified Purchase" />
            )}
            {review.isFeatured && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Featured
              </span>
            )}
            <StarRating rating={review.rating} size="w-4 h-4" readonly />
            <span className="text-sm text-gray-500">
              {dateAgo(review.createdAt)}
            </span>
          </div>

          {review.title && (
            <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
          )}

          <p className="text-gray-700 mb-3">{review.content}</p>

          {/* Review Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote(true)}
              disabled={!user || isVoting}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 disabled:opacity-50 transition-colors"
            >
              <HandThumbUpIcon className="w-4 h-4" />
              <span>Helpful ({review.helpfulCount || 0})</span>
            </button>

            <button
              onClick={() => handleVote(false)}
              disabled={!user || isVoting}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              <HandThumbDownIcon className="w-4 h-4" />
              <span>Not helpful ({review.notHelpfulCount || 0})</span>
            </button>

            {isVoting && (
              <span className="text-sm text-gray-500">Voting...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Review Form Component
const ReviewForm = ({ dealId, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (content.trim().length < 10) {
      toast.error('Review must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        rating,
        title: title.trim(),
        content: content.trim()
      })

      // Reset form
      setRating(0)
      setTitle('')
      setContent('')
      toast.success('Review submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit review: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size="w-8 h-8"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Review Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Review *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell others about your experience with this deal..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={1000}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {content.length}/1000 characters
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// Main Reviews Component
export default function ReviewsAndRatings({ dealId }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, highest_rated, most_helpful

  // Ensure dealId is a string and handle edge cases
  const normalizedDealId = dealId ? String(dealId) : null

  // Don't render if no valid dealId
  if (!normalizedDealId || normalizedDealId === 'undefined' || normalizedDealId === 'null') {
    return null
  }

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['deal-reviews', normalizedDealId, sortBy],
    queryFn: () => api.getDealReviews(normalizedDealId, { sort: sortBy, limit: 20, page: 1 }),
    enabled: !!normalizedDealId && normalizedDealId !== 'undefined'
  })

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData) => api.submitDealReview(normalizedDealId, reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal-reviews', normalizedDealId])
      setShowReviewForm(false)
    }
  })

  // Vote on review mutation
  const voteReviewMutation = useMutation({
    mutationFn: ({ reviewId, isHelpful }) => api.voteOnReview(reviewId, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal-reviews', normalizedDealId])
      toast.success('Thank you for your feedback!')
    },
    onError: (error) => {
      console.error('Vote error:', error)
      toast.error(error.response?.data?.error || 'Failed to vote on review')
    }
  })

  const reviews = reviewsData?.reviews || []
  const stats = reviewsData?.stats || { average_rating: 0, total_reviews: 0, rating_distribution: {} }

  const handleVoteReview = (reviewId, isHelpful) => {
    if (!user) {
      toast.error('Please login to vote on reviews')
      return
    }
    voteReviewMutation.mutate({ reviewId, isHelpful })
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Community Reviews</h2>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Write Review
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.average_rating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(stats.average_rating)} readonly />
            <p className="text-sm text-gray-600 mt-2">
              Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.rating_distribution[`${stars}_star`] || 0
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0

              return (
                <div key={stars} className="flex items-center space-x-2 text-sm">
                  <span className="w-8">{stars}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-gray-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <ReviewForm
            dealId={normalizedDealId}
            onSubmit={(data) => submitReviewMutation.mutate(data)}
            onCancel={() => setShowReviewForm(false)}
          />
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Reviews ({stats.total_reviews})
            </h3>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="most_helpful">Most Helpful</option>
            </select>
          </div>

          {/* Reviews */}
          <div>
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onVote={handleVoteReview}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {reviews.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your experience with this deal!
          </p>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Write the First Review
            </button>
          )}
        </div>
      )}
    </div>
  )
}

