/**
 * Advanced Search Interface Component
 * Enterprise-level search UI with intelligent features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Clock, 
  X, 
  Sparkles,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { api } from '../../lib/api'
import { useDebounce } from '../../hooks/useDebounce'

const AdvancedSearchInterface = ({ 
  onSearch, 
  placeholder = "Search deals, coupons, users, companies...",
  showFilters = true,
  showSuggestions = true,
  className = ""
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchInputRef = useRef(null)
  
  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  
  // Filter state
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'relevance',
    priceRange: [0, 1000],
    discountRange: [0, 100],
    hasImages: false,
    hasCoupons: false,
    isVerified: false,
    isFeatured: false
  })

  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, 300)

  // Search suggestions
  const { data: suggestionsData = {}, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => api.getSearchSuggestions(debouncedQuery),
    enabled: showSuggestions && debouncedQuery.length >= 2 && showSuggestionsDropdown,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const suggestions = suggestionsData?.suggestions || []

  // Trending searches - disabled for now since API endpoint doesn't exist
  const trending = []

  // Search analytics mutation
  const recordInteractionMutation = useMutation({
    mutationFn: (data) => api.post('/api/search/interaction', data),
    onError: (error) => console.error('Failed to record interaction:', error)
  })

  // Handle search execution
  const executeSearch = useCallback((searchQuery = query, searchFilters = filters) => {
    if (!searchQuery.trim()) return

    const params = new URLSearchParams()
    params.set('q', searchQuery.trim())
    
    if (searchFilters.type !== 'all') params.set('type', searchFilters.type)
    if (searchFilters.category) params.set('category', searchFilters.category)
    if (searchFilters.sort !== 'relevance') params.set('sort', searchFilters.sort)
    
    // Add other filters if they're not default values
    if (searchFilters.priceRange[1] < 1000) {
      params.set('max_price', searchFilters.priceRange[1])
    }
    if (searchFilters.discountRange[0] > 0) {
      params.set('min_discount', searchFilters.discountRange[0])
    }
    if (searchFilters.hasCoupons) params.set('has_coupon', 'true')
    if (searchFilters.isFeatured) params.set('featured', 'true')

    // Navigate to search results or call callback
    if (onSearch) {
      onSearch(searchQuery, searchFilters)
    } else {
      navigate(`/search?${params.toString()}`)
    }

    // Hide suggestions and record analytics
    setShowSuggestionsDropdown(false)
    setSelectedSuggestionIndex(-1)
    
    // Record search analytics
    recordInteractionMutation.mutate({
      query: searchQuery,
      resultType: 'search',
      resultId: 'search_executed',
      interactionType: 'search'
    })
  }, [query, filters, onSearch, navigate, recordInteractionMutation])

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestionsDropdown(value.length >= 2)
    setSelectedSuggestionIndex(-1)
  }

  // Handle suggestion selection
  const selectSuggestion = (suggestion) => {
    setQuery(suggestion.text)
    setShowSuggestionsDropdown(false)
    executeSearch(suggestion.text, filters)
    
    // Record suggestion usage
    recordInteractionMutation.mutate({
      query: suggestion.text,
      resultType: 'suggestion',
      resultId: suggestion.type,
      interactionType: 'click'
    })
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestionsDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        executeSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex])
        } else {
          executeSearch()
        }
        break
      
      case 'Escape':
        setShowSuggestionsDropdown(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setShowSuggestionsDropdown(false)
    setSelectedSuggestionIndex(-1)
    searchInputRef.current?.focus()
  }


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestionsDropdown(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className={`
          flex items-center bg-white border-2 rounded-2xl shadow-md transition-all duration-300 backdrop-blur-sm
          ${showSuggestionsDropdown || isExpanded 
            ? 'border-primary-500 shadow-xl ring-4 ring-primary-100 bg-gradient-to-r from-white to-primary-50/30' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
          }
        `}>
          <Search className="w-6 h-6 text-primary-500 ml-5 flex-shrink-0" />
          
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsExpanded(true)
              if (query.length >= 2) setShowSuggestionsDropdown(true)
            }}
            onBlur={() => setIsExpanded(false)}
            placeholder={placeholder}
            className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-400 border-0 rounded-2xl focus:outline-none focus:ring-0 text-lg font-medium placeholder:font-normal focus:placeholder-gray-300 transition-colors bg-transparent"
          />

          {/* Search Actions */}
          <div className="flex items-center space-x-2 px-4">
            {query && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            

            {showFilters && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all duration-200 hover:scale-110"
                title="Advanced Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => executeSearch()}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestionsDropdown && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm bg-white/95">
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className={`
                      w-full text-left px-4 py-3 hover:bg-gray-50 transition-all duration-200 group
                      ${index === selectedSuggestionIndex ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500' : 'text-gray-700 hover:border-l-2 hover:border-gray-200'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                        <span className="font-medium">{suggestion.text}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {suggestion.type === 'tag' && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                            Tag
                          </span>
                        )}
                        {suggestion.type === 'deal_title' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Deal
                          </span>
                        )}
                        {suggestion.type === 'merchant' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Store
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No suggestions found
              </div>
            ) : null}

          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && showFilters && (
        <div className="mt-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 shadow-inner backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search In
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Everything</option>
                <option value="deals">Deals Only</option>
                <option value="coupons">Coupons Only</option>
                <option value="users">Users Only</option>
                <option value="companies">Companies Only</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="discount">Best Discount</option>
              </select>
            </div>

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Filters
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasCoupons}
                    onChange={(e) => handleFilterChange('hasCoupons', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Coupons</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.isFeatured}
                    onChange={(e) => handleFilterChange('isFeatured', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Featured Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.isVerified}
                    onChange={(e) => handleFilterChange('isVerified', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Verified Only</span>
                </label>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advanced
              </label>
              <button
                onClick={() => executeSearch()}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearchInterface
