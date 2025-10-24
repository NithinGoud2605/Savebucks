/**
 * Advanced Search Interface Component
 * Enterprise-level search UI with intelligent features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
import { useLocation as useUserLocation } from '../../context/LocationContext'

const AdvancedSearchInterface = ({ 
  onSearch, 
  placeholder = "Search deals, coupons, users, companies...",
  showFilters = true,
  showSuggestions = true,
  className = "",
  compact = false,
  showLocationSelector = true
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchInputRef = useRef(null)
  const containerRef = useRef(null)
  const [dropdownRect, setDropdownRect] = useState(null)
  
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

  // Location state from context
  const { location: userLocation, isLoading: isLocating, error: locationError, getCurrentLocation, setManualLocation, clearLocation } = useUserLocation?.() || {}
  
  // Location dropdown state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationDropdownRect, setLocationDropdownRect] = useState(null)
  const [zipCode, setZipCode] = useState('')
  const locationButtonRef = useRef(null)
  const zipCodeInputRef = useRef(null)

  // Function to convert zipcode to coordinates
  const zipcodeToCoordinates = async (zipcode) => {
    try {
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`)
      const data = await response.json()
      
      if (data && data.places && data.places.length > 0) {
        const place = data.places[0]
        return {
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
          city: place['place name'],
          state: place.state,
          country: 'US'
        }
      }
      throw new Error('Invalid zip code')
    } catch (error) {
      console.error('Zipcode geocoding failed:', error)
      throw error
    }
  }

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

    // Attach location if available
    if (userLocation) {
      if (userLocation.display) params.set('location', userLocation.display)
      if (userLocation.latitude) params.set('lat', userLocation.latitude)
      if (userLocation.longitude) params.set('lng', userLocation.longitude)
    }

    // Navigate to search results or call callback
    if (onSearch) {
      onSearch(searchQuery, { ...searchFilters, location: userLocation })
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

  // Compute dropdown position when open
  useEffect(() => {
    if (!showSuggestionsDropdown) {
      setDropdownRect(null)
      return
    }
    const updateRect = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDropdownRect({
        left: rect.left,
        top: rect.bottom + 12, // 12px gap (mt-3)
        width: rect.width
      })
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [showSuggestionsDropdown])

  // Global keyboard shortcuts: '/' and Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleGlobalShortcut = (e) => {
      const target = e.target
      const isTypingContext = (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      )
      
      // '/' focuses search when not typing
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !isTypingContext) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Cmd/Ctrl + K focuses search anywhere
      if ((e.key.toLowerCase() === 'k') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    
    document.addEventListener('keydown', handleGlobalShortcut)
    return () => document.removeEventListener('keydown', handleGlobalShortcut)
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close suggestions dropdown
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestionsDropdown(false)
        setSelectedSuggestionIndex(-1)
      }
      
      // Close location dropdown when clicking outside
      // Check if click is outside both the container and the location dropdown portal
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target)
      const isOutsideLocationDropdown = !event.target.closest('[data-location-dropdown]')
      
      if (isOutsideContainer && isOutsideLocationDropdown) {
        setShowLocationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus zipcode input when dropdown opens
  useEffect(() => {
    if (showLocationDropdown && zipCodeInputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        zipCodeInputRef.current?.focus()
      }, 100)
    }
  }, [showLocationDropdown])

  // Professional UX sizing and styling
  const styles = {
    // Container styles
    container: compact 
      ? 'rounded-full shadow-lg hover:shadow-xl border border-mint-200/70 bg-gradient-to-r from-white/95 via-mint-50/40 to-emerald-50/30 backdrop-blur-sm' 
      : 'rounded-2xl shadow-xl hover:shadow-2xl border-2 border-mint-200/70 bg-gradient-to-r from-white via-mint-50/30 to-emerald-50/20 backdrop-blur-sm',
    
    // Focus states
    containerFocused: compact
      ? 'border-mint-400 shadow-xl ring-4 ring-mint-100/60 bg-gradient-to-r from-white via-mint-50/50 to-emerald-50/40'
      : 'border-mint-500 shadow-2xl ring-4 ring-mint-100/70 bg-gradient-to-r from-white via-mint-50/40 to-emerald-50/30',
    
    // Location button
    locationBtn: compact
      ? 'ml-3 mr-2 px-3 py-1.5 text-xs bg-gradient-to-r from-mint-50/80 to-emerald-50/60 hover:from-mint-100 hover:to-emerald-100 border border-mint-200/60 rounded-full transition-all duration-200 hover:shadow-md'
      : 'ml-4 mr-3 px-4 py-2 text-sm bg-gradient-to-r from-mint-50 to-emerald-50 hover:from-mint-100 hover:to-emerald-100 border border-mint-200 rounded-full transition-all duration-200 hover:shadow-lg',
    
    // Search icon
    searchIcon: compact 
      ? 'w-4 h-4 text-mint-500 ml-3' 
      : 'w-5 h-5 text-mint-600 ml-5',
    
    // Input field
    input: compact
      ? 'flex-1 px-3 py-3 text-sm placeholder-mint-500 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium min-w-0'
      : 'flex-1 px-4 py-4 text-base placeholder-mint-500 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium min-w-0',
    
    // Action buttons
    clearBtn: compact
      ? 'p-1.5 text-mint-400 hover:text-mint-600 hover:bg-mint-100/80 rounded-full transition-all duration-200'
      : 'p-2 text-mint-400 hover:text-mint-600 hover:bg-mint-100 rounded-full transition-all duration-200 hover:scale-105',
    
    filterBtn: compact
      ? 'p-1.5 text-mint-400 hover:text-mint-600 hover:bg-mint-50 rounded-full transition-all duration-200'
      : 'p-2 text-mint-400 hover:text-mint-600 hover:bg-mint-50 rounded-full transition-all duration-200 hover:scale-105',
    
    searchBtn: compact
      ? 'px-3 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0'
      : 'px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0',
    // Dropdown (very high z-index to overlay everything)
    dropdown: 'absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-lg border border-gray-200/60 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-y-auto',
    
    // Suggestion items
    suggestion: 'w-full text-left px-4 py-3 hover:bg-gray-50/80 transition-all duration-150 group border-l-2 border-transparent hover:border-gray-200',
    suggestionActive: 'bg-primary-50/80 text-primary-800 border-l-2 border-primary-500'
  }

  return (
    <div className={`relative ${className}`}>
      

      {/* Main Search Bar */}
      <div className="relative" ref={containerRef}>
        <div 
          className={`
            flex items-center transition-all duration-300 
            ${styles.container}
            ${(showSuggestionsDropdown || isExpanded) ? styles.containerFocused : ''}
          `}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showSuggestionsDropdown}
          aria-label="Search interface"
        >
          {/* Location Selector */}
          {showLocationSelector && (
            <div className="relative">
              <button
                ref={locationButtonRef}
                type="button"
                onClick={() => {
                  if (locationButtonRef.current) {
                    const rect = locationButtonRef.current.getBoundingClientRect()
                    setLocationDropdownRect({
                      left: rect.left,
                      top: rect.bottom + 8,
                      width: 320
                    })
                  }
                  setShowLocationDropdown(!showLocationDropdown)
                }}
                className={`${styles.locationBtn} inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-800 whitespace-nowrap group`}
                title={`Current location: ${userLocation?.address?.display || zipCode || 'Not set'}`}
                aria-label="Set search location"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 group-hover:text-primary-600 transition-colors`}
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="font-medium truncate max-w-16 sm:max-w-20 lg:max-w-24 text-xs sm:text-sm">
                  {isLocating ? 'Locating…' : (userLocation?.address?.display?.split(',')[0] || zipCode || 'Anywhere')}
                </span>
                <ChevronDown className={`${compact ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3 h-3 sm:w-4 sm:h-4'} text-gray-400 transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
              </button>

            </div>
          )}

          <Search className={`${styles.searchIcon} flex-shrink-0`} />
          
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
            className={`${styles.input} placeholder:transition-colors focus:placeholder-gray-400 text-sm sm:text-base`}
            aria-autocomplete="list"
            aria-label="Search for deals, coupons, users, companies"
          />

          {/* Search Actions */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 px-1 sm:px-2 lg:px-3 flex-shrink-0">
            {query && (
              <button
                onClick={clearSearch}
                className={styles.clearBtn}
                title="Clear search (Esc)"
                aria-label="Clear search"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}

            {showFilters && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={styles.filterBtn}
                title="Advanced filters"
                aria-label="Toggle advanced filters"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}

            <button
              onClick={() => executeSearch()}
              className={`${styles.searchBtn} text-xs sm:text-sm px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5`}
              disabled={!query.trim()}
              aria-label="Execute search"
            >
              <span className="hidden sm:inline">Search</span>
              <Search className="w-3 h-3 sm:hidden" />
            </button>
          </div>
        </div>

        {/* Location Dropdown - Portal to body */}
        {showLocationDropdown && locationDropdownRect && createPortal(
          <div
            data-location-dropdown
            onClick={(e) => e.stopPropagation()}
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] p-4"
            style={{ 
              left: Math.max(8, locationDropdownRect.left), 
              top: locationDropdownRect.top,
              width: Math.min(locationDropdownRect.width, window.innerWidth - 16)
            }}
          >
            <div className="space-y-3">
              {/* Current Location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <button
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    try {
                      if (navigator.geolocation) {
                        const position = await new Promise((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                          })
                        })
                        
                        if (getCurrentLocation) {
                          getCurrentLocation()
                        }
                        setShowLocationDropdown(false)
                      } else {
                        alert('Location not supported')
                      }
                    } catch (error) {
                      if (error.code === 1) {
                        alert('Location denied - use zip code')
                      } else {
                        alert('Location failed - use zip code')
                      }
                    }
                  }}
                  disabled={isLocating}
                  className="w-full flex items-center justify-between p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium text-emerald-700">
                      {isLocating ? 'Getting...' : 'Use Current Location'}
                    </span>
                  </div>
                  {userLocation?.display && (
                    <span className="text-xs text-emerald-600 truncate max-w-24">
                      {userLocation.display}
                    </span>
                  )}
                </button>
              </div>

              {/* Zip Code Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zip Code</label>
                <div className="flex gap-1">
                  <input
                    ref={zipCodeInputRef}
                    type="tel"
                    value={zipCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setZipCode(value)
                    }}
                    placeholder="12345"
                    className="flex-1 px-2 py-1.5 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-black"
                    maxLength={5}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    autoFocus={false}
                  />
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (zipCode.trim() && zipCode.length >= 5) {
                        try {
                          // Convert zipcode to coordinates and set location
                          const coordinates = await zipcodeToCoordinates(zipCode)
                          if (coordinates) {
                            // Create location object similar to what LocationContext expects
                            const locationData = {
                              latitude: coordinates.lat,
                              longitude: coordinates.lng,
                              address: {
                                display: `${coordinates.city}, ${coordinates.state}`,
                                city: coordinates.city,
                                state: coordinates.state,
                                country: coordinates.country,
                                full: `${coordinates.city}, ${coordinates.state}`,
                              },
                              timestamp: Date.now()
                            }
                            
                            // Set the location using LocationContext
                            if (setManualLocation) {
                              setManualLocation(locationData)
                            } else {
                              // Fallback to localStorage if context not available
                              localStorage.setItem('userLocation', JSON.stringify(locationData))
                            }
                          }
                          setShowLocationDropdown(false)
                        } catch (error) {
                          alert('Invalid zip code')
                        }
                      } else {
                        alert('Enter valid zip code')
                      }
                    }}
                    disabled={!zipCode.trim() || zipCode.length < 5}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded text-xs font-medium transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>


              {/* Clear Location */}
              {(userLocation?.address?.display || zipCode) && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setZipCode('')
                    if (clearLocation) {
                      clearLocation()
                    }
                    setShowLocationDropdown(false)
                  }}
                  className="w-full px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* Search Suggestions Dropdown - Portal to body */}
        {showSuggestionsDropdown && dropdownRect && createPortal(
          <div
            className="fixed bg-white/95 backdrop-blur-lg border border-gray-200/60 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-y-auto"
            style={{ 
              left: Math.max(8, dropdownRect.left), 
              top: dropdownRect.top, 
              width: Math.min(dropdownRect.width, window.innerWidth - 16),
              maxWidth: '90vw'
            }}
          >
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                <span className="ml-3 text-gray-600 font-medium">Finding suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100/60">
                  Suggestions
                </div>
                <div className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      className={`
                        ${styles.suggestion}
                        ${index === selectedSuggestionIndex ? styles.suggestionActive : ''}
                      `}
                      role="option"
                      aria-selected={index === selectedSuggestionIndex}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Search className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                          <span className="font-medium text-gray-900 group-hover:text-gray-800">{suggestion.text}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {suggestion.type === 'tag' && (
                            <span className="px-2 py-1 bg-primary-100/80 text-primary-700 text-xs rounded-full font-medium">
                              Tag
                            </span>
                          )}
                          {suggestion.type === 'deal_title' && (
                            <span className="px-2 py-1 bg-teal-100/80 text-teal-700 text-xs rounded-full font-medium">
                              Deal
                            </span>
                          )}
                          {suggestion.type === 'merchant' && (
                            <span className="px-2 py-1 bg-blue-100/80 text-blue-700 text-xs rounded-full font-medium">
                              Store
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : query.length >= 2 ? (
              <div className="px-4 py-6 text-center">
                <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No suggestions found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : null}
          </div>,
          document.body
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
