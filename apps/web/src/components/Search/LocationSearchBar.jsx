import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ChevronDown, Loader2, X, Tag, ShoppingBag, Building2 } from 'lucide-react'
import { useLocation } from '../../context/LocationContext'
import { useDebounce } from '../../hooks/useDebounce'
import { api } from '../../lib/api'

const LocationSearchBar = ({ 
  placeholder = "Search for deals",
  className = "",
  onSearch,
  showLocationSelector = true
}) => {
  const navigate = useNavigate()
  const { location, isLoading, error, getCurrentLocation, setManualLocation } = useLocation()
  const [query, setQuery] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const locationRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, 300)

  // Search suggestions
  const { data: suggestionsData = {}, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['navbar-search-suggestions', debouncedQuery],
    queryFn: () => api.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && showSuggestionsDropdown,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const suggestions = suggestionsData?.suggestions || []

  // Popular cities for manual selection
  const popularCities = [
    { name: 'New York, NY', state: 'NY', country: 'US' },
    { name: 'Los Angeles, CA', state: 'CA', country: 'US' },
    { name: 'Chicago, IL', state: 'IL', country: 'US' },
    { name: 'Houston, TX', state: 'TX', country: 'US' },
    { name: 'Phoenix, AZ', state: 'AZ', country: 'US' },
    { name: 'Philadelphia, PA', state: 'PA', country: 'US' },
    { name: 'San Antonio, TX', state: 'TX', country: 'US' },
    { name: 'San Diego, CA', state: 'CA', country: 'US' },
    { name: 'Dallas, TX', state: 'TX', country: 'US' },
    { name: 'San Jose, CA', state: 'CA', country: 'US' },
    { name: 'Austin, TX', state: 'TX', country: 'US' },
    { name: 'Jacksonville, FL', state: 'FL', country: 'US' },
    { name: 'Fort Worth, TX', state: 'TX', country: 'US' },
    { name: 'Columbus, OH', state: 'OH', country: 'US' },
    { name: 'Charlotte, NC', state: 'NC', country: 'US' },
    { name: 'San Francisco, CA', state: 'CA', country: 'US' },
    { name: 'Indianapolis, IN', state: 'IN', country: 'US' },
    { name: 'Seattle, WA', state: 'WA', country: 'US' },
    { name: 'Denver, CO', state: 'CO', country: 'US' },
    { name: 'Washington, DC', state: 'DC', country: 'US' }
  ]

  // Handle search submission
  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('q', searchQuery.trim())
      
      // Add location to search if available
      if (location) {
        searchParams.set('location', location.display)
        searchParams.set('lat', location.latitude)
        searchParams.set('lng', location.longitude)
      }

      if (onSearch) {
        onSearch(searchQuery.trim(), location)
      } else {
        navigate(`/search?${searchParams.toString()}`)
      }
      
      setQuery('')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  // Handle location selection
  const handleLocationSelect = (city) => {
    const locationData = {
      latitude: null, // We don't have exact coordinates for manual selection
      longitude: null,
      address: {
        city: city.name.split(',')[0],
        state: city.state,
        country: city.country,
        full: city.name,
        display: city.name
      },
      timestamp: Date.now()
    }
    
    setManualLocation(locationData)
    setShowLocationDropdown(false)
  }

  // Handle get current location
  const handleGetCurrentLocation = async () => {
    try {
      await getCurrentLocation()
      setShowLocationDropdown(false)
    } catch (error) {
      console.error('Failed to get location:', error)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false)
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestionsDropdown(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle suggestion selection
  const selectSuggestion = (suggestion) => {
    setQuery(suggestion.text)
    setShowSuggestionsDropdown(false)
    setSelectedSuggestionIndex(-1)
    handleSearch(suggestion.text)
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    
    if (value.length >= 2) {
      setShowSuggestionsDropdown(true)
    } else {
      setShowSuggestionsDropdown(false)
    }
    setSelectedSuggestionIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (showSuggestionsDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex])
        } else {
          handleSearch()
        }
      } else if (e.key === 'Escape') {
        setShowSuggestionsDropdown(false)
        setSelectedSuggestionIndex(-1)
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      } else if (e.key === 'Escape') {
        setShowLocationDropdown(false)
        setShowSuggestionsDropdown(false)
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Main Search Container */}
        <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-lg focus-within:shadow-xl focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-100 transition-all duration-300 overflow-visible backdrop-blur-sm">
          
          {/* Location Selector */}
          {showLocationSelector && (
            <div className="relative" ref={locationRef}>
              <button
                type="button"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border-r border-gray-300 text-left rounded-l-2xl group"
              >
                <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0 group-hover:text-primary-700 transition-colors" />
                <span className="text-sm font-semibold text-gray-800 max-w-32 truncate group-hover:text-gray-900 transition-colors">
                  {isLoading ? 'Getting location...' : 
                   location ? location.address.display : 
                   'Select location'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0 group-hover:text-primary-600 transition-colors" />
              </button>

              {/* Location Dropdown */}
              <AnimatePresence>
                {showLocationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto w-80 min-w-full"
                  >
                    {/* Current Location Option */}
                    <div className="p-3">
                      <button
                        onClick={handleGetCurrentLocation}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isLoading ? 'Getting your location...' : 'Use current location'}
                        </span>
                      </button>
                      
                      {error && (
                        <div className="px-3 py-2 text-xs text-red-600">
                          {error}
                        </div>
                      )}
                    </div>

                    {/* Popular Cities */}
                    <div className="border-t border-gray-100 p-3">
                      <div className="text-xs font-semibold text-gray-600 px-3 py-2 uppercase tracking-wide">
                        Popular Cities
                      </div>
                      {popularCities.map((city, index) => (
                        <button
                          key={`${city.name}-${index}`}
                          onClick={() => handleLocationSelect(city)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{city.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Search Input Section */}
          <div className="flex-1 flex items-center px-5 py-3">
            <Search className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.length >= 2) {
                  setShowSuggestionsDropdown(true)
                }
              }}
              placeholder={placeholder}
              className="flex-1 text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none text-base font-medium placeholder:font-normal focus:placeholder-gray-300 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setShowSuggestionsDropdown(false)
                  setSelectedSuggestionIndex(-1)
                }}
                className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-11 h-11 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            title="Search"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestionsDropdown && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm bg-white/95"
            >
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
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium flex items-center">
                              <Tag className="w-3 h-3 mr-1" />
                              Tag
                            </span>
                          )}
                          {suggestion.type === 'deal_title' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center">
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Deal
                            </span>
                          )}
                          {suggestion.type === 'merchant' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
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
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
}

export default LocationSearchBar
