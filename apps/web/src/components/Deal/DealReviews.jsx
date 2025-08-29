import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../Toast'
import { api } from '../../lib/api'
import { dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export function DealReviews({ dealId, reviews = [], userRating, onRate }) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    verified: false,
    anonymous: false
  })
  const [sortBy, setSortBy] = useState('newest')
  const [filterBy, setFilterBy] = useState('all')
  
  const queryClient = useQueryClient()
  const toast = useToast()
  
  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData) => api.submitDealReview(dealId, reviewData),
    onSuccess: () => {
      toast.success('Review submitted successfully!')
      queryClient.invalidateQueries(['deal', dealId])
      setShowReviewForm(false)
      setNewReview({
        rating: 5,
        title: '',
        comment: '',
        verified: false,
        anonymous: false
      })
    },
    onError: () => toast.error('Failed to submit review')
  })
  
  // Vote on review mutation
  const voteReviewMutation = useMutation({
    mutationFn: ({ reviewId, helpful }) => api.voteOnReview(reviewId, helpful),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal', dealId])
    },
    onError: () => toast.error('Failed to vote on review')
  })
  
  // Calculate review statistics
  const reviewStats = React.useMemo(() => {
    if (!reviews.length) return null
    
    const totalRatings = reviews.length
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const count = reviews.filter(r => r.rating === rating).length
      return { rating, count, percentage: (count / totalRatings) * 100 }
    }).reverse() // 5-star first
    
    return {
      totalRatings,
      averageRating,
      ratingDistribution
    }
  }, [reviews])
  
  // Filter and sort reviews
  const filteredReviews = React.useMemo(() => {
    let filtered = reviews
    
    // Apply filters
    switch (filterBy) {
      case 'verified':
        filtered = filtered.filter(r => r.verified)
        break
      case '5_star':
      case '4_star':
      case '3_star':
      case '2_star':
      case '1_star':
        const targetRating = parseInt(filterBy.charAt(0))
        filtered = filtered.filter(r => r.rating === targetRating)
        break
      case 'with_photos':
        filtered = filtered.filter(r => r.photos && r.photos.length > 0)
        break
      default:
        break
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
      case 'rating_high':
        return filtered.sort((a, b) => b.rating - a.rating)
      case 'rating_low':
        return filtered.sort((a, b) => a.rating - b.rating)
      case 'helpful':
        return filtered.sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0))
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  }, [reviews, sortBy, filterBy])
  
  const StarRating = ({ rating, size = 'sm', interactive = false, onChange }) => {
    const starSize = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange && onChange(star)}
            className={clsx(
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default',
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            )}
            disabled={!interactive}
          >
            <svg className={starSize} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    )
  }
  
  const handleSubmitReview = () => {
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to submit a review')
      return
    }
    
    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast.error('Please provide both a title and comment')
      return
    }
    
    submitReviewMutation.mutate({
      ...newReview,
      author: newReview.anonymous ? 'Anonymous' : user
    })
  }
  
  const handleVoteReview = (reviewId, helpful) => {
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to vote on reviews')
      return
    }
    
    voteReviewMutation.mutate({ reviewId, helpful })
  }
  
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating_high', label: 'Highest Rating' },
    { value: 'rating_low', label: 'Lowest Rating' },
    { value: 'helpful', label: 'Most Helpful' },
  ]
  
  const filterOptions = [
    { value: 'all', label: 'All Reviews' },
    { value: '5_star', label: '5 Stars' },
    { value: '4_star', label: '4 Stars' },
    { value: '3_star', label: '3 Stars' },
    { value: '2_star', label: '2 Stars' },
    { value: '1_star', label: '1 Star' },
    { value: 'verified', label: 'Verified Only' },
    { value: 'with_photos', label: 'With Photos' },
  ]
  
  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {reviewStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
              <div className="mb-4 lg:mb-0">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(reviewStats.averageRating)} size="lg" />
                <div className="text-sm text-gray-600 mt-2">
                  Based on {reviewStats.totalRatings} {reviewStats.totalRatings === 1 ? 'review' : 'reviews'}
                </div>
              </div>
              
              {/* Rating Distribution */}
              <div className="flex-1">
                <div className="space-y-2">
                  {reviewStats.ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 w-6">
                        {rating}★
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Write Review Button */}
          <div className="flex flex-col justify-center">
            {!showReviewForm ? (
              <div className="text-center lg:text-right">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Share Your Experience
                </h3>
                <p className="text-gray-600 mb-4">
                  Help others by reviewing this deal
                </p>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn-primary"
                >
                  Write a Review
                </button>
              </div>
            ) : (
              <div className="text-center lg:text-right text-sm text-gray-600">
                Review form below
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Write Review Form */}
      {showReviewForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Write a Review
            </h3>
            <button
              onClick={() => setShowReviewForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Rating *
              </label>
              <StarRating 
                rating={newReview.rating} 
                size="lg" 
                interactive 
                onChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
              />
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="input w-full"
                placeholder="Summarize your experience"
                maxLength={100}
              />
              <div className="text-xs text-gray-500 mt-1">
                {newReview.title.length}/100 characters
              </div>
            </div>
            
            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Review Details *
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                className="textarea w-full"
                rows={4}
                placeholder="Share your detailed experience with this deal..."
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {newReview.comment.length}/1000 characters
              </div>
            </div>
            
            {/* Options */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newReview.verified}
                  onChange={(e) => setNewReview(prev => ({ ...prev, verified: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  I purchased this deal
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newReview.anonymous}
                  onChange={(e) => setNewReview(prev => ({ ...prev, anonymous: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Post anonymously
                </span>
              </label>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowReviewForm(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitReviewMutation.isPending || !newReview.title.trim() || !newReview.comment.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Filter:
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
          </div>
          
          {/* Reviews */}
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="card p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {review.author}
                        </span>
                        {review.verified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <StarRating rating={review.rating} />
                                                  <span className="text-sm text-gray-600">
                            {dateAgo(review.date)}
                          </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Options */}
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Review Content */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {review.title}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
                
                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="mb-4">
                    <div className="flex space-x-2 overflow-x-auto">
                      {review.photos.map((photo, index) => (
                        <div key={index} className="flex-shrink-0">
                          <img
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Review Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleVoteReview(review.id, true)}
                      disabled={voteReviewMutation.isPending}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>Helpful ({review.helpfulVotes || 0})</span>
                    </button>
                    
                    <button
                      onClick={() => handleVoteReview(review.id, false)}
                      disabled={voteReviewMutation.isPending}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4H19a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      <span>Not Helpful ({review.unhelpfulVotes || 0})</span>
                    </button>
                  </div>
                  
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Report Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your experience with this deal!
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="btn-primary"
          >
            Write the First Review
          </button>
        </div>
      )}
    </div>
  )
}
