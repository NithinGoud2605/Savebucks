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
  Store,
  ChevronLeft,
  ChevronRight
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
        <div className="bg-gradient-to-r from-mint-500 to-emerald-600 p-2 rounded-lg shadow-sm">
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
      className="block bg-gradient-to-r from-white via-mint-50/40 to-emerald-50/30 rounded-lg border border-mint-200/60 p-2 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 group hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-gradient-to-br from-mint-100 to-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
            {coupon.companies?.logo_url ? (
              <img 
                src={coupon.companies.logo_url} 
                alt={coupon.companies.name}
                className="w-4 h-4 object-contain"
              />
            ) : (
              <Store className="w-3 h-3 text-mint-500" />
            )}
          </div>
        </div>

        {/* Coupon Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-xs leading-tight mb-0.5 line-clamp-1">
            {coupon.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-mint-600 truncate font-medium">
              {coupon.companies?.name || 'Store'}
            </span>
            <span className="bg-white text-black px-1.5 py-0.5 rounded text-xs font-bold shadow-sm border border-mint-200">
              {coupon.coupon_code}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Leaderboard Card Component
const LeaderboardCard = ({ user, rank }) => {
  return (
    <div className="bg-gradient-to-r from-white via-mint-50/30 to-emerald-50/20 rounded-lg border border-mint-200/60 p-2.5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2.5">
        {/* Rank */}
        <div className="flex-shrink-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
            rank === 1 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800' :
            rank === 2 ? 'bg-gradient-to-r from-mint-100 to-emerald-100 text-mint-800' :
            rank === 3 ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800' :
            'bg-gradient-to-r from-emerald-50 to-mint-50 text-emerald-600'
          }`}>
            {rank}
          </div>
        </div>

        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-gradient-to-br from-mint-100 to-emerald-100 rounded-full flex items-center justify-center shadow-sm">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.handle}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-mint-600">
                {user.handle?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-xs leading-tight">
            {user.handle || 'Anonymous'}
          </h3>
          <p className="text-xs text-mint-600 font-medium">
            {user.xp || 0} XP • {user.deals_count || 0} deals
          </p>
        </div>

        {/* Score */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-r from-mint-100 to-emerald-100 text-mint-700 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
            {user.score || 0}
          </div>
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
              {section.isPersonalized && <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />}
              {isFallback ? 'Just for You' : section.title}
            </h2>
            {section.isPersonalized && (
              <button className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1">
                <span>About these deals</span>
                <Eye className="w-4 h-4" />
              </button>
            )}
            {section.id === 'top-deals-week' && (
              <button className="text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
                Personalize Frontpage
              </button>
            )}
          </div>
          <p className="text-sm lg:text-base text-gray-600">
            {isFallback ? 'Trending deals we think you\'ll love' : section.subtitle}
          </p>
        </div>

       {/* Deals Horizontal Scroll */}
       {(isLoading || fallbackLoading) && !displayData ? (
         <div className="flex gap-3 overflow-x-auto scrollbar-hide">
           {Array.from({ length: 6 }).map((_, index) => (
             <div key={index} className="flex-shrink-0 w-64 h-[280px] animate-pulse bg-gray-100 rounded-xl" />
           ))}
         </div>
       ) : displayData && Array.isArray(displayData) && displayData.length > 0 ? (
         <div className="relative">
           {/* Scroll container */}
           <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
             {displayData.map((item, index) => {
               // Handle both recommendation objects and deal objects
               const deal = item?.recommendation_type ? item?.metadata : item
               return (
                 <div 
                   key={item?.id || `fallback-${deal?.id || index}`} 
                   className="flex-shrink-0 w-64 group block bg-gradient-to-br from-white via-mint-50/30 to-emerald-50/40 rounded-xl border border-mint-200/60 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:scale-[1.02]"
                 >
                   {/* Recommendation Badge */}
                   {item?.recommendation_type && (
                     <div className="absolute top-2 left-2 z-10">
                       <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-mint-500 to-emerald-600 text-white text-xs rounded-full shadow-lg">
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
           
           {/* Scroll indicators */}
           <div className="flex items-center justify-end mt-2 gap-2">
             <button className="p-2 rounded-full bg-gradient-to-r from-mint-100 to-emerald-100 hover:from-mint-200 hover:to-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg">
               <ChevronLeft className="w-4 h-4 text-mint-700" />
             </button>
             <button className="p-2 rounded-full bg-gradient-to-r from-mint-100 to-emerald-100 hover:from-mint-200 hover:to-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg">
               <ChevronRight className="w-4 h-4 text-mint-700" />
             </button>
           </div>
         </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-8 h-8 text-mint-400 mx-auto mb-2" />
          <p className="text-mint-600 text-sm font-medium">Loading deals for you...</p>
          <p className="text-emerald-500 text-xs mt-2">Please wait while we fetch the latest deals</p>
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
    <div className="min-h-screen bg-gradient-to-br from-mint-50/40 via-emerald-50/30 to-green-100/50">
      {/* Professional search interface - centered with max width */}
      <div className="bg-gradient-to-b from-white/95 via-mint-50/30 to-emerald-50/40 py-6 lg:py-8 border-b border-mint-200/70 backdrop-blur-sm shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <AdvancedSearchInterface
              showFilters={false}
              showSuggestions={true}
              compact={true}
              placeholder="Search deals, coupons, stores..."
              className="drop-shadow-sm"
            />
          </div>
        </div>
      </div>
      {/* Main Content - CSS Grid Layout - 10% margins on each side */}
      <section className="py-6 lg:py-8">
        <div className="w-full px-[10%]">
          <div className="w-full max-w-none">
            {/* Success Message */}
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 bg-gradient-to-r from-mint-50 to-emerald-50 border border-mint-200 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-mint-100 to-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-mint-800 font-medium">{successMessage}</p>
                  </div>
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="flex-shrink-0 text-mint-600 hover:text-mint-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Content Column - Center */}
              <div className="lg:col-span-8">
                {/* Deal Sections */}
                <div className="space-y-6 lg:space-y-8">
                  {Array.isArray(dealSections) && dealSections.map((section, index) => (
                    <React.Fragment key={section.id}>
                      <DealSection section={section} />
                      {/* Add Restaurant Section after "Just for You" */}
                      {section.id === 'just-for-you' && (
                        <div className="mt-6 lg:mt-8">
                          <RestaurantSection />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* View All Deals Button */}
                <div className="text-center mt-6 lg:mt-8">
                  <Link 
                    to="/new" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-mint-600 via-emerald-600 to-green-600 hover:from-mint-700 hover:via-emerald-700 hover:to-green-700 text-white font-semibold py-2.5 lg:py-3 px-5 lg:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm lg:text-base hover:-translate-y-0.5 hover:scale-105"
                  >
                    View All Deals
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Link>
                </div>
              </div>

              {/* Right Rail - Coupons & Leaderboard */}
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-8 space-y-6 lg:space-y-8">
              {/* Coupons Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Latest Coupons</h2>
                  <Link 
                    to="/companies" 
                    className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Compact Coupons List */}
                {couponsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  </div>
                ) : couponsError ? (
                  <div className="text-center py-6">
                    <div className="text-xs font-semibold text-gray-900 mb-1">Failed to load coupons</div>
                    <p className="text-gray-600 text-xs">Please try again later.</p>
                  </div>
                ) : coupons && Array.isArray(coupons) && coupons.length > 0 ? (
                  <div className="space-y-1.5">
                    {coupons.slice(0, 10).map((coupon, index) => (
                      <CompactCouponCard key={coupon?.id || index} coupon={coupon} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Tag className="w-6 h-6 text-mint-400 mx-auto mb-1" />
                    <p className="text-xs text-mint-600 font-medium">No coupons found</p>
                  </div>
                )}
              </div>

              {/* Leaderboard Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
                  <Link 
                    to="/leaderboard" 
                    className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Period Selector */}
                <div className="flex space-x-1 mb-2 bg-gradient-to-r from-mint-100 to-emerald-100 p-0.5 rounded-lg shadow-sm">
                  {['week', 'month', 'alltime'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setLeaderboardPeriod(period)}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                        leaderboardPeriod === period
                          ? 'bg-white text-mint-700 shadow-md font-semibold'
                          : 'text-mint-600 hover:text-mint-800 hover:bg-white/50'
                      }`}
                    >
                      {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
                    </button>
                  ))}
                </div>

                {/* Leaderboard List */}
                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-mint-600" />
                  </div>
                ) : leaderboardData && Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
                  <div className="space-y-1.5">
                    {leaderboardData.slice(0, 5).map((user, index) => (
                      <LeaderboardCard key={user?.id || index} user={user} rank={index + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-mint-600 font-medium">No leaderboard data</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  )
}