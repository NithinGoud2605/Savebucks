import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { formatPrice, dateAgo, truncate } from '../lib/format'
import SubmitterBadge from '../components/Deal/SubmitterBadge'
import {
  StarIcon,
  HeartIcon,
  ShareIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  BookmarkIcon,
  TagIcon,
  CreditCardIcon,
  GiftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid'
import { TagChips } from '../components/Deal/TagChips'
import ReviewsAndRatings from '../components/Deal/ReviewsAndRatings'
import StoreInfoPanel from '../components/Deal/StoreInfoPanel'
import ImageWithFallback from '../components/ui/ImageWithFallback'

// Enhanced Image Gallery Component
const ProductImageGallery = ({ images, title, onImageClick }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const validImages = Array.isArray(images) ? images.filter(Boolean) : []
  
  if (validImages.length === 0) {
    return (
      <div className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded"></div>
          <p className="text-sm">No image available</p>
        </div>
      </div>
    )
  }

  const currentImage = validImages[selectedIndex] || validImages[0]

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-white rounded-lg border overflow-hidden group">
        <div className="aspect-square relative">
          <ImageWithFallback
            src={currentImage}
            alt={title}
            className={`w-full h-full object-contain transition-transform duration-300 cursor-zoom-in ${
              isZoomed ? 'scale-150' : 'hover:scale-105'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
            fallbackClassName="w-full h-full"
          />
          
          {/* Zoom indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {validImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${
                selectedIndex === index ? 'border-primary-500' : 'border-gray-200'
              }`}
            >
              <ImageWithFallback
                src={image}
                alt={`${title} - view ${index + 1}`}
                className="w-full h-full object-cover"
                fallbackClassName="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Price Display Component
const PriceDisplay = ({ deal }) => {
  const hasDiscount = deal.original_price && deal.original_price > deal.price
  const discountPercentage = hasDiscount 
    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
    : deal.discount_percentage

  return (
    <div className="space-y-2">
      <div className="flex items-baseline space-x-3">
        <span className="text-3xl font-bold text-red-600">
          {formatPrice(deal.price)}
        </span>
        
        {hasDiscount && (
          <span className="text-lg text-gray-500 line-through">
            {formatPrice(deal.original_price)}
          </span>
        )}
        
        {discountPercentage > 0 && (
          <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
            -{discountPercentage}%
          </span>
        )}
      </div>
      
      {hasDiscount && (
        <p className="text-sm text-green-600 font-medium">
          You save {formatPrice(deal.original_price - deal.price)} ({discountPercentage}%)
        </p>
      )}
    </div>
  )
}

// Stock and Availability Component
const StockStatus = ({ deal }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'text-green-600'
      case 'low_stock': return 'text-yellow-600'
      case 'out_of_stock': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'in_stock': return 'In Stock'
      case 'low_stock': return 'Low Stock - Order Soon'
      case 'out_of_stock': return 'Currently Unavailable'
      default: return 'Stock Status Unknown'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        deal.stock_status === 'in_stock' ? 'bg-green-500' :
        deal.stock_status === 'low_stock' ? 'bg-yellow-500' :
        deal.stock_status === 'out_of_stock' ? 'bg-red-500' : 'bg-gray-500'
      }`}></div>
      <span className={`text-sm font-medium ${getStatusColor(deal.stock_status)}`}>
        {getStatusText(deal.stock_status)}
      </span>
      {deal.stock_quantity && (
        <span className="text-sm text-gray-500">
          ({deal.stock_quantity} remaining)
        </span>
      )}
    </div>
  )
}

// Trust Indicators Component
const TrustIndicators = () => (
  <div className="space-y-3 text-sm">
    <div className="flex items-center space-x-2 text-green-600">
      <ShieldCheckIcon className="w-4 h-4" />
      <span>Secure checkout</span>
    </div>
    <div className="flex items-center space-x-2 text-blue-600">
      <TruckIcon className="w-4 h-4" />
      <span>Fast & reliable delivery</span>
    </div>
    <div className="flex items-center space-x-2 text-purple-600">
      <ArrowPathIcon className="w-4 h-4" />
      <span>Easy returns</span>
    </div>
  </div>
)


// Main Deal Page Component
export default function ProfessionalDealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Fetch deal data with enhanced details
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal-professional', id],
    queryFn: () => api.getDeal(id),
    enabled: !!id
  })

  // Fetch related deals
  const { data: relatedDeals } = useQuery({
    queryKey: ['related-deals', deal?.category_id, id],
    queryFn: () => api.getRelatedDeals(deal.category_id, id),
    enabled: !!deal?.category_id
  })

  // Mutations
  const bookmarkMutation = useMutation({
    mutationFn: (dealId) => api.toggleBookmark(dealId),
    onSuccess: () => {
      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
    }
  })

  const voteMutation = useMutation({
    mutationFn: ({ dealId, vote }) => {
      const value = vote === 'up' ? 1 : vote === 'down' ? -1 : null
      return api.voteDeal(dealId, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deal-professional', id])
      toast.success('Vote recorded')
    },
    onError: (error) => {
      console.error('Vote error:', error)
      if (error.status === 401) {
        toast.error('Session expired. Please login again.')
      } else {
        toast.error('Failed to record vote. Please try again.')
      }
    }
  })

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
    
    // Check if we have a valid token before making the request
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Session expired. Please login again.')
      return
    }
    
    const currentVote = deal?.userVote
    const newVote = currentVote === vote ? null : vote
    voteMutation.mutate({ dealId: id, vote: newVote })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: `Check out this deal: ${deal.title}`,
          url: window.location.href
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-300 rounded-lg"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deal Not Found</h1>
          <p className="text-gray-600 mb-4">The deal you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Deals
          </button>
        </div>
      </div>
    )
  }

  // Prepare images array
  const images = [
    deal.featured_image,
    ...(Array.isArray(deal.deal_images) ? deal.deal_images : []),
    deal.image_url
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            {deal.categories && (
              <>
                <Link to={`/category/${deal.categories.slug}`} className="text-blue-600 hover:text-blue-800">
                  {deal.categories.name}
                </Link>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="text-gray-600 truncate">{truncate(deal.title, 50)}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Images */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ProductImageGallery 
                images={images} 
                title={deal.title}
              />
            </div>
          </div>

          {/* Middle Column - Main Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {deal.title}
              </h1>
              
              {/* Submitter Info */}
              <div className="mb-4">
                <SubmitterBadge 
                  submitter={deal.submitter} 
                  submitter_id={deal.submitter_id}
                  created_at={deal.created_at}
                  size="lg"
                  showDate={true}
                />
              </div>
              

              {/* Merchant */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <span>by</span>
                <Link 
                  to={`/company/${deal.companies?.slug || deal.merchant}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {deal.companies?.name || deal.merchant}
                </Link>
                {deal.companies?.is_verified && (
                  <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>

            {/* Price Section */}
            <div className="border rounded-lg p-4 bg-white">
              <PriceDisplay deal={deal} />
              
              {/* Stock Status */}
              <div className="mt-4">
                <StockStatus deal={deal} />
              </div>

              {/* Coupon Code */}
              {deal.coupon_code && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-800 font-medium">Use coupon code:</p>
                      <code className="text-lg font-mono font-bold text-green-900">
                        {deal.coupon_code}
                      </code>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(deal.coupon_code)
                        toast.success('Coupon code copied!')
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-center block transition-colors text-lg"
                onClick={() => {
                  // Track click
                  api.trackDealClick(deal.id).catch(() => {})
                }}
              >
                Get This Deal
              </a>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleBookmark}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-colors ${
                    isBookmarked 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isBookmarked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">Why shop with confidence</h3>
              <TrustIndicators />
            </div>

            {/* Description */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
              {deal.description ? (
                <div>
                  <p className={`text-gray-700 leading-relaxed ${
                    !showFullDescription && deal.description.length > 300 ? 'line-clamp-4' : ''
                  }`}>
                    {deal.description}
                  </p>
                  {deal.description.length > 300 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No description available</p>
              )}

              {/* Tags */}
              {deal.tags && deal.tags.length > 0 && (
                <div className="mt-4">
                  <TagChips
                    tags={deal.tags.map(t => `#${t.slug}`)}
                    onTagClick={(tag) => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                    className="flex-wrap"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Voting */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">Community Rating</h3>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVote('up')}
                    className={`p-2 rounded-lg border transition-colors ${
                      deal?.userVote === 1 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HandThumbUpIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleVote('down')}
                    className={`p-2 rounded-lg border transition-colors ${
                      deal?.userVote === -1 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HandThumbDownIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {(deal.upvotes || 0) - (deal.downvotes || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Net Score</div>
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="flex items-center justify-end space-x-3">
                      <span className="flex items-center">
                        <HandThumbUpIcon className="w-3 h-3 mr-1 text-green-600" />
                        {deal.upvotes || 0}
                      </span>
                      <span className="flex items-center">
                        <HandThumbDownIcon className="w-3 h-3 mr-1 text-red-600" />
                        {deal.downvotes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Information Panel */}
            <StoreInfoPanel company={deal.company} deal={deal} />

            {/* Deal Stats */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">Deal Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium">{deal.views_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clicks:</span>
                  <span className="font-medium">{deal.clicks_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium">{dateAgo(deal.created_at)}</span>
                </div>
                {deal.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium text-red-600">
                      {dateAgo(deal.expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Deals */}
            {relatedDeals && relatedDeals.length > 0 && (
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Related Deals</h3>
                <div className="space-y-3">
                  {relatedDeals.slice(0, 3).map((relatedDeal) => (
                    <Link
                      key={relatedDeal.id}
                      to={`/deal/${relatedDeal.id}`}
                      className="flex space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ImageWithFallback
                        src={relatedDeal.image_url || relatedDeal.featured_image}
                        alt={relatedDeal.title}
                        className="w-12 h-12 object-cover rounded"
                        fallbackClassName="w-12 h-12"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {relatedDeal.title}
                        </p>
                        <p className="text-sm text-red-600 font-bold">
                          {formatPrice(relatedDeal.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews and Ratings Section */}
        {deal?.id && (
          <div className="mt-12">
            <ReviewsAndRatings dealId={String(deal.id)} />
          </div>
        )}

      </div>
    </div>
  )
}
