import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Tag,
  Store,
  Loader2 
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function ModernSearchBar({ className = '', placeholder = "Search deals, coupons, stores..." }) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)
  const navigate = useNavigate()

  // Debounced search suggestions
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [query])

  // Fetch search suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => api.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 5 * 60 * 1000
  })

  // Recent searches (mock data - you'd fetch from localStorage or API)
  const recentSearches = [
    'iPhone 15 deals',
    'Nike shoes discount',
    'Samsung TV',
    'Laptop deals'
  ]

  // Trending searches (mock data - you'd fetch from API)
  const trendingSearches = [
    'Black Friday deals',
    'Christmas gifts',
    'Winter jackets',
    'Gaming laptop'
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setQuery('')
      setShowSuggestions(false)
      searchRef.current?.blur()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  const clearSearch = () => {
    setQuery('')
    searchRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Search Icon */}
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          {/* Input Field */}
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              setShowSuggestions(true)
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              w-full h-12 pl-12 pr-24 rounded-2xl border-2 bg-white
              text-gray-900 placeholder:text-gray-500
              transition-all duration-200
              ${isFocused 
                ? 'border-primary-500 shadow-lg shadow-primary-500/20' 
                : 'border-gray-200 hover:border-gray-300'
              }
              focus:outline-none
            `}
          />

          {/* Actions */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Clear Button */}
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                type="button"
                onClick={clearSearch}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </motion.button>
            )}
            
            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              <span className="sr-only">Search</span>
            </motion.button>
          </div>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            {/* Loading State */}
            {isLoading && query.length > 1 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            )}

            {/* Search Results */}
            {!isLoading && suggestions && query.length > 1 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Search Results
                </h3>
                <div className="space-y-1">
                  {suggestions.deals?.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => navigate(`/deal/${deal.id}`)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {deal.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deal.store} • ${deal.price}
                        </p>
                      </div>
                    </button>
                  ))}
                  
                  {suggestions.stores?.slice(0, 2).map((store) => (
                    <button
                      key={store.id}
                      onClick={() => navigate(`/store/${store.slug}`)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <Store className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {store.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {store.deal_count} deals available
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                {(suggestions.deals?.length > 3 || suggestions.stores?.length > 2) && (
                  <button
                    onClick={() => handleSearch()}
                    className="w-full mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all results →
                  </button>
                )}
              </div>
            )}

            {/* Default Suggestions (when no query) */}
            {(!query || query.length <= 1) && (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Recent Searches
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(search)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-700"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending Now
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {trendingSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(search)}
                        className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                      >
                        <Sparkles className="w-3 h-3 text-orange-500" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}