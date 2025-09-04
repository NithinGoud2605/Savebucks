import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Tag, 
  Clock, 
  Search,
  SlidersHorizontal,
  Plus,
  X,
  Copy,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Percent,
  Store,
  Calendar,
  Filter,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Zap,
  Heart,
  Share2,
  ChevronRight
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { setPageMeta } from '../lib/head'

// Modern Coupon Card
const CouponCard = ({ coupon, index }) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { user } = useAuth()

  const handleCopyCode = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!coupon.code) return

    try {
      await navigator.clipboard.writeText(coupon.code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleRevealCode = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      window.location.href = '/signin'
      return
    }
    setIsSaved(!isSaved)
    // TODO: API call to save coupon
  }

  const formatExpiry = (date) => {
    if (!date) return null
    const expiryDate = new Date(date)
    const now = new Date()
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return 'Expired'
    if (daysLeft === 0) return 'Expires today'
    if (daysLeft === 1) return 'Expires tomorrow'
    if (daysLeft <= 7) return `${daysLeft} days left`
    return expiryDate.toLocaleDateString()
  }

  const discountAmount = coupon.discount_amount || coupon.discount_percentage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Store Logo/Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-600" />
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">
                {coupon.store || coupon.company?.name || 'Store'}
              </h3>
              <p className="text-sm text-gray-500">
                {coupon.category?.name || coupon.category || 'All Categories'}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${
                isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`} 
            />
          </button>
        </div>

        {/* Discount Amount */}
        <div className="mb-4">
          {coupon.type === 'percentage' && coupon.discount_percentage ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-600">
                {coupon.discount_percentage}%
              </span>
              <span className="text-lg text-gray-600">OFF</span>
            </div>
          ) : coupon.type === 'fixed' && coupon.discount_amount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-600">
                ${coupon.discount_amount}
              </span>
              <span className="text-lg text-gray-600">OFF</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-primary-600">
              Special Offer
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {coupon.title}
        </h4>
        
        {coupon.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {coupon.description}
          </p>
        )}

        {/* Code Section */}
        {coupon.code ? (
          <div className="mb-4">
            {!isRevealed ? (
              <button
                onClick={handleRevealCode}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 text-gray-700 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Tag className="w-5 h-5" />
                Click to Reveal Code
              </button>
            ) : (
              <div className="relative">
                <div className="w-full py-3 px-4 bg-primary-50 rounded-xl border-2 border-primary-200 text-primary-700 font-mono font-bold text-center text-lg">
                  {coupon.code}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  {isCopied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <div className="w-full py-3 px-4 bg-gradient-to-r from-primary-100 to-purple-100 rounded-xl text-center">
              <span className="text-primary-700 font-medium">No Code Needed</span>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <motion.a
          href={coupon.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Shop Now
          <ExternalLink className="w-4 h-4" />
        </motion.a>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatExpiry(coupon.expiration)}</span>
          </div>
          
          {coupon.usage_count > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Used {coupon.usage_count} times</span>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl -z-10" />
    </motion.div>
  )
}

// Filter Sidebar
const FilterSidebar = ({ isOpen, onClose, filters, onFilterChange, categories, stores }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 lg:relative lg:shadow-none lg:z-auto"
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Coupons
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                    placeholder="Search by store or offer..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Discount Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="space-y-2">
                  {['all', 'percentage', 'fixed', 'bogo', 'free-shipping'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={filters.type === type}
                        onChange={(e) => onFilterChange('type', e.target.value)}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {type === 'all' ? 'All Types' : type.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => onFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stores */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store
                </label>
                <select
                  value={filters.store}
                  onChange={(e) => onFilterChange('store', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Stores</option>
                  {stores?.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => onFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="popular">Most Popular</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => onFilterChange('reset', true)}
                className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Main Coupons Page
export default function ModernCouponsPage() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    store: '',
    type: 'all',
    sort: 'newest'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const { user } = useAuth()

  useEffect(() => {
    setPageMeta({
      title: 'Coupons & Promo Codes - SaveBucks',
      description: 'Save money with exclusive coupon codes and promo codes from thousands of stores. Get up to 80% off on your favorite brands.',
      canonical: `${window.location.origin}/coupons`,
    })
  }, [])

  // Fetch coupons with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['coupons', filters],
    queryFn: ({ pageParam = 0 }) => {
      const params = {
        limit: 24,
        offset: pageParam,
        ...filters
      }
      return api.listCoupons(params)
    },
    getNextPageParam: (lastPage, pages) => {
      const totalCoupons = pages.flatMap(page => page).length
      return lastPage.length === 24 ? totalCoupons : undefined
    },
    staleTime: 2 * 60 * 1000
  })

  // Fetch categories and stores for filters
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60 * 1000
  })

  const { data: stores } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 }),
    staleTime: 10 * 60 * 1000
  })

  const coupons = data?.pages?.flat() || []

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '',
        category: '',
        store: '',
        type: 'all',
        sort: 'newest'
      })
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
    }
  }

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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 py-12">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Tag className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Exclusive Coupon Codes
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Save big with verified promo codes from {stores?.length || '1000+'} stores
            </p>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                <span className="font-semibold">Up to 80% Off</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">100% Verified</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Updated Daily</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                isOpen={true}
                onClose={() => {}}
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
                stores={stores}
              />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                {/* Results Count */}
                <p className="text-sm text-gray-600">
                  {coupons.length > 0 && `${coupons.length} coupons found`}
                </p>
              </div>

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
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Coupons Grid/List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600">We couldn't load the coupons. Please try again later.</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-20">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No coupons found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later!</p>
              </div>
            ) : (
              <>
                <div className={`
                  grid gap-6
                  ${viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                  }
                `}>
                  {coupons.map((coupon, index) => (
                    <CouponCard key={coupon.id} coupon={coupon} index={index} />
                  ))}
                </div>

                {/* Load More */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                )}

                {!hasNextPage && coupons.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>You've seen all coupons! 🎉</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        stores={stores}
      />

      {/* Floating Action Button - Post Coupon */}
      {user && (
        <Link
          to="/post/coupon"
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 group"
        >
          <Plus className="w-6 h-6" />
          <span className="absolute right-full mr-3 py-2 px-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Share a Coupon
          </span>
        </Link>
      )}
    </div>
  )
}