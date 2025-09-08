import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { formatPrice, dateAgo, truncate } from '../lib/format'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  StarIcon,
  GiftIcon,
  TruckIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { CommentThread } from '../components/Comments/CommentThread'
import PriceAlert from '../components/PriceTracking/PriceAlert'
import StoreInfoPanel from '../components/Deal/StoreInfoPanel'

export default function CompactDealPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [userVote, setUserVote] = useState(null)
  const [showPriceAlert, setShowPriceAlert] = useState(false)

  // Fetch deal data
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.getDeal(id),
    enabled: !!id
  })

  // Fetch user's bookmark status
  const { data: bookmarkData } = useQuery({
    queryKey: ['bookmark', id],
    queryFn: () => api.getBookmark(id),
    enabled: !!id && !!user
  })

  // Fetch user's vote
  const { data: voteData } = useQuery({
    queryKey: ['vote', id],
    queryFn: () => api.getVote(id),
    enabled: !!id && !!user
  })

  useEffect(() => {
    if (bookmarkData) {
      setIsBookmarked(bookmarkData.isBookmarked)
    }
  }, [bookmarkData])

  useEffect(() => {
    if (voteData) {
      setUserVote(voteData.vote)
    }
  }, [voteData])

  // Mutations
  const bookmarkMutation = useMutation({
    mutationFn: (dealId) => api.toggleBookmark(dealId),
    onSuccess: () => {
      setIsBookmarked(!isBookmarked)
      queryClient.invalidateQueries(['bookmark', id])
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
    },
    onError: () => {
      toast.error('Failed to update bookmark')
    }
  })

  const voteMutation = useMutation({
    mutationFn: ({ dealId, vote }) => api.vote(dealId, vote),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal', id])
      queryClient.invalidateQueries(['vote', id])
    },
    onError: () => {
      toast.error('Failed to vote')
    }
  })

  // Handlers
  const handleBookmark = () => {
    if (!user) {
      toast.error('Please login to bookmark deals')
      return
    }
    bookmarkMutation.mutate(id)
  }

  const handleVote = (vote) => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }
    voteMutation.mutate({ dealId: id, vote })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: deal?.title,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  // Computed values
  const images = deal?.deal_images || (deal?.image_url ? [deal.image_url] : [])
  const discountBadge = deal?.discount_percentage ? `${deal.discount_percentage}% OFF` : null
  const timeRemaining = deal?.expires_at ? 'Ends Soon' : null
  const isExpired = deal?.expires_at && new Date(deal.expires_at) < new Date()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
          <p className="text-gray-600 mb-6">The deal you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-gray-900">Home</Link>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            {deal.categories && (
              <>
                <Link to={`/category/${deal.categories.slug}`} className="hover:text-gray-900">
                  {deal.categories.name}
                </Link>
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </>
            )}
            <span className="text-gray-900 font-medium">{truncate(deal.title, 50)}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Compact Images + Key Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image - More Compact */}
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              {discountBadge && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    {discountBadge}
                  </span>
                </div>
              )}
              
              {timeRemaining && !isExpired && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {timeRemaining}
                  </span>
                </div>
              )}

              {isExpired && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <span className="text-white text-xl font-bold">EXPIRED</span>
                </div>
              )}

              <div className="aspect-[4/3]">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImageIndex]}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <GiftIcon className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <button
                      onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                      disabled={selectedImageIndex === 0}
                      className="ml-2 p-1.5 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                      disabled={selectedImageIndex === images.length - 1}
                      className="mr-2 p-1.5 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Images - More Compact */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={clsx(
                      'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                      selectedImageIndex === index
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <img
                      src={image}
                      alt={`${deal.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Compact Deal Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="space-y-4">
                {/* Title and Merchant */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {deal.title}
                  </h1>
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingStorefrontIcon className="h-4 w-4 mr-1" />
                    {deal.merchant}
                  </div>
                </div>

                {/* Price Section - Compact */}
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(deal.price)}
                  </div>
                  {deal.original_price && deal.original_price > deal.price && (
                    <div className="text-lg text-gray-500 line-through">
                      {formatPrice(deal.original_price)}
                    </div>
                  )}
                  {deal.discount_amount && (
                    <div className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                      Save {formatPrice(deal.discount_amount)}
                    </div>
                  )}
                </div>

                {/* Coupon Code - Compact */}
                {deal.coupon_code && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-700">Coupon Code</div>
                        <div className="text-sm font-bold text-green-700">{deal.coupon_code}</div>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(deal.coupon_code)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {deal.views_count || 0} views
                  </div>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    {dateAgo(deal.created_at)}
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                    {deal.is_featured ? 'Featured' : 'Regular'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons & CTA */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={handleBookmark}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <BookmarkIcon className={`h-6 w-6 ${isBookmarked ? 'text-red-500 fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>

              {/* CTA Button */}
              <div className="space-y-3">
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'w-full inline-flex items-center justify-center px-6 py-4 text-lg font-semibold rounded-xl transition-all',
                    isExpired
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  )}
                  disabled={isExpired}
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                  {isExpired ? 'Deal Expired' : 'Get This Deal'}
                </a>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1 text-green-500" />
                    Verified Deal
                  </div>
                  <div className="flex items-center">
                    <TruckIcon className="h-4 w-4 mr-1 text-blue-500" />
                    Free Shipping
                  </div>
                  <div className="flex items-center">
                    <CreditCardIcon className="h-4 w-4 mr-1 text-purple-500" />
                    Secure Payment
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate this Deal</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote(1)}
                    className={clsx(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all',
                      userVote === 1
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-green-50 border border-gray-200'
                    )}
                  >
                    <HandThumbUpIcon className={`h-5 w-5 ${userVote === 1 ? 'text-green-700' : ''}`} />
                    <span>Helpful</span>
                    <span className="font-semibold">{deal.upvotes || 0}</span>
                  </button>

                  <button
                    onClick={() => handleVote(-1)}
                    className={clsx(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all',
                      userVote === -1
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-red-50 border border-gray-200'
                    )}
                  >
                    <HandThumbDownIcon className={`h-5 w-5 ${userVote === -1 ? 'text-red-700' : ''}`} />
                    <span>Not Helpful</span>
                    <span className="font-semibold">{deal.downvotes || 0}</span>
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {((deal.upvotes || 0) - (deal.downvotes || 0))}
                  </div>
                  <div className="text-sm text-gray-600">Net Score</div>
                </div>
              </div>
            </div>

            {/* Price Tracking & Alerts */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Price Tracking</h3>
                <button
                  onClick={() => setShowPriceAlert(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Set Alert
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Get notified when the price drops or when this deal is about to expire.
              </p>
            </div>

            {/* Store Information Panel */}
            <StoreInfoPanel company={deal.company} deal={deal} />

            {/* Description */}
            {deal.description && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 leading-relaxed">{deal.description}</p>
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
              <CommentThread dealId={deal.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Price Alert Modal */}
      <PriceAlert
        dealId={deal.id}
        currentPrice={deal.price}
        isOpen={showPriceAlert}
        onClose={() => setShowPriceAlert(false)}
      />
    </div>
  )
}
