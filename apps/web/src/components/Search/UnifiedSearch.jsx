import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Tag, Building2, Folder, Filter, SortAsc } from 'lucide-react'
import { api } from '../../lib/api'
import { useDebounce } from '../../hooks/useDebounce'

const UnifiedSearch = ({
  placeholder = "Search deals, coupons, companies, or tags...",
  showFilters = true,
  autoFocus = false,
  onResultClick = null,
  className = ""
}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || '',
    company: searchParams.get('company') || '',
    tags: searchParams.get('tags') ? searchParams.get('tags').split(',') : [],
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_discount: searchParams.get('min_discount') || '',
    has_coupon: searchParams.get('has_coupon') === 'true',
    featured: searchParams.get('featured') === 'true',
    sort: searchParams.get('sort') || 'relevance'
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Get search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => api.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Get popular searches
  const { data: popularSearches } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => api.getPopularSearches(10),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  // Get categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60 * 1000
  })

  // Get companies for filter dropdown
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 }),
    staleTime: 10 * 60 * 1000
  })

  // Handle search submission
  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    try {
      const params = new URLSearchParams()
      params.set('q', searchQuery.trim())

      // Add filters to URL
      Object.entries(selectedFilters).forEach(([key, value]) => {
        if (value && value !== '' && value !== false) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.set(key, value.join(','))
            }
          } else {
            params.set(key, value.toString())
          }
        }
      })

      setSearchParams(params)
      setShowSuggestions(false)

      // Navigate to search results
      if (onResultClick) {
        onResultClick(searchQuery.trim(), selectedFilters)
      } else {
        navigate(`/search?${params.toString()}`)
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'tag') {
      setQuery(prev => {
        const newQuery = prev.replace(/#[\w-]+/g, '').trim()
        return newQuery ? `${newQuery} #${suggestion.slug}` : `#${suggestion.slug}`
      })
    } else {
      setQuery(suggestion.name)
    }
    handleSearch(suggestion.name)
  }

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({
      type: 'all',
      category: '',
      company: '',
      tags: [],
      min_price: '',
      max_price: '',
      min_discount: '',
      has_coupon: false,
      featured: false,
      sort: 'relevance'
    })
  }

  // Remove specific filter
  const removeFilter = (key) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? [] : (key === 'type' ? 'all' : '')
    }))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Get active filters count
  const activeFiltersCount = Object.entries(selectedFilters).filter(([key, value]) => {
    if (key === 'type') return value !== 'all'
    if (Array.isArray(value)) return value.length > 0
    return value && value !== '' && value !== false
  }).length

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          disabled={isSearching}
          className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-white p-1.5 rounded-md transition-colors ${isSearching
            ? 'bg-primary-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700'
            }`}
          title="Search"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 rounded-lg p-4 space-y-4"
              >
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Type
                  </label>
                  <select
                    value={selectedFilters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
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
                    value={selectedFilters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
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
                    value={selectedFilters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Companies</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.slug}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      value={selectedFilters.min_price}
                      onChange={(e) => handleFilterChange('min_price', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      value={selectedFilters.max_price}
                      onChange={(e) => handleFilterChange('max_price', e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.has_coupon}
                      onChange={(e) => handleFilterChange('has_coupon', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has Coupon Code</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.featured}
                      onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Only</span>
                  </label>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={selectedFilters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || popularSearches) && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 px-3 py-2">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.id}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {suggestion.type === 'tag' && <Tag className="w-4 h-4 text-blue-500" />}
                    {suggestion.type === 'company' && <Building2 className="w-4 h-4 text-green-500" />}
                    {suggestion.type === 'category' && <Folder className="w-4 h-4 text-purple-500" />}
                    <span className="text-sm">{suggestion.display}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {popularSearches && (!query || query.length < 2) && (
              <div className="p-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 px-3 py-2">Popular</div>
                {popularSearches.popular_tags?.slice(0, 5).map((tag, index) => (
                  <button
                    key={`popular-tag-${tag.id}-${index}`}
                    onClick={() => handleSuggestionClick({ type: 'tag', name: tag.name, slug: tag.slug })}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Tag className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">#{tag.name}</span>
                  </button>
                ))}
                {popularSearches.popular_companies?.slice(0, 3).map((company, index) => (
                  <button
                    key={`popular-company-${company.id}-${index}`}
                    onClick={() => handleSuggestionClick({ type: 'company', name: company.name, slug: company.slug })}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{company.name}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UnifiedSearch
