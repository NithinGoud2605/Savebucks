import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { formatPrice, dateAgo, truncate } from '../lib/format'
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
      <div className="bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 rounded-xl border border-gray-200 p-8 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-sm font-medium">No image available</p>
        </div>
      </div>
    )
  }

  const currentImage = validImages[selectedIndex] || validImages[0]

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 rounded-xl border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="aspect-square relative p-4">
          <div className="w-full h-full bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center">
            <ImageWithFallback
              src={currentImage}
              alt={title}
              className={`w-full h-full object-contain transition-transform duration-300 cursor-zoom-in ${
                isZoomed ? 'scale-150' : 'hover:scale-105'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
              fallbackClassName="w-full h-full"
            />
          </div>
          
          {/* Zoom indicator */}
          <div className="absolute top-6 right-6 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
              className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-white p-1 ${
                selectedIndex === index ? 'border-mint-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ImageWithFallback
                src={image}
                alt={`${title} - view ${index + 1}`}
                className="w-full h-full object-contain"
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
    <div className="space-y-3">
      <div className="flex items-baseline space-x-3 flex-wrap">
        <span className={`font-bold text-mint-700 ${
          deal.price > 1000 
            ? 'text-2xl lg:text-3xl' 
            : 'text-3xl lg:text-4xl'
        }`}>
          {formatPrice(deal.price)}
        </span>
        
        {hasDiscount && (
          <span className="text-lg text-gray-500 line-through">
            {formatPrice(deal.original_price)}
          </span>
        )}
        
        {discountPercentage > 0 && (
          <span className={`text-white px-3 py-1 rounded-full font-bold ${
            discountPercentage >= 50 
              ? 'bg-gradient-to-r from-red-500 to-pink-600' 
              : discountPercentage >= 30
              ? 'bg-gradient-to-r from-orange-500 to-red-500'
              : 'bg-gradient-to-r from-mint-500 to-emerald-600'
          }`}>
            -{discountPercentage}% OFF
          </span>
        )}
      </div>
      
      {hasDiscount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800 font-medium">
            You save {formatPrice(deal.original_price - deal.price)} ({discountPercentage}% off)
          </p>
        </div>
      )}
    </div>
  )
}

// Stock and Availability Component
const StockStatus = ({ deal }) => {
  // Show expiry date if available, otherwise show stock status
  if (deal.expires_at) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            Expires {new Date(deal.expires_at).toLocaleDateString()}
          </span>
          {deal.stock_quantity && (
            <span className="text-xs text-gray-600">
              ({deal.stock_quantity} remaining)
            </span>
          )}
        </div>
      </div>
    )
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'in_stock': 
        return {
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'In Stock'
        }
      case 'low_stock': 
        return {
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Low Stock - Order Soon'
        }
      case 'out_of_stock': 
        return {
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Currently Unavailable'
        }
      default: 
        return null // Don't show anything for unknown status
    }
  }

  const config = getStatusConfig(deal.stock_status)

  // Only render if we have a valid status
  if (!config) return null

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
        {deal.stock_quantity && (
          <span className="text-xs text-gray-600">
            ({deal.stock_quantity} remaining)
          </span>
        )}
      </div>
    </div>
  )
}

// Trust Indicators Component
const TrustIndicators = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <ShieldCheckIcon className="w-4 h-4 text-green-600" />
      </div>
      <div>
        <span className="text-sm font-medium text-green-800">Secure checkout</span>
        <p className="text-xs text-green-600">SSL encrypted payment</p>
      </div>
    </div>
    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <TruckIcon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <span className="text-sm font-medium text-blue-800">Fast & reliable delivery</span>
        <p className="text-xs text-blue-600">Tracked shipping included</p>
      </div>
    </div>
    <div className="flex items-center space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
        <ArrowPathIcon className="w-4 h-4 text-purple-600" />
      </div>
      <div>
        <span className="text-sm font-medium text-purple-800">Easy returns</span>
        <p className="text-xs text-purple-600">30-day return policy</p>
      </div>
    </div>
  </div>
)

// Comprehensive Related Deals and Coupons Component
const RelatedDealsAndCoupons = ({ dealId, companyId }) => {
  const [activeTab, setActiveTab] = useState('deals')
  const [deals, setDeals] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRelatedContent = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch related deals (limited to 8 for horizontal scrolling)
        const dealsResponse = await fetch(`/api/deals/related/${dealId}?limit=8`)
        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json()
          setDeals(dealsData || [])
        } else {
          console.warn('Failed to fetch related deals:', dealsResponse.status)
          // Fetch fallback deals if related deals fail
          const fallbackResponse = await fetch(`/api/deals?limit=8&sort=hot`)
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            setDeals(fallbackData || [])
          } else {
            setDeals([])
          }
        }

        // Fetch company coupons (limited to 8 for horizontal scrolling)
        if (companyId) {
          const couponsResponse = await fetch(`/api/companies/${companyId}/coupons?limit=8`)
          if (couponsResponse.ok) {
            const couponsData = await couponsResponse.json()
            setCoupons(couponsData || [])
          } else {
            console.warn('Failed to fetch company coupons:', couponsResponse.status)
            // Fetch fallback coupons if company coupons fail
            const fallbackCouponsResponse = await fetch(`/api/coupons?limit=8`)
            if (fallbackCouponsResponse.ok) {
              const fallbackCouponsData = await fallbackCouponsResponse.json()
              setCoupons(fallbackCouponsData || [])
            } else {
              setCoupons([])
            }
          }
        } else {
          // If no company ID, fetch general coupons as fallback
          const fallbackCouponsResponse = await fetch(`/api/coupons?limit=8`)
          if (fallbackCouponsResponse.ok) {
            const fallbackCouponsData = await fallbackCouponsResponse.json()
            setCoupons(fallbackCouponsData || [])
          } else {
            setCoupons([])
          }
        }
      } catch (error) {
        console.error('Error fetching related content:', error)
        setError('Failed to load related content')
        setDeals([])
        setCoupons([])
      } finally {
        setLoading(false)
      }
    }

    if (dealId) {
      fetchRelatedContent()
    } else {
      setLoading(false)
    }
  }, [dealId, companyId])

  const RelatedDealCard = ({ deal }) => (
    <Link
      to={`/deal/${deal.id}`}
      className="group block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-mint-300 transition-all duration-200 flex-shrink-0 w-80"
    >
      <div className="flex flex-col space-y-3">
        <div className="w-full h-32 rounded-lg bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 border border-gray-200 p-3 flex items-center justify-center">
          <ImageWithFallback
            src={deal.image_url || deal.featured_image}
            alt={deal.title}
            className="w-full h-full object-contain"
            fallbackClassName="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 group-hover:text-mint-700 transition-colors line-clamp-2 ${
            deal.title.length > 60 ? 'text-sm' : 'text-base'
          }`}>
            {deal.title}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-mint-600">
                {formatPrice(deal.price)}
              </span>
              {deal.original_price && deal.original_price > deal.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(deal.original_price)}
                </span>
              )}
            </div>
            {deal.discount_percentage && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                -{deal.discount_percentage}%
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
            <span>{deal.companies?.name || deal.merchant}</span>
            <span>•</span>
            <span>{dateAgo(deal.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )

  const RelatedCouponCard = ({ coupon }) => (
    <Link
      to={`/company/${coupon.company?.slug || coupon.companies?.slug}?tab=coupons`}
      className="group block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-amber-300 transition-all duration-200 flex-shrink-0 w-80"
    >
      <div className="flex flex-col space-y-3">
        <div className="w-full h-32 rounded-lg bg-gradient-to-br from-amber-50 via-yellow-50/30 to-orange-50/40 border border-gray-200 p-3 flex items-center justify-center">
          {(coupon.company?.logo_url || coupon.companies?.logo_url) ? (
            <ImageWithFallback
              src={coupon.company?.logo_url || coupon.companies?.logo_url}
              alt={coupon.company?.name || coupon.companies?.name}
              className="w-full h-full object-contain"
              fallbackClassName="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-700">
                {(coupon.company?.name || coupon.companies?.name || 'C').charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2 ${
            coupon.title.length > 60 ? 'text-sm' : 'text-base'
          }`}>
            {coupon.title}
          </h3>
          {coupon.coupon_code && (
            <div className="mt-2 bg-amber-50 border-2 border-dashed border-amber-400 rounded-lg px-3 py-2">
              <div className="text-xs text-amber-700 mb-1">Coupon Code:</div>
              <div className="font-mono text-sm font-bold text-amber-900">
                {coupon.coupon_code}
              </div>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{coupon.company?.name || coupon.companies?.name}</span>
              <span>•</span>
              <span>{dateAgo(coupon.created_at)}</span>
            </div>
            {coupon.expires_at && (
              <span className="text-xs text-gray-500">
                Expires {new Date(coupon.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-400 text-lg mb-2">⚠️</div>
          <div className="text-gray-600 mb-2">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-mint-600 hover:text-mint-700 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('deals')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'deals'
                ? 'text-mint-600 border-b-2 border-mint-600 bg-mint-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Related Deals
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'coupons'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Company Coupons
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'deals' ? (
          <div>
            {deals.length > 0 ? (
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {deals.map((deal) => (
                  <RelatedDealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">🛍️</div>
                <div className="text-gray-600 mb-2">No deals available right now</div>
                <p className="text-gray-500 text-sm">Check back later for amazing deals</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {coupons.length > 0 ? (
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {coupons.map((coupon) => (
                  <RelatedCouponCard key={coupon.id} coupon={coupon} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">🎫</div>
                <div className="text-gray-600 mb-2">No coupons available right now</div>
                <p className="text-gray-500 text-sm">Check back later for exciting offers</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


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
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-4">
            <Link to="/" className="text-mint-600 hover:text-mint-700 font-medium">Home</Link>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            {deal.categories && (
              <>
                <Link to={`/category/${deal.categories.slug}`} className="text-mint-600 hover:text-mint-700 font-medium">
                  {deal.categories.name}
                </Link>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="text-gray-600 truncate">{truncate(deal.title, 50)}</span>
          </nav>

          {/* Deal Title and Company */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold text-gray-900 mb-3 leading-tight ${
                deal.title.length > 80 
                  ? 'text-lg lg:text-xl' 
                  : deal.title.length > 50 
                  ? 'text-xl lg:text-2xl' 
                  : 'text-2xl lg:text-3xl'
              }`}>
                {deal.title}
              </h1>
              <div className="flex items-center space-x-3 flex-wrap">
                <div className="flex items-center space-x-2">
                  <Link 
                    to={`/company/${deal.companies?.slug || deal.merchant}`}
                    className="flex items-center space-x-2 text-mint-600 hover:text-mint-700 font-medium group"
                  >
                    {deal.companies?.logo_url ? (
                      <img 
                        src={deal.companies.logo_url} 
                        alt={deal.companies.name}
                        className="w-6 h-6 rounded object-contain bg-white p-0.5 border border-gray-200 group-hover:border-mint-300 transition-colors"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-mint-100 to-emerald-100 rounded flex items-center justify-center group-hover:from-mint-200 group-hover:to-emerald-200 transition-colors">
                        <span className="text-xs font-bold text-mint-700">
                          {(deal.companies?.name || deal.merchant || 'S').charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className={`${
                      (deal.companies?.name || deal.merchant || '').length > 20 
                        ? 'text-sm' 
                        : 'text-base'
                    }`}>
                      {deal.companies?.name || deal.merchant}
                    </span>
                  </Link>
                  {deal.companies?.is_verified && (
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{dateAgo(deal.created_at)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
              <button
                onClick={handleBookmark}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isBookmarked 
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
              >
                {isBookmarked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleShare}
                className="p-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                title="Share deal"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
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
            
            {/* Price and Action Card */}
            <div className="bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <PriceDisplay deal={deal} />
              
              {/* Stock Status */}
              <div className="mt-4">
                <StockStatus deal={deal} />
              </div>

              {/* Coupon Code */}
              {deal.coupon_code && (
                <div className="mt-4 p-4 bg-white border-2 border-dashed border-green-400 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Coupon Code:</p>
                      <code className="text-xl font-mono font-bold text-green-900">
                        {deal.coupon_code}
                      </code>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(deal.coupon_code)
                        toast.success('Coupon code copied!')
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Main Action Button */}
              <div className="mt-6">
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg text-center block transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
                  onClick={() => {
                    // Track click
                    api.trackDealClick(deal.id).catch(() => {})
                  }}
                >
                  Get This Deal
                </a>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
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
                      className="mt-3 text-mint-600 hover:text-mint-700 text-sm font-medium"
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

            {/* Trust Indicators Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-4">Why shop with confidence</h3>
              <TrustIndicators />
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Voting Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-4">Community Rating</h3>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVote('up')}
                    className={`p-3 rounded-lg border transition-colors ${
                      deal?.userVote === 1 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HandThumbUpIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleVote('down')}
                    className={`p-3 rounded-lg border transition-colors ${
                      deal?.userVote === -1 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HandThumbDownIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {(deal.upvotes || 0) - (deal.downvotes || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Net Score</div>
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="flex items-center justify-end space-x-4">
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

            {/* Deal Stats Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-4">Deal Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium text-gray-900">{deal.views_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Clicks:</span>
                  <span className="font-medium text-gray-900">{deal.clicks_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium text-gray-900">{dateAgo(deal.created_at)}</span>
                </div>
                {deal.expires_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium text-red-600">
                      {dateAgo(deal.expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Deals Card */}
            {relatedDeals && relatedDeals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                <h3 className="font-semibold text-gray-900 mb-4">Related Deals</h3>
                <div className="space-y-4">
                  {relatedDeals.slice(0, 3).map((relatedDeal) => (
                    <Link
                      key={relatedDeal.id}
                      to={`/deal/${relatedDeal.id}`}
                      className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 border border-gray-200 p-2 flex items-center justify-center flex-shrink-0">
                        <ImageWithFallback
                          src={relatedDeal.image_url || relatedDeal.featured_image}
                          alt={relatedDeal.title}
                          className="w-full h-full object-contain"
                          fallbackClassName="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-gray-900 group-hover:text-mint-700 transition-colors ${
                          relatedDeal.title.length > 60 
                            ? 'text-xs line-clamp-2' 
                            : 'text-sm line-clamp-2'
                        }`}>
                          {relatedDeal.title}
                        </p>
                        <p className="text-sm text-mint-600 font-bold mt-1">
                          {formatPrice(relatedDeal.price)}
                        </p>
                        {relatedDeal.discount_percentage && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            -{relatedDeal.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Deals and Coupons Section */}
        {deal?.id && (
          <div className="mt-8">
            <RelatedDealsAndCoupons 
              dealId={deal.id} 
              companyId={deal.companies?.id} 
            />
          </div>
        )}

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
