import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Container } from '../components/Layout/Container'
import { DealCard } from '../components/Deal/DealCard'
import { TagChips } from '../components/Deal/TagChips'
import { AdSlot } from '../components/AdSlot'
import { SkeletonList } from '../components/Loader/Skeleton'
import { NoDealsFound } from '../components/EmptyState'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { useAdsense } from '../lib/useAdsense'
import { formatPrice } from '../lib/format'
import { clsx } from 'clsx'

// Advanced sort options with algorithms
const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot 🔥', description: 'Trending deals based on votes and activity' },
  { value: 'new', label: 'New 🆕', description: 'Most recent deals' },
  { value: 'top', label: 'Top ⭐', description: 'Highest voted deals' },
  { value: 'price_low', label: 'Price: Low to High 💰', description: 'Cheapest deals first' },
  { value: 'price_high', label: 'Price: High to Low 💎', description: 'Most expensive deals first' },
  { value: 'expiring', label: 'Expiring Soon ⏰', description: 'Deals ending soon' },
  { value: 'discussed', label: 'Most Discussed 💬', description: 'Most commented deals' },
]

// View modes for different layouts
const VIEW_MODES = [
  { value: 'comfortable', label: 'Comfortable', icon: '☰', description: 'Spacious layout with full details' },
  { value: 'compact', label: 'Compact', icon: '≡', description: 'Dense layout showing more deals' },
  { value: 'grid', label: 'Grid', icon: '▦', description: 'Card grid layout' },
]

// Deal categories for filtering
const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Garden', 'Health & Beauty', 'Sports & Outdoors',
  'Books', 'Toys & Games', 'Automotive', 'Food & Beverages', 'Travel', 'Services'
]

// Price ranges for filtering
const PRICE_RANGES = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: '$250+', min: 250, max: 10000 },
]

export default function ListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  
  // Enhanced state management with URL sync
  const [selectedTags, setSelectedTags] = useState(() => {
    const tags = searchParams.get('tags')
    return tags ? tags.split(',') : []
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'hot')
  const [viewMode, setViewMode] = useState(() => {
    return searchParams.get('view') || localStorage.getItem('viewMode') || 'comfortable'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    categories: searchParams.get('categories')?.split(',') || [],
    merchants: searchParams.get('merchants')?.split(',') || [],
    minRating: parseInt(searchParams.get('minRating')) || 0,
    includeExpired: searchParams.get('expired') === 'true',
    freeOnly: searchParams.get('free') === 'true',
    hasImage: searchParams.get('image') === 'true',
    localDeals: searchParams.get('local') === 'true',
  })
  
  // User preferences from localStorage
  const [userPrefs, setUserPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userPrefs') || '{}')
    } catch {
      return {}
    }
  })
  
  const [savedSearches, setSavedSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedSearches') || '[]')
    } catch {
      return []
    }
  })
  
  const [followedMerchants, setFollowedMerchants] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('followedMerchants') || '[]')
    } catch {
      return []
    }
  })
  
  const [dealAlerts, setDealAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dealAlerts') || '[]')
    } catch {
      return []
    }
  })
  
  useAdsense()
  
  const tab = location.pathname === '/new' ? 'new' : 
              location.pathname === '/trending' ? 'trending' : 'hot'

  // Enhanced infinite query with advanced parameters
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['deals', tab, sortBy, searchQuery, selectedTags, filters],
    queryFn: ({ pageParam = 1 }) => api.getDeals({ 
      tab, 
      sort: sortBy,
      search: searchQuery,
      tags: selectedTags,
      filters,
      page: pageParam,
      limit: 20
    }),
    getNextPageParam: (lastPage, pages) => {
      // Mock pagination logic - in real app would come from API
      if (!lastPage?.data || lastPage.data.length < 20) return undefined
      return pages.length + 1
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
  
  const deals = useMemo(() => {
    return data?.pages?.flatMap(page => page?.data || []) || []
  }, [data])

  // Get unique tags for filtering with counts
  const allTags = useMemo(() => {
    const tagCounts = new Map()
    deals.forEach(deal => {
      if (deal.merchant) {
        tagCounts.set(deal.merchant, (tagCounts.get(deal.merchant) || 0) + 1)
      }
      if (deal.category) {
        tagCounts.set(deal.category, (tagCounts.get(deal.category) || 0) + 1)
      }
    })
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Show top 20 tags
  }, [deals])

  // Advanced filtering with multiple criteria
  const filteredDeals = useMemo(() => {
    if (!deals.length) return []
    
    let filtered = deals
    
    // Tag filtering
    if (selectedTags.length > 0) {
      filtered = filtered.filter(deal => 
        selectedTags.some(tag => 
          deal.merchant === tag || deal.category === tag
        )
      )
    }
    
    // Category filtering
    if (filters.categories.length > 0) {
      filtered = filtered.filter(deal => 
        filters.categories.includes(deal.category)
      )
    }
    
    // Price filtering
    if (filters.freeOnly) {
      filtered = filtered.filter(deal => deal.price === 0)
    } else if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      filtered = filtered.filter(deal => {
        const price = deal.price || 0
        return price >= filters.priceRange[0] && price <= filters.priceRange[1]
      })
    }
    
    // Rating filtering
    if (filters.minRating > 0) {
      filtered = filtered.filter(deal => (deal.rating || 0) >= filters.minRating)
    }
    
    // Image filtering
    if (filters.hasImage) {
      filtered = filtered.filter(deal => deal.image_url)
    }
    
    // Expired filtering
    if (!filters.includeExpired) {
      filtered = filtered.filter(deal => deal.status !== 'expired')
    }
    
    return filtered
  }, [deals, selectedTags, filters])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('q', searchQuery)
    if (sortBy !== 'hot') params.set('sort', sortBy)
    if (viewMode !== 'comfortable') params.set('view', viewMode)
    if (selectedTags.length) params.set('tags', selectedTags.join(','))
    if (filters.categories.length) params.set('categories', filters.categories.join(','))
    if (filters.merchants.length) params.set('merchants', filters.merchants.join(','))
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString())
    if (filters.includeExpired) params.set('expired', 'true')
    if (filters.freeOnly) params.set('free', 'true')
    if (filters.hasImage) params.set('image', 'true')
    if (filters.localDeals) params.set('local', 'true')
    
    const newSearch = params.toString()
    if (newSearch !== searchParams.toString()) {
      navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}`, { replace: true })
    }
  }, [searchQuery, sortBy, viewMode, selectedTags, filters, location.pathname, navigate])

  // Handlers
  const handleTagClick = useCallback((tag) => {
    setSelectedTags(current => 
      current.includes(tag) 
        ? current.filter(t => t !== tag)
        : [...current, tag]
    )
  }, [])

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort)
    // Refetch with new sort immediately
    refetch()
  }, [refetch])

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode)
    localStorage.setItem('viewMode', mode)
  }, [])

  const handleSaveSearch = useCallback(async () => {
    const searchName = await new Promise((resolve) => {
      const name = prompt('Save this search as:', `${tab} deals`)
      resolve(name)
    })
    
    if (searchName) {
      const newSearch = {
        id: Date.now(),
        name: searchName,
        query: searchQuery,
        sort: sortBy,
        tags: selectedTags,
        filters,
        tab,
        createdAt: new Date().toISOString(),
      }
      
      const updated = [...savedSearches, newSearch]
      setSavedSearches(updated)
      localStorage.setItem('savedSearches', JSON.stringify(updated))
      toast.success('Search saved successfully!')
    }
  }, [searchQuery, sortBy, selectedTags, filters, tab, savedSearches, toast])

  const handleLoadSavedSearch = useCallback((search) => {
    setSearchQuery(search.query || '')
    setSortBy(search.sort || 'hot')
    setSelectedTags(search.tags || [])
    setFilters(search.filters || {})
    toast.success(`Loaded search: ${search.name}`)
  }, [toast])

  const handleClearFilters = useCallback(() => {
    setSelectedTags([])
    setFilters({
      priceRange: [0, 1000],
      categories: [],
      merchants: [],
      minRating: 0,
      includeExpired: false,
      freeOnly: false,
      hasImage: false,
      localDeals: false,
    })
    setSearchQuery('')
    toast.success('Filters cleared')
  }, [toast])

  // Infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage()
      }
    })
    
    const target = document.querySelector('#load-more-trigger')
    if (target) observer.observe(target)
    
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Set page meta with dynamic content
  useEffect(() => {
    const titles = {
      hot: 'Hot Deals',
      new: 'New Deals', 
      trending: 'Trending Deals'
    }
    
    let description = `Discover the best ${tab} deals and save money with our community-driven platform.`
    
    if (searchQuery) {
      description = `Search results for "${searchQuery}" - ${filteredDeals.length} deals found.`
    }
    
    if (selectedTags.length > 0) {
      description += ` Filtered by: ${selectedTags.join(', ')}.`
    }
    
    setPageMeta({
      title: searchQuery ? `"${searchQuery}" - ${titles[tab]}` : titles[tab],
      description,
    })
  }, [tab, searchQuery, selectedTags, filteredDeals.length])

  if (error) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Deals</h3>
            <p className="text-gray-600 mb-4">
              We're having trouble loading deals right now. Please try again.
            </p>
          </div>
          <button 
            onClick={() => refetch()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {tab === 'hot' && 'Hot Deals 🔥'}
              {tab === 'new' && 'New Deals 🆕'}  
              {tab === 'trending' && 'Trending Deals 📈'}
            </h1>
            
            {/* Real-time deal count */}
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {filteredDeals.length.toLocaleString()} deals
            </span>
          </div>
          
          <p className="text-gray-600">
            {tab === 'hot' && 'The most popular deals right now'}
            {tab === 'new' && 'Latest deals from our community'}
            {tab === 'trending' && 'Deals gaining momentum'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleViewModeChange(mode.value)}
                className={clsx(
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  viewMode === mode.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title={mode.description}
              >
                <span className="mr-1">{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="input pr-10 appearance-none bg-white"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'btn flex items-center space-x-2',
              showFilters || Object.values(filters).some(f => 
                Array.isArray(f) ? f.length > 0 : f > 0 || f === true
              ) ? 'btn-primary' : 'btn-secondary'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f > 0 || f === true) && (
              <span className="bg-red-500 text-white rounded-full w-2 h-2"></span>
            )}
          </button>

          {/* Save Search */}
          <button
            onClick={handleSaveSearch}
            className="btn-ghost flex items-center space-x-2"
            title="Save current search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, stores, products..."
            className="input pl-10 pr-20 w-full"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                refetch()
              }
            }}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button className="text-gray-400 hover:text-gray-600 text-sm">
              ⌘K
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-gray-900">
               Advanced Filters
             </h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Price Range
              </label>
              <div className="space-y-2">
                {PRICE_RANGES.map((range) => (
                  <label key={range.label} className="flex items-center">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={filters.priceRange[0] === range.min && filters.priceRange[1] === range.max}
                      onChange={() => setFilters(f => ({ ...f, priceRange: [range.min, range.max] }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Categories
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, categories: [...f.categories, category] }))
                        } else {
                          setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== category) }))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Deal Options */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Deal Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.freeOnly}
                    onChange={(e) => setFilters(f => ({ ...f, freeOnly: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Free Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasImage}
                    onChange={(e) => setFilters(f => ({ ...f, hasImage: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Has Image</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeExpired}
                    onChange={(e) => setFilters(f => ({ ...f, includeExpired: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Expired</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.localDeals}
                    onChange={(e) => setFilters(f => ({ ...f, localDeals: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Local Deals</span>
                </label>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedTags.length > 0 || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f > 0 || f === true)) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tag}
                    <button
                      onClick={() => handleTagClick(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.freeOnly && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free Only
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Popular Tags
            </h2>
            <button
              onClick={() => setSelectedTags([])}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={clsx(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <span>{tag}</span>
                <span className="ml-1 text-xs opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
        <div>
          Showing {filteredDeals.length.toLocaleString()} of {deals.length.toLocaleString()} deals
          {searchQuery && ` for "${searchQuery}"`}
        </div>
        
        {savedSearches.length > 0 && (
          <button
            onClick={() => setShowSavedSearches(!showSavedSearches)}
            className="flex items-center space-x-1 hover:text-gray-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Saved Searches ({savedSearches.length})</span>
          </button>
        )}
      </div>

      {/* Saved Searches Panel */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Saved Searches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSearches.map((search) => (
              <button
                key={search.id}
                onClick={() => handleLoadSavedSearch(search)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{search.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {search.query && `"${search.query}"`}
                  {search.tags?.length > 0 && ` • ${search.tags.length} tags`}
                  {search.sort !== 'hot' && ` • ${search.sort}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Deal Feed */}
      {isLoading ? (
        <SkeletonList count={8} />
      ) : filteredDeals.length === 0 ? (
        <NoDealsFound searchQuery={searchQuery} />
      ) : (
        <div className={clsx(
          viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'
        )}>
          {filteredDeals.map((deal, index) => (
            <div key={deal.id}>
              <DealCard 
                deal={deal} 
                compact={viewMode === 'compact'}
                enhanced={viewMode === 'comfortable'}
              />
              
              {/* Strategic Ad Placement */}
              {viewMode !== 'grid' && (index + 1) % 7 === 0 && (
                <div className="my-8">
                  <AdSlot size="banner" />
                </div>
              )}
              
              {/* Native ads in grid */}
              {viewMode === 'grid' && (index + 1) % 9 === 0 && (
                <div className="md:col-span-2 lg:col-span-3 my-4">
                  <AdSlot size="leaderboard" />
                </div>
              )}
            </div>
          ))}
          
          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div id="load-more-trigger" className="py-8 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading more deals...</span>
                </div>
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="btn-primary"
                >
                  Load More Deals
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Bottom Ad */}
      <div className="mt-12">
        <AdSlot size="rectangle" />
      </div>
    </Container>
  )
}
