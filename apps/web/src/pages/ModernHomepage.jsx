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
  Sparkles,
  Store
} from 'lucide-react'
import { NewDealCard } from '../components/Deal/NewDealCard'
import { Container } from '../components/Layout/Container'
import AdvancedSearchInterface from '../components/Search/AdvancedSearchInterface'
import RestaurantSection from '../components/Homepage/RestaurantSection'

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
  const displayData = (deals && Array.isArray(deals) && deals.length > 0) ? deals : 
                     (fallbackDeals && Array.isArray(fallbackDeals) && fallbackDeals.length > 0) ? fallbackDeals : 
                     (ultimateFallback && Array.isArray(ultimateFallback) && ultimateFallback.length > 0) ? ultimateFallback : []
  const isFallback = section.isPersonalized && (!deals || !Array.isArray(deals) || deals.length === 0)

  return (
    <div className="deal-section">
      {/* Section Header */}
      <div className="mb-4 lg:mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          {section.isPersonalized && <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />}
          {isFallback ? 'Just for You' : section.title}
        </h2>
        <p className="text-sm lg:text-base text-gray-600">
          {isFallback ? 'Trending deals we think you\'ll love' : section.subtitle}
        </p>
      </div>

      {/* Deals Grid - 3-up cards */}
      {(isLoading || fallbackLoading) && !displayData ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-gray-100 rounded-xl h-[260px]" />
          ))}
        </div>
      ) : displayData && Array.isArray(displayData) && displayData.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayData.map((item, index) => {
            // Handle both recommendation objects and deal objects
            const deal = item?.recommendation_type ? item?.metadata : item
            return (
              <div 
                key={item?.id || `fallback-${deal?.id || index}`} 
                className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 overflow-hidden hover:-translate-y-0.5"
              >
                {/* Recommendation Badge */}
                {item?.recommendation_type && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                      <Sparkles className="w-3 h-3" />
                      <span>Recommended</span>
                    </div>
                  </div>
                )}
                
                {/* Card Content with Image-first framing */}
                <div className="relative overflow-hidden rounded-xl group-hover:[&_img]:scale-105 transition-transform duration-300">
                  <DealCard deal={deal} index={index} />
                </div>
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
      {/* Professional search interface - centered with max width */}
      <div className="bg-gradient-to-b from-white to-gray-50/30 py-8 border-b border-gray-100">
        <Container>
          <div className="max-w-2xl mx-auto">
            <AdvancedSearchInterface
              showFilters={false}
              showSuggestions={true}
              compact={true}
              placeholder="Search deals, coupons, stores..."
              className="drop-shadow-sm"
            />
          </div>
        </Container>
      </div>
      {/* Main Content - CSS Grid Layout */}
      <section className="py-10 lg:py-12">
        <Container>
          <div className="max-w-[1200px] mx-auto">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Content Column - Center */}
              <div className="lg:col-span-9">
                {/* Deal Sections */}
                <div className="space-y-8 lg:space-y-12">
                  {Array.isArray(dealSections) && dealSections.map((section, index) => (
                    <React.Fragment key={section.id}>
                      <DealSection section={section} />
                      {/* Add Restaurant Section after "Just for You" */}
                      {section.id === 'just-for-you' && (
                        <div className="mt-8 lg:mt-12">
                          <RestaurantSection />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* View All Deals Button */}
                <div className="text-center mt-8 lg:mt-12">
                  <Link 
                    to="/new" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-2.5 lg:py-3 px-5 lg:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm lg:text-base"
                  >
                    View All Deals
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Link>
                </div>
              </div>

              {/* Right Rail - Coupons & Leaderboard */}
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-8 space-y-6 lg:space-y-8">
              {/* Coupons Section */}
              <div>
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Latest Coupons</h2>
                  <Link 
                    to="/companies" 
                    className="text-primary-600 hover:text-primary-700 text-xs lg:text-sm font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
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
                ) : coupons && Array.isArray(coupons) && coupons.length > 0 ? (
                  <div className="space-y-1">
                    {coupons.map((coupon, index) => (
                      <CompactCouponCard key={coupon?.id || index} coupon={coupon} index={index} />
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
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Leaderboard</h2>
                  <Link 
                    to="/leaderboard" 
                    className="text-primary-600 hover:text-primary-700 text-xs lg:text-sm font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                  </Link>
                </div>

                {/* Period Selector */}
                <div className="flex space-x-1 mb-3 bg-gray-100 p-0.5 lg:p-1 rounded-lg">
                  {['week', 'month', 'alltime'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setLeaderboardPeriod(period)}
                      className={`px-2 lg:px-3 py-1 lg:py-1.5 text-xs font-medium rounded-md transition-colors ${
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
                ) : leaderboardData && Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboardData.map((user, index) => (
                      <LeaderboardCard key={user?.id || index} user={user} rank={index + 1} />
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
          </div>
        </Container>
      </section>
    </div>
  )
}