import React, { useState, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Clock, 
  Zap, 
  Percent, 
  Gift,
  ChevronRight,
  Sparkles,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Star,
  Heart,
  ShoppingCart,
  Eye,
  ArrowRight,
  Tag,
  Flame,
  AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '../lib/head.js'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

// Modern Deal Card Component
const ModernDealCard = ({ deal, index }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const { user } = useAuth()

  const discountPercentage = deal.discount_percentage || 
    (deal.price && deal.original_price 
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : null)

  const handleLike = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      // Redirect to login
      window.location.href = '/signin'
      return
    }
    setIsLiked(!isLiked)
    // TODO: API call to save/unsave deal
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Link to={`/deal/${deal.id}`} className="block h-full">
        <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-gray-100">
          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
            {deal.image_url ? (
              <img
                src={deal.image_url}
                alt={deal.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-gray-300" />
              </div>
            )}
            
            {/* Overlay on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {deal.is_featured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg"
                >
                  <Star className="w-3 h-3" />
                  Featured
                </motion.div>
              )}
              {deal.free_shipping && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg"
                >
                  <Gift className="w-3 h-3" />
                  Free Shipping
                </motion.div>
              )}
              {deal.deal_type === 'lightning' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg animate-pulse"
                >
                  <Zap className="w-3 h-3" />
                  Lightning Deal
                </motion.div>
              )}
            </div>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Heart 
                className={`w-5 h-5 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`} 
              />
            </button>

            {/* Discount Badge */}
            {discountPercentage && discountPercentage > 0 && (
              <div className="absolute bottom-4 right-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                >
                  <div className="text-center">
                    <div className="text-xl font-bold leading-none">{discountPercentage}%</div>
                    <div className="text-xs">OFF</div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col">
            {/* Store & Category */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                {deal.store || 'Unknown Store'}
              </span>
              <div className="flex items-center gap-1 text-gray-400">
                <Eye className="w-4 h-4" />
                <span className="text-xs">{deal.view_count || 0}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {deal.title}
            </h3>

            {/* Description */}
            {deal.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                {deal.description}
              </p>
            )}

            {/* Price Section */}
            <div className="flex items-end justify-between mb-4">
              <div>
                {deal.price ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${deal.price}
                    </span>
                    {deal.original_price && (
                      <span className="text-sm text-gray-400 line-through">
                        ${deal.original_price}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-primary-600">
                    See Deal
                  </span>
                )}
              </div>
              
              {/* Vote Score */}
              <div className="flex items-center gap-1">
                <Flame className={`w-5 h-5 ${deal.vote_score > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-semibold ${deal.vote_score > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {deal.vote_score || 0}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Get Deal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Expiry Info */}
            {deal.expires_at && (
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Expires {new Date(deal.expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Quick Filter Pills
const QuickFilters = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { id: 'all', label: 'All Deals', icon: Sparkles, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { id: 'ending-soon', label: 'Ending Soon', icon: Clock, color: 'bg-gradient-to-r from-red-500 to-pink-500' },
    { id: 'best-discount', label: 'Best Discounts', icon: Percent, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { id: 'free-shipping', label: 'Free Shipping', icon: Gift, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id
        
        return (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300
              ${isActive 
                ? `${filter.color} text-white shadow-lg` 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </motion.button>
        )
      })}
    </div>
  )
}

// Main Homepage Component
export default function ModernHomepage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const { user } = useAuth()

  useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Discover Amazing Deals & Save Big',
      description: 'Find the hottest deals, exclusive coupons, and biggest discounts on your favorite brands. Join thousands saving money every day!',
      canonical: window.location.origin,
    })
  }, [])

  // Fetch deals with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['deals', activeFilter],
    queryFn: ({ pageParam = 0 }) => {
      const params = { 
        limit: 24, 
        offset: pageParam,
        sort_by: activeFilter === 'trending' ? 'popular' : 'newest'
      }
      
      switch (activeFilter) {
        case 'ending-soon':
          params.ending_soon = true
          break
        case 'best-discount':
          params.min_discount = 50
          break
        case 'free-shipping':
          params.free_shipping = true
          break
      }
      
      return api.getDeals(params)
    },
    getNextPageParam: (lastPage, pages) => {
      const totalDeals = pages.flatMap(page => page).length
      return lastPage.length === 24 ? totalDeals : undefined
    },
    staleTime: 5 * 60 * 1000
  })

  const deals = data?.pages?.flat() || []

  // Handle scroll to load more
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - Minimal */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 py-16">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Discover Today's Best Deals
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-primary-100 mb-8"
          >
            Save big on electronics, fashion, home goods & more
          </motion.p>
          
          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-8 text-white/90"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              <span className="font-semibold">{deals.length}+ Active Deals</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Percent className="w-5 h-5" />
              <span className="font-semibold">Up to 80% Off</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">New Daily</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <QuickFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            
            {/* Advanced Filters */}
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
        </div>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600">We couldn't load the deals. Please try again later.</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-600">Check back later for new deals!</p>
          </div>
        ) : (
          <>
            <div className={`
              grid gap-6
              ${viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
              }
            `}>
              {deals.map((deal, index) => (
                <ModernDealCard key={deal.id} deal={deal} index={index} />
              ))}
            </div>

            {/* Load More */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            )}

            {!hasNextPage && deals.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>You've reached the end! 🎉</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}