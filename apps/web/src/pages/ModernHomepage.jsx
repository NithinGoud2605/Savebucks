import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { setPageMeta } from '../lib/head.js'
import { api } from '../lib/api'
import { 
  ShoppingCart, 
  Tag, 
  Clock, 
  Eye, 
  ArrowRight,
  Star,
  Gift,
  Flame,
  Loader2
} from 'lucide-react'

// Deal Card Component
const DealCard = ({ deal, index }) => {
  const discountPercentage = deal.discount_percentage || 
    (deal.original_price && deal.price ? 
      Math.round(((deal.original_price - deal.price) / deal.original_price) * 100) : 0)
  
  // Image selection: prefer featured_image, then first of deal_images, then image_url
  const images = Array.isArray(deal.deal_images) && deal.deal_images.length > 0 ? deal.deal_images : (deal.image_url ? [deal.image_url] : [])
  const currentImage = deal.featured_image || images[0] || deal.image_url

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      <Link to={`/deal/${deal.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
          {currentImage ? (
            <img
              src={(() => {
                try {
                  const u = new URL(currentImage)
                  u.pathname = u.pathname.split('/').map(encodeURIComponent).join('/')
                  return u.toString()
                } catch {
                  return currentImage
                }
              })()}
              alt={deal.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e)=>{
                const img = e.currentTarget
                if (!img.dataset.proxyUsed) {
                  img.dataset.proxyUsed = '1'
                  img.src = `/api/proxy/image?url=${encodeURIComponent(currentImage)}`
                } else {
                  img.removeAttribute('onerror')
                  img.src = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">Image unavailable</text></svg>')}`
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {deal.is_featured && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Star className="w-3 h-3" />
                Featured
              </div>
            )}
            {deal.free_shipping && (
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Gift className="w-3 h-3" />
                Free Shipping
              </div>
            )}
          </div>

          {/* Discount Badge */}
          {discountPercentage && discountPercentage > 0 && (
            <div className="absolute top-3 right-3">
              <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-sm font-bold leading-none">{discountPercentage}%</div>
                  <div className="text-xs">OFF</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Store & Views */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
              {deal.companies?.name || deal.merchant || 'Unknown Store'}
            </span>
            <div className="flex items-center gap-1 text-gray-400">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{deal.views_count || 0}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
            {deal.title}
          </h3>

          {/* Price Section */}
          <div className="flex items-end justify-between mb-3">
            <div>
              {deal.price ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    ${Number(deal.price).toFixed(2)}
                  </span>
                  {deal.original_price && (
                    <span className="text-sm text-gray-400 line-through">
                      ${Number(deal.original_price).toFixed(2)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-primary-600">
                  See Deal
                </span>
              )}
            </div>
            
            {/* Vote Score */}
            <div className="flex items-center gap-1">
              <Flame className={`w-4 h-4 ${(deal.ups||0)-(deal.downs||0) > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className={`text-xs font-semibold ${(deal.ups||0)-(deal.downs||0) > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                {(deal.ups || 0) - (deal.downs || 0)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md transition-all duration-300">
            Get Deal
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Link>
    </motion.article>
  )
}

// Coupon Card Component
const CouponCard = ({ coupon, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Coupon Icon */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
          <Tag className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Store */}
          <div className="text-xs font-semibold text-primary-600 mb-1">
            {coupon.store || 'Unknown Store'}
          </div>
          
          {/* Title */}
          <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
            {coupon.title}
          </h4>
          
          {/* Code */}
          {coupon.code && (
            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-3">
              <div className="text-xs text-gray-600 mb-1">Coupon Code:</div>
              <div className="font-mono text-sm font-bold text-primary-600">{coupon.code}</div>
            </div>
          )}
          
          {/* Expiry */}
          {coupon.expires_at && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Compact Coupon Card Component for Sidebar
const CompactCouponCard = ({ coupon, index }) => {
  const handleCouponClick = async () => {
    try {
      await api.trackCouponClick(coupon.id, 'homepage_sidebar')
    } catch (error) {
      console.error('Failed to track coupon click:', error)
    }
  }

  return (
    <Link 
      to={`/company/${coupon.companies?.slug || coupon.merchant?.toLowerCase().replace(/\s+/g, '-')}?tab=coupons`}
      onClick={handleCouponClick}
      className="block bg-white rounded border border-gray-200 p-2 hover:shadow-sm transition-all duration-200 hover:border-primary-300 group"
    >
      <div className="flex items-center gap-2">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
            {coupon.companies?.logo_url ? (
              <img 
                src={coupon.companies.logo_url} 
                alt={coupon.companies.name}
                className="w-4 h-4 object-contain"
              />
            ) : (
              <Store className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>

        {/* Coupon Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-xs leading-tight mb-1 line-clamp-1">
            {coupon.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
              {coupon.coupon_code}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {coupon.companies?.name}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </div>
      </div>
    </Link>
  )
}

// Leaderboard Card Component
const LeaderboardCard = ({ user, rank }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="flex-shrink-0">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            rank === 1 ? 'bg-yellow-100 text-yellow-800' :
            rank === 2 ? 'bg-gray-100 text-gray-800' :
            rank === 3 ? 'bg-orange-100 text-orange-800' :
            'bg-gray-50 text-gray-600'
          }`}>
            {rank}
          </div>
        </div>

        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.handle}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-gray-600">
                {user.handle?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm leading-tight">
            {user.handle || 'Anonymous'}
          </h3>
          <p className="text-xs text-gray-500">
            {user.xp || 0} XP • {user.deals_count || 0} deals
          </p>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-semibold text-primary-600">
            {user.score || 0}
          </div>
          <div className="text-xs text-gray-500">points</div>
        </div>
      </div>
    </div>
  )
}

// Deal Section Component
const DealSection = ({ section }) => {
  const { data: deals, isLoading, error } = useQuery({
    queryKey: section.queryKey,
    queryFn: section.queryFn,
    staleTime: 5 * 60 * 1000
  })

  return (
    <div className="deal-section">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
        <p className="text-gray-600">{section.subtitle}</p>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-sm font-semibold text-gray-900 mb-2">Failed to load {section.title.toLowerCase()}</div>
          <p className="text-gray-600 text-sm">Please try again later.</p>
        </div>
      ) : deals && deals.length > 0 ? (
        <div className={`grid gap-4 ${
          section.limit === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          section.limit === 6 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          section.limit === 8 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {deals.map((deal, index) => (
            <DealCard key={deal.id} deal={deal} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No {section.title.toLowerCase()} found</p>
        </div>
      )}
    </div>
  )
}

export default function ModernHomepage() {
  const location = useLocation()
  
  useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Discover Amazing Deals & Save Big',
      description: 'Find the hottest deals, exclusive coupons, and biggest discounts on your favorite brands. Join thousands saving money every day!',
      canonical: window.location.origin,
    })
  }, [])
  
  // State for success messages
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Handle navigation state for success messages
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      setSuccessMessage(location.state.message)
      setShowSuccessMessage(true)
      
      // Clear the navigation state
      window.history.replaceState({}, document.title)
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
        setSuccessMessage('')
      }, 5000)
    }
  }, [location.state])

  // Define deal sections instead of filters
  const dealSections = [
    { 
      id: 'just-for-you', 
      title: 'Just for You', 
      subtitle: 'Personalized recommendations',
      limit: 4,
      queryKey: ['deals', 'personalized'],
      queryFn: () => api.getDeals({ limit: 4, sort_by: 'personalized' })
    },
    { 
      id: 'top-deals-week', 
      title: 'Top Deals This Week', 
      subtitle: 'Most popular deals',
      limit: 8,
      queryKey: ['deals', 'top-week'],
      queryFn: () => api.getDeals({ limit: 8, sort_by: 'popular', timeframe: 'week' })
    },
    { 
      id: 'trending-now', 
      title: 'Trending Now', 
      subtitle: 'What\'s hot right now',
      limit: 6,
      queryKey: ['deals', 'trending'],
      queryFn: () => api.getDeals({ limit: 6, sort_by: 'trending' })
    },
    { 
      id: 'ending-soon', 
      title: 'Ending Soon', 
      subtitle: 'Don\'t miss out',
      limit: 4,
      queryKey: ['deals', 'ending-soon'],
      queryFn: () => api.getDeals({ limit: 4, ending_soon: true })
    },
    { 
      id: 'best-discounts', 
      title: 'Best Discounts', 
      subtitle: 'Biggest savings',
      limit: 6,
      queryKey: ['deals', 'best-discounts'],
      queryFn: () => api.getDeals({ limit: 6, min_discount: 50, sort_by: 'discount' })
    }
  ]

  // Fetch coupons (30 for the compact list)
  const { data: coupons, isLoading: couponsLoading, error: couponsError } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => api.listCoupons({ limit: 30, sort: 'newest' }),
    staleTime: 5 * 60 * 1000
  })

  // Fetch leaderboard data
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('week')
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardPeriod],
    queryFn: () => api.getLeaderboard(leaderboardPeriod, 10),
    staleTime: 5 * 60 * 1000
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Main Content - 70:30 Layout */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Deals (70%) */}
          <div className="lg:w-[70%]">
            {/* Deal Sections */}
            <div className="space-y-12">
              {dealSections.map((section) => (
                <DealSection key={section.id} section={section} />
              ))}
            </div>

            {/* View All Deals Button */}
            <div className="text-center mt-12">
              <Link 
                to="/new" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View All Deals
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Right Side - Coupons & Leaderboard (30%) */}
          <div className="lg:w-[30%]">
            <div className="sticky top-8 space-y-8">
              {/* Coupons Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Latest Coupons</h2>
                  <Link 
                    to="/companies" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Compact Coupons List */}
                {couponsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  </div>
                ) : couponsError ? (
                  <div className="text-center py-8">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Failed to load coupons</div>
                    <p className="text-gray-600 text-xs">Please try again later.</p>
                  </div>
                ) : coupons && coupons.length > 0 ? (
                  <div className="space-y-1">
                    {coupons.map((coupon, index) => (
                      <CompactCouponCard key={coupon.id} coupon={coupon} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No coupons found</p>
                  </div>
                )}
              </div>

              {/* Leaderboard Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
                  <Link 
                    to="/leaderboard" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Period Selector */}
                <div className="flex space-x-1 mb-3 bg-gray-100 p-1 rounded-lg">
                  {['week', 'month', 'alltime'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setLeaderboardPeriod(period)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        leaderboardPeriod === period
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
                    </button>
                  ))}
                </div>

                {/* Leaderboard List */}
                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  </div>
                ) : leaderboardData && leaderboardData.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboardData.map((user, index) => (
                      <LeaderboardCard key={user.id} user={user} rank={index + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600">No leaderboard data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}