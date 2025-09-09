import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { setPageMeta } from '../lib/head.js'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { 
  ShoppingCart, 
  Tag, 
  Clock, 
  Eye, 
  ArrowRight,
  Star,
  Gift,
  Flame,
  Loader2,
  Sparkles
} from 'lucide-react'
import { NewDealCard } from '../components/Deal/NewDealCard'

// Use the new NewDealCard component
const DealCard = ({ deal, index }) => {
  return <NewDealCard deal={deal} index={index} />
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
  const { user } = useAuth()
  
  const { data: deals, isLoading, error } = useQuery({
    queryKey: section.queryKey,
    queryFn: section.queryFn,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(!section.isPersonalized || !!user) // Only fetch personalized if user is logged in
  })

  // For personalized sections, always fetch fallback deals
  const { data: fallbackDeals, isLoading: fallbackLoading, error: fallbackError } = useQuery({
    queryKey: ['fallback-deals', section.limit],
    queryFn: () => api.getDeals({ limit: section.limit, sort_by: 'trending' }),
    enabled: Boolean(section.isPersonalized),
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  })

  // Ultimate fallback - get any deals if both personalized and trending fail
  const { data: ultimateFallback } = useQuery({
    queryKey: ['ultimate-fallback', section.limit],
    queryFn: () => api.getDeals({ limit: section.limit }),
    enabled: Boolean(section.isPersonalized && (!fallbackDeals || fallbackDeals.length === 0)),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000
  })

  // No static fallback - only use real deals from API

  // Determine what to display - prioritize personalized, fallback to trending, ultimate fallback to any deals
  const displayData = (deals && deals.length > 0) ? deals : 
                     (fallbackDeals && fallbackDeals.length > 0) ? fallbackDeals : 
                     (ultimateFallback && ultimateFallback.length > 0) ? ultimateFallback : null
  const isFallback = section.isPersonalized && (!deals || deals.length === 0)

  return (
    <div className="deal-section">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          {section.isPersonalized && <Sparkles className="w-6 h-6 text-blue-500" />}
          {isFallback ? 'Just for You' : section.title}
        </h2>
        <p className="text-gray-600">
          {isFallback ? 'Trending deals we think you\'ll love' : section.subtitle}
        </p>
      </div>

      {/* Deals Grid */}
      {(isLoading || fallbackLoading) && !displayData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : displayData && displayData.length > 0 ? (
        <div className={`grid gap-4 ${
          section.limit === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          section.limit === 6 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          section.limit === 8 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {displayData.map((item, index) => {
            // Handle both recommendation objects and deal objects
            const deal = item.recommendation_type ? item.metadata : item
            return (
              <div key={item.id || `fallback-${deal.id}`} className="relative">
                {/* Recommendation Badge */}
                {item.recommendation_type && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      <Sparkles className="w-3 h-3" />
                      <span>Recommended</span>
                    </div>
                  </div>
                )}
                <DealCard deal={deal} index={index} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading deals for you...</p>
          <p className="text-gray-500 text-xs mt-2">Please wait while we fetch the latest deals</p>
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
      queryKey: ['user-recommendations', 4],
      queryFn: () => api.getUserRecommendations({ type: 'deal', limit: 4 }),
      isPersonalized: true
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