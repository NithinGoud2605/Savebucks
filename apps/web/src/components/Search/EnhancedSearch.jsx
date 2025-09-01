import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { api } from '../../lib/api'
import { Card } from '../ui/Card'
import { Button, IconButton } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { useDebounce } from '../../hooks/useDebounce'

export const EnhancedSearch = ({ 
  className,
  placeholder = "Search deals, coupons, brands...",
  showSuggestions = true,
  showFilters = false,
  onSearch,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)

  // Get search suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => api.searchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && showSuggestions,
    staleTime: 5 * 60 * 1000
  })

  // Popular searches
  const popularSearches = [
    'Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Sports',
    'Books', 'Toys', 'Automotive', 'Food', 'Travel'
  ]

  // Handle search submission
  const handleSubmit = (searchQuery = query) => {
    if (searchQuery.trim()) {
      const finalQuery = searchQuery.trim()
      navigate(`/search?q=${encodeURIComponent(finalQuery)}`)
      onSearch?.(finalQuery)
      setIsOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return

    const items = suggestions.length > 0 ? suggestions : popularSearches
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? items.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const selectedItem = typeof items[selectedIndex] === 'string' 
            ? items[selectedIndex] 
            : items[selectedIndex].title || items[selectedIndex].name
          handleSubmit(selectedItem)
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div className={clsx('relative w-full max-w-2xl', className)} ref={inputRef}>
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Icon name="search" size="md" color="muted" />
        </div>
        
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            'w-full h-14 pl-12 pr-20 rounded-2xl border-2 transition-all duration-200',
            'bg-white text-secondary-900 placeholder:text-secondary-400',
            'border-secondary-200 hover:border-secondary-300',
            'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 focus:outline-none',
            'shadow-lg hover:shadow-xl focus:shadow-2xl'
          )}
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-14 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <Icon name="close" size="sm" />
          </button>
        )}

        {/* Search button */}
        <Button
          variant="primary"
          size="md"
          onClick={() => handleSubmit()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
        >
          <Icon name="search" size="sm" color="white" />
        </Button>
      </div>

      {/* Search dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-2xl border-2 border-secondary-200 max-h-96 overflow-hidden">
              {/* Loading state */}
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="loader" size="sm" className="animate-spin" />
                    <span className="text-sm text-secondary-600">Searching...</span>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && !isLoading && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                    Suggestions
                  </div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSubmit(suggestion.title || suggestion.name || suggestion)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                          'hover:bg-primary-50 hover:text-primary-900',
                          selectedIndex === index && 'bg-primary-50 text-primary-900'
                        )}
                      >
                        <Icon 
                          name={suggestion.type === 'deal' ? 'tag' : suggestion.type === 'brand' ? 'star' : 'search'} 
                          size="sm" 
                          color="muted" 
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">
                            {suggestion.title || suggestion.name || suggestion}
                          </div>
                          {suggestion.category && (
                            <div className="text-xs text-secondary-500">
                              in {suggestion.category}
                            </div>
                          )}
                        </div>
                        {suggestion.count && (
                          <Badge variant="secondary" size="xs">
                            {suggestion.count}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular searches */}
              {suggestions.length === 0 && !isLoading && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                    Popular Searches
                  </div>
                  <div className="space-y-1">
                    {popularSearches.map((search, index) => (
                      <button
                        key={search}
                        onClick={() => handleSubmit(search)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                          'hover:bg-secondary-50 hover:text-secondary-900',
                          selectedIndex === index && 'bg-secondary-50 text-secondary-900'
                        )}
                      >
                        <Icon name="trendingUp" size="sm" color="muted" />
                        <span className="font-medium text-sm">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick filters */}
              {showFilters && (
                <div className="p-4 border-t border-secondary-100">
                  <div className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
                    Quick Filters
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-primary-50">
                      Free Shipping
                    </Badge>
                    <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-success-50">
                      50% Off+
                    </Badge>
                    <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-warning-50">
                      Ending Soon
                    </Badge>
                    <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-danger-50">
                      Hot Deals
                    </Badge>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact search component for navbar
export const CompactSearch = ({ className, ...props }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={clsx('relative', className)}>
      {!isExpanded ? (
        <IconButton
          icon="search"
          variant="ghost"
          size="md"
          onClick={() => setIsExpanded(true)}
          className="text-secondary-600 hover:text-secondary-900"
        />
      ) : (
        <motion.div
          initial={{ width: 40 }}
          animate={{ width: 300 }}
          exit={{ width: 40 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute right-0 top-0"
        >
          <EnhancedSearch
            autoFocus
            className="w-full"
            placeholder="Search..."
            onSearch={() => setIsExpanded(false)}
          />
        </motion.div>
      )}
    </div>
  )
}

export default EnhancedSearch
