import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatDate, dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export function StoreRating({ merchant, rating = null }) {
  const [showDetails, setShowDetails] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  
  // Fetch comprehensive store data
  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store-rating', merchant],
    queryFn: () => api.getStoreRating(merchant),
    enabled: !!merchant,
  })
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }
  
  // Use provided rating or fetch from store data
  const storeRating = storeData?.rating || rating || 0
  const reviewCount = storeData?.reviewCount || 0
  const trustScore = storeData?.trustScore || calculateTrustScore(storeData)
  const dealCount = storeData?.dealCount || 0
  const avgDelivery = storeData?.avgDeliveryDays || null
  const returnPolicy = storeData?.returnPolicy || null
  const certifications = storeData?.certifications || []
  const recentReviews = storeData?.recentReviews || []
  
  function calculateTrustScore(data) {
    if (!data) return 75 // Default trust score
    
    let score = 50 // Base score
    
    if (data.rating >= 4.5) score += 25
    else if (data.rating >= 4.0) score += 20
    else if (data.rating >= 3.5) score += 15
    else if (data.rating >= 3.0) score += 10
    
    if (data.reviewCount >= 1000) score += 10
    else if (data.reviewCount >= 100) score += 5
    
    if (data.dealCount >= 50) score += 5
    if (data.avgDeliveryDays <= 3) score += 5
    if (data.returnPolicy === 'flexible') score += 5
    if (data.certifications?.length > 0) score += 10
    
    return Math.min(100, Math.max(0, score))
  }
  
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.0) return 'text-yellow-600'
    if (rating >= 2.0) return 'text-orange-600'
    return 'text-red-600'
  }
  
  const getTrustLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600' }
    if (score >= 80) return { level: 'Very Good', color: 'text-blue-600' }
    if (score >= 70) return { level: 'Good', color: 'text-yellow-600' }
    if (score >= 60) return { level: 'Fair', color: 'text-orange-600' }
    return { level: 'Poor', color: 'text-red-600' }
  }
  
  const trustLevel = getTrustLevel(trustScore)
  
  const StarRating = ({ rating, size = 'sm' }) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className={`${starSize} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className={`${starSize} relative`}>
            <svg className={`${starSize} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <svg className={`${starSize} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        )
      } else {
        stars.push(
          <svg key={i} className={`${starSize} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      }
    }
    
    return <div className="flex items-center">{stars}</div>
  }
  
  return (
    <div className="space-y-4">
      {/* Store Rating Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {merchant}
            </h3>
            <div className="flex items-center space-x-2">
              <StarRating rating={storeRating} />
              <span className={clsx('font-medium text-lg', getRatingColor(storeRating))}>
                {storeRating.toFixed(1)}
              </span>
              {reviewCount > 0 && (
                <span className="text-gray-600 text-sm">
                  ({reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          </div>
          
          {/* Trust Score */}
          <div className="text-right">
            <div className="text-sm text-gray-600">Trust Score</div>
            <div className={clsx('text-xl font-bold', trustLevel.color)}>
              {trustScore}/100
            </div>
            <div className={clsx('text-sm font-medium', trustLevel.color)}>
              {trustLevel.level}
            </div>
          </div>
        </div>
        
        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn-ghost text-sm flex items-center space-x-1"
        >
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          <svg 
            className={clsx('w-4 h-4 transform transition-transform', showDetails && 'rotate-180')}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Detailed Store Information */}
      {showDetails && (
        <div className="card p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dealCount}
              </div>
              <div className="text-sm text-gray-600">Deals Posted</div>
            </div>
            
            {avgDelivery && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {avgDelivery}
                </div>
                <div className="text-sm text-gray-600">Avg Delivery (days)</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {reviewCount >= 1000 ? `${(reviewCount/1000).toFixed(1)}k` : reviewCount}
              </div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
            
            <div className="text-center">
              <div className={clsx('text-2xl font-bold', trustLevel.color)}>
                {trustScore}%
              </div>
              <div className="text-sm text-gray-600">Trust Score</div>
            </div>
          </div>
          
          {/* Store Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policies & Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Store Information</h4>
              <dl className="space-y-2 text-sm">
                {returnPolicy && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Return Policy</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {returnPolicy}
                    </dd>
                  </div>
                )}
                
                {avgDelivery && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Shipping</dt>
                    <dd className="font-medium text-gray-900">
                      {avgDelivery} days
                    </dd>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <dt className="text-gray-600">Success Rate</dt>
                  <dd className="font-medium text-green-600">
                    {Math.min(95, 60 + (storeRating * 8))}%
                  </dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-gray-600">Member Since</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDate(storeData?.memberSince || '2020-01-01')}
                  </dd>
                </div>
              </dl>
            </div>
            
            {/* Certifications & Trust Indicators */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Trust Indicators</h4>
              <div className="space-y-3">
                {certifications.length > 0 ? (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Certifications</div>
                    <div className="flex flex-wrap gap-2">
                      {certifications.map((cert) => (
                        <span key={cert} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No certifications available
                  </div>
                )}
                
                {/* Trust Score Breakdown */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Trust Score Breakdown</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Customer Rating</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(storeRating / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-right">{Math.round((storeRating / 5) * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span>Review Volume</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, (reviewCount / 1000) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-right">{Math.min(100, Math.round((reviewCount / 1000) * 100))}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span>Deal History</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (dealCount / 50) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-right">{Math.min(100, Math.round((dealCount / 50) * 100))}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Reviews */}
          {recentReviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Recent Reviews</h4>
                <button
                  onClick={() => setShowReviews(!showReviews)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showReviews ? 'Hide' : 'Show'} Reviews
                </button>
              </div>
              
              {showReviews && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentReviews.slice(0, 5).map((review, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-gray-600">
                          {dateAgo(review.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        "{review.comment}"
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        - {review.author}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Warning if low rating */}
          {storeRating < 3.0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-red-800 mb-1">
                    Low Store Rating
                  </h4>
                  <p className="text-red-700 text-sm">
                    This merchant has a low customer rating. Please exercise caution and read recent reviews before making a purchase.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
