import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  SortAsc,
  Tag,
  Building2,
  Folder,
  X,
  Grid,
  List,
  TrendingUp,
  Clock,
  DollarSign,
  Percent,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/ui/Skeleton'
import NewDealCard from '../components/Deal/NewDealCard'
import CouponCard from '../components/Coupon/CouponCard'
import { formatPrice, dateAgo } from '../lib/format'

const UnifiedSearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [dealsPage, setDealsPage] = useState(1)
  const [couponsPage, setCouponsPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'deals', 'coupons'
  const [dealsData, setDealsData] = useState([])
  const [couponsData, setCouponsData] = useState([])
  const [dealsLoading, setDealsLoading] = useState(false)
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [dealsHasMore, setDealsHasMore] = useState(true)
  const [couponsHasMore, setCouponsHasMore] = useState(true)

  const searchQuery = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'
  const category = searchParams.get('category') || ''
  const company = searchParams.get('company') || ''
  const tags = searchParams.get('tags') ? searchParams.get('tags').split(',') : []
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const minDiscount = searchParams.get('min_discount') || ''
  const hasCoupon = searchParams.get('has_coupon') === 'true'
  const featured = searchParams.get('featured') === 'true'
  const sort = searchParams.get('sort') || 'relevance'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '9')

  // Build search parameters
  const searchParams_obj = {
    q: searchQuery,
    type,
    category,
    company,
    tags: tags.length > 0 ? tags : undefined,
    min_price: minPrice || undefined,
    max_price: maxPrice || undefined,
    min_discount: minDiscount || undefined,
    has_coupon: hasCoupon || undefined,
    featured: featured || undefined,
    sort,
    page,
    limit
  }

  // Fetch initial search results
  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-search', searchParams_obj],
    queryFn: () => api.search(searchParams_obj),
    enabled: !!searchQuery || !!category || !!company || tags.length > 0,
    staleTime: 30 * 1000 // 30 seconds
  })

  // Initialize data when search results change
  useEffect(() => {
    if (searchResults) {
      setDealsData(searchResults.deals || [])
      setCouponsData(searchResults.coupons || [])
      setDealsHasMore((searchResults.deals || []).length >= 9)
      setCouponsHasMore((searchResults.coupons || []).length >= 9)
    }
  }, [searchResults, limit])

  // Load more deals
  const loadMoreDeals = async () => {
    if (dealsLoading || !dealsHasMore) return

    setDealsLoading(true)
    try {
      const nextPage = dealsPage + 1
      const response = await api.search({
        ...searchParams_obj,
        type: 'deals',
        page: nextPage,
        limit: 9
      })

      if (response.deals && response.deals.length > 0) {
        setDealsData(prev => [...prev, ...response.deals])
        setDealsPage(nextPage)
        setDealsHasMore(response.deals.length >= 9)
      } else {
        setDealsHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more deals:', error)
    } finally {
      setDealsLoading(false)
    }
  }

  // Load more coupons
  const loadMoreCoupons = async () => {
    if (couponsLoading || !couponsHasMore) return

    setCouponsLoading(true)
    try {
      const nextPage = couponsPage + 1
      const response = await api.search({
        ...searchParams_obj,
        type: 'coupons',
        page: nextPage,
        limit: 9
      })

      if (response.coupons && response.coupons.length > 0) {
        setCouponsData(prev => [...prev, ...response.coupons])
        setCouponsPage(nextPage)
        setCouponsHasMore(response.coupons.length >= 9)
      } else {
        setCouponsHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more coupons:', error)
    } finally {
      setCouponsLoading(false)
    }
  }

  // Scroll detection for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll percentage
      const scrollTop = document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      const currentScrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100

      // Load more when user reaches 50% of the page
      if (currentScrollPercentage >= 50) {
        if (activeTab === 'deals' && dealsHasMore && !dealsLoading) {
          loadMoreDeals()
        } else if (activeTab === 'coupons' && couponsHasMore && !couponsLoading) {
          loadMoreCoupons()
        } else if (activeTab === 'all') {
          // For "all" tab, load more of the content that has more items
          if (dealsHasMore && !dealsLoading && dealsData.length >= couponsData.length) {
            loadMoreDeals()
          } else if (couponsHasMore && !couponsLoading && couponsData.length >= dealsData.length) {
            loadMoreCoupons()
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab, dealsLoading, couponsLoading, dealsHasMore, couponsHasMore, dealsData.length, couponsData.length])

  // Fetch fallback content when no results found
  const {
    data: fallbackContent,
    isLoading: fallbackLoading
  } = useQuery({
    queryKey: ['fallback-content'],
    queryFn: async () => {
      const [dealsResponse, couponsResponse] = await Promise.all([
        api.getDeals({ limit: 6, sort: 'popular' }),
        api.getCoupons({ limit: 6, sort: 'popular' })
      ])
      return {
        deals: dealsResponse || [],
        coupons: couponsResponse || []
      }
    },
    enabled: searchResults?.total_results === 0,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Get categories and companies for filters
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60 * 1000
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 }),
    staleTime: 10 * 60 * 1000
  })

  // Handle filter changes
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)

    if (value && value !== '' && value !== false && value !== 'all') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          newParams.set(key, value.join(','))
        } else {
          newParams.delete(key)
        }
      } else {
        newParams.set(key, value.toString())
      }
    } else {
      newParams.delete(key)
    }

    newParams.delete('page') // Reset to page 1 when filters change
    setCurrentPage(1)
    setSearchParams(newParams)
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', newPage.toString())
    setCurrentPage(newPage)
    setSearchParams(newParams)

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Calculate pagination info
  const totalResults = searchResults?.total_results || 0
  const totalPages = Math.ceil(totalResults / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, page - 2)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)

      if (start > 1) {
        pages.push(1)
        if (start > 2) pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Clear all filters
  const clearAllFilters = () => {
    const newParams = new URLSearchParams()
    if (searchQuery) newParams.set('q', searchQuery)
    setSearchParams(newParams)
  }

  // Remove specific filter
  const removeFilter = (key) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete(key)
    newParams.delete('page')
    setSearchParams(newParams)
  }

  // Get active filters for display
  const activeFilters = []
  if (type && type !== 'all') activeFilters.push({ key: 'type', label: `Type: ${type}`, value: type })
  if (category) activeFilters.push({ key: 'category', label: `Category: ${categories.find(c => c.slug === category)?.name || category}`, value: category })
  if (company) activeFilters.push({ key: 'company', label: `Company: ${companies.find(c => c.slug === company)?.name || company}`, value: company })
  if (tags.length > 0) activeFilters.push({ key: 'tags', label: `Tags: ${tags.join(', ')}`, value: tags })
  if (minPrice) activeFilters.push({ key: 'min_price', label: `Min Price: $${minPrice}`, value: minPrice })
  if (maxPrice) activeFilters.push({ key: 'max_price', label: `Max Price: $${maxPrice}`, value: maxPrice })
  if (minDiscount) activeFilters.push({ key: 'min_discount', label: `Min Discount: ${minDiscount}%`, value: minDiscount })
  if (hasCoupon) activeFilters.push({ key: 'has_coupon', label: 'Has Coupon', value: hasCoupon })
  if (featured) activeFilters.push({ key: 'featured', label: 'Featured', value: featured })

  if (error) {
    return (
      <Container>
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Error loading search results</div>
          <button
            onClick={() => refetch()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Search Results'}
          </h1>

        </div>

        {/* Tabs */}
        {searchResults && searchResults.total_results > 0 && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  All Results
                </button>
                {searchResults.total_deals > 0 && (
                  <button
                    onClick={() => setActiveTab('deals')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'deals'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Deals
                  </button>
                )}
                {searchResults.total_coupons > 0 && (
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'coupons'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Coupons
                  </button>
                )}
              </nav>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 lg:hidden"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full"
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="hover:text-primary-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}

          {/* View Mode and Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Type
                </label>
                <select
                  value={type}
                  onChange={(e) => updateFilter('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All (Deals & Coupons)</option>
                  <option value="deals">Deals Only</option>
                  <option value="coupons">Coupons Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <select
                  value={company}
                  onChange={(e) => updateFilter('company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Companies</option>
                  {companies.map(comp => (
                    <option key={comp.id} value={comp.slug}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => updateFilter('min_price', e.target.value)}
                    placeholder="Min"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => updateFilter('max_price', e.target.value)}
                    placeholder="Max"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasCoupon}
                  onChange={(e) => updateFilter('has_coupon', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has Coupon Code</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => updateFilter('featured', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Only</span>
              </label>

              {/* Min Discount Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Discount
                </label>
                <input
                  type="number"
                  value={minDiscount}
                  onChange={(e) => updateFilter('min_discount', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Results Per Page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Results Per Page
                </label>
                <select
                  value={limit}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.set('limit', e.target.value)
                    newParams.delete('page')
                    setSearchParams(newParams)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Deals Loading Skeleton */}
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            </div>
            {/* Coupons Loading Skeleton */}
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            </div>
          </div>
        ) : searchResults ? (
          <div className="space-y-12">
            {/* All Results Tab */}
            {activeTab === 'all' && (
              <>
                {/* Deals Section */}
                {dealsData.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <TrendingUp className="w-6 h-6 text-primary-600" />
                          Deals
                        </h2>
                      </div>
                      <div className="text-sm text-gray-500">
                        Showing {dealsData.length} of {searchResults.total_deals}
                      </div>
                    </div>

                    <div className={`grid gap-6 ${viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                      }`}>
                      {dealsData.map((deal) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <NewDealCard
                            deal={deal}
                            variant={viewMode === 'list' ? 'compact' : 'default'}
                          />
                        </motion.div>
                      ))}
                    </div>


                    {/* Infinite Scroll Loading Indicator */}
                    {dealsLoading && (
                      <div className="mt-8 flex justify-center">
                        <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm">
                          <div className="flex items-center gap-3 text-gray-700">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                            <span className="font-medium">Loading more deals...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Coupons Section */}
                {couponsData.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Tag className="w-6 h-6 text-green-600" />
                          Coupons
                        </h2>
                      </div>
                      <div className="text-sm text-gray-500">
                        Showing {couponsData.length} of {searchResults.total_coupons}
                      </div>
                    </div>

                    <div className={`grid gap-6 ${viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                      }`}>
                      {couponsData.map((coupon) => (
                        <motion.div
                          key={coupon.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CouponCard
                            coupon={coupon}
                            variant={viewMode === 'list' ? 'compact' : 'default'}
                          />
                        </motion.div>
                      ))}
                    </div>


                    {/* Infinite Scroll Loading Indicator */}
                    {couponsLoading && (
                      <div className="mt-8 flex justify-center">
                        <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm">
                          <div className="flex items-center gap-3 text-gray-700">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                            <span className="font-medium">Loading more coupons...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Deals Only Tab */}
            {activeTab === 'deals' && dealsData.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-primary-600" />
                      Deals
                    </h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {dealsData.length} of {searchResults.total_deals}
                  </div>
                </div>

                <div className={`grid gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
                  }`}>
                  {dealsData.map((deal) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <NewDealCard
                        deal={deal}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                      />
                    </motion.div>
                  ))}
                </div>

              </div>
            )}

            {/* Coupons Only Tab */}
            {activeTab === 'coupons' && couponsData.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Tag className="w-6 h-6 text-green-600" />
                      Coupons
                    </h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {couponsData.length} of {searchResults.total_coupons}
                  </div>
                </div>

                <div className={`grid gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
                  }`}>
                  {couponsData.map((coupon) => (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CouponCard
                        coupon={coupon}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                      />
                    </motion.div>
                  ))}
                </div>

              </div>
            )}

            {/* No Results - Show Fallback Content */}
            {searchResults.total_results === 0 && (
              <div className="space-y-8">
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No exact matches found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any deals or coupons matching "{searchQuery}". Here are some popular deals and coupons you might like:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={clearAllFilters}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => window.history.back()}
                      className="bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Go Back
                    </button>
                  </div>
                </div>

                {/* Fallback: Popular Deals */}
                {fallbackContent?.deals && fallbackContent.deals.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-primary-600" />
                      Popular Deals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fallbackContent.deals.map((deal) => (
                        <NewDealCard key={deal.id} deal={deal} variant="compact" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback: Popular Coupons */}
                {fallbackContent?.coupons && fallbackContent.coupons.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Tag className="w-5 h-5 text-green-600" />
                      Popular Coupons
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fallbackContent.coupons.map((coupon) => (
                        <CouponCard key={coupon.id} coupon={coupon} variant="compact" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading state for fallback content */}
                {fallbackLoading && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                      <p>Loading popular content...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : null}

        {/* Global Loading Indicator - Shows at bottom when any content is loading */}
        {(dealsLoading || couponsLoading) && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-lg">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                <span className="font-medium">
                  {dealsLoading && couponsLoading
                    ? 'Loading more content...'
                    : dealsLoading
                      ? 'Loading more deals...'
                      : 'Loading more coupons...'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export default UnifiedSearchResults
