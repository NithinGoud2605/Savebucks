import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { formatPrice, dateAgo, truncate } from '../lib/format'
import { setPageMeta } from '../lib/head'
import { toast } from '../lib/toast'
import { clsx } from 'clsx'
import PriceHistory from '../components/PriceTracking/PriceHistory'
import CountdownTimer from '../components/PriceTracking/CountdownTimer'
import { PriceAlertModal } from '../components/PriceTracking/PriceAlert'
import XPDisplay from '../components/Gamification/XPDisplay'
import {
  HeartIcon,
  ShareIcon,
  ClockIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  FireIcon,
  GiftIcon,
  TruckIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  HandThumbUpIcon as ThumbUpSolidIcon,
  HandThumbDownIcon as ThumbDownSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid'
import { RightSidebar } from '../components/Layout/RightSidebar'
import { CompactDealCard } from '../components/Deal/CompactDealCard'

const EnhancedDealPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [userVote, setUserVote] = useState(null)
  const [showPriceAlert, setShowPriceAlert] = useState(false)

  // Fetch deal data
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.getDeal(id),
    staleTime: 2 * 60 * 1000,
  })

  // Fetch similar deals
  const { data: similarDeals } = useQuery({
    queryKey: ['similar-deals', id],
    queryFn: () => api.getSimilarDeals(id, { limit: 4 }),
    enabled: !!deal,
  })

  // Fetch deal comments
  const { data: comments = [] } = useQuery({
    queryKey: ['deal-comments', id],
    queryFn: () => api.getDealComments(id),
  })

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ dealId, value }) => api.voteDeal(dealId, value),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal', id])
      toast.success('Vote recorded!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to vote')
    }
  })

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: (dealId) => api.bookmarkDeal(dealId),
    onSuccess: () => {
      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? 'Bookmark removed' : 'Deal bookmarked!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to bookmark deal')
    }
  })

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: ({ dealId, reason }) => api.reportDeal(dealId, reason),
    onSuccess: () => {
      toast.success('Deal reported. Thank you for your feedback.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to report deal')
    }
  })

  // Set page metadata
  useEffect(() => {
    if (deal) {
      setPageMeta({
        title: `${deal.title} - ${formatPrice(deal.price)} - SaveBucks`,
        description: deal.description || `Great deal on ${deal.title} at ${deal.merchant}`,
        image: deal.image_url || deal.deal_images?.[0],
        keywords: `${deal.title}, ${deal.merchant}, deals, savings, coupons${deal.deal_tags?.map(dt => `, ${dt.tags.name}`).join('') || ''}`
      })
    }
  }, [deal])

  const handleVote = (value) => {
    if (!user) {
      toast.error('Please sign in to vote')
      return
    }
    
    const newVote = userVote === value ? 0 : value
    setUserVote(newVote)
    voteMutation.mutate({ dealId: id, value: newVote })
  }

  const handleBookmark = () => {
    if (!user) {
      toast.error('Please sign in to bookmark deals')
      return
    }
    bookmarkMutation.mutate(id)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: deal.description,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleReport = (reason) => {
    if (!user) {
      toast.error('Please sign in to report deals')
      return
    }
    reportMutation.mutate({ dealId: id, reason })
  }

  const getDiscountBadge = () => {
    if (deal.discount_percentage) {
      return `${deal.discount_percentage}% OFF`
    }
    if (deal.discount_amount && deal.original_price) {
      const percentage = Math.round((deal.discount_amount / deal.original_price) * 100)
      return `${percentage}% OFF`
    }
    return null
  }

  const getTimeRemaining = () => {
    if (!deal.expires_at) return null
    
    const now = new Date()
    const expiry = new Date(deal.expires_at)
    const diff = expiry - now
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`
    return 'Ending soon'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deal Not Found</h1>
          <p className="text-gray-600 mb-6">This deal may have been removed or doesn't exist.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
        </div>
      </div>
    )
  }

  const images = deal.deal_images?.length > 0 ? deal.deal_images : [deal.image_url].filter(Boolean)
  const discountBadge = getDiscountBadge()
  const timeRemaining = getTimeRemaining()
  const isExpired = timeRemaining === 'Expired'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <Link to="/deals" className="text-gray-500 hover:text-gray-700">Deals</Link>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            {deal.categories && (
              <>
                <Link 
                  to={`/category/${deal.categories.slug}`} 
                  className="text-gray-500 hover:text-gray-700"
                >
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4 lg:col-span-2">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              {discountBadge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    {discountBadge}
                  </span>
                </div>
              )}
              
              {timeRemaining && !isExpired && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {timeRemaining}
                  </span>
                </div>
              )}

              {isExpired && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <span className="text-white text-2xl font-bold">EXPIRED</span>
                </div>
              )}

              <div className="aspect-square">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImageIndex]}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <GiftIcon className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Image Navigation */}
              {images.length > 1 && (
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <button
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                    className="ml-2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {images.length > 1 && (
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === images.length - 1}
                    className="mr-2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={clsx(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
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
          </div>

          {/* Right Column - Deal Info */}
          <div className="space-y-6">
            {/* Deal Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {deal.title}
                  </h1>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <BuildingStorefrontIcon className="h-4 w-4 mr-1" />
                      {deal.merchant}
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {deal.views_count || 0} views
                    </div>
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      {dateAgo(deal.created_at)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={handleBookmark}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {isBookmarked ? (
                      <BookmarkSolidIcon className="h-6 w-6 text-red-500" />
                    ) : (
                      <BookmarkIcon className="h-6 w-6" />
                    )}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <ShareIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Price Section */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(deal.price)}
                </div>
                {deal.original_price && deal.original_price > deal.price && (
                  <div className="text-lg text-gray-500 line-through">
                    {formatPrice(deal.original_price)}
                  </div>
                )}
                {deal.discount_amount && (
                  <div className="text-lg font-medium text-red-500">
                    Save {formatPrice(deal.discount_amount)}
                  </div>
                )}
              </div>

              {/* Coupon Code */}
              {deal.coupon_code && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-dashed border-green-300 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Coupon Code</div>
                      <div className="text-lg font-bold text-green-700">{deal.coupon_code}</div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(deal.coupon_code)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              )}

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
                    {userVote === 1 ? (
                      <ThumbUpSolidIcon className="h-5 w-5" />
                    ) : (
                      <HandThumbUpIcon className="h-5 w-5" />
                    )}
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
                    {userVote === -1 ? (
                      <ThumbDownSolidIcon className="h-5 w-5" />
                    ) : (
                      <HandThumbDownIcon className="h-5 w-5" />
                    )}
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
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Set Price Alert
                </button>
              </div>
              <PriceHistory dealId={id} compact={true} />
            </div>

            {/* Countdown Timer */}
            {deal.expires_at && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <CountdownTimer dealId={id} expirationDate={deal.expires_at} />
              </div>
            )}

            {/* Tags */}
            {deal.deal_tags && deal.deal_tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {deal.deal_tags.map((dealTag) => (
                    <Link
                      key={dealTag.tags.id}
                      to={`/deals?tags=${dealTag.tags.id}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: `${dealTag.tags.color}20`,
                        color: dealTag.tags.color,
                        border: `1px solid ${dealTag.tags.color}40`
                      }}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {dealTag.tags.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* User XP Display */}
            {user && deal.submitter_id && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Deal Contributor</h3>
                  <Link
                    to={`/profile/${deal.submitter_handle}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {deal.submitter_handle?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{deal.submitter_handle}</div>
                    <XPDisplay userId={deal.submitter_id} compact={true} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block">
          <RightSidebar />
        </div>

        {/* Description Section */}
        {deal.description && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Deal</h2>
            <div className="prose prose-gray max-w-none">
              <p className={clsx(
                'text-gray-700 leading-relaxed',
                !showFullDescription && deal.description.length > 500 && 'line-clamp-4'
              )}>
                {deal.description}
              </p>
              {deal.description.length > 500 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Similar Deals */}
        {similarDeals && similarDeals.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Deals</h2>
            <div className="space-y-3">
              {similarDeals.map((similarDeal) => (
                <CompactDealCard key={similarDeal.id} deal={similarDeal} />
              ))}
            </div>
          </div>
        )}

        {/* Price Alert Modal */}
        <PriceAlertModal
          dealId={id}
          currentPrice={deal?.price}
          isOpen={showPriceAlert}
          onClose={() => setShowPriceAlert(false)}
        />
      </div>
    </div>
  )
}

export default EnhancedDealPage
