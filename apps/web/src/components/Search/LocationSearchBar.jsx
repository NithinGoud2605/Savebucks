import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ChevronDown, Loader2, X } from 'lucide-react'
import { useLocation } from '../../context/LocationContext'

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
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const locationRef = useRef(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowLocationDropdown(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Main Search Container */}
        <div className="relative flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-blue-500 transition-all duration-200 overflow-visible">
          
          {/* Location Selector */}
          {showLocationSelector && (
            <div className="relative" ref={locationRef}>
              <button
                type="button"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-r border-gray-200 text-left rounded-l-full"
              >
                <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                  {isLoading ? 'Getting location...' : 
                   location ? location.address.display : 
                   'Select location'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
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
          <div className="flex-1 flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none text-base font-normal"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-full flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LocationSearchBar
