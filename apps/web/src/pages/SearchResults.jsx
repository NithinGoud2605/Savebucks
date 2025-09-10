import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import AdvancedSearchInterface from '../components/Search/AdvancedSearchInterface'
import EnterpriseSearchResults from '../components/Search/EnterpriseSearchResults'

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || '',
    company: searchParams.get('company') || '',
    min_discount: searchParams.get('min_discount') || '',
    max_price: searchParams.get('max_price') || '',
    has_coupon: searchParams.get('has_coupon') || '',
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 20
  })

  // Enterprise search query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['enterprise-search', filters],
    queryFn: () => api.search(filters),
    enabled: !!filters.q || !!filters.category || !!filters.company,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  // Analytics mutation for tracking interactions
  const recordInteractionMutation = useMutation({
    mutationFn: (data) => api.post('/api/search/interaction', data),
    onError: (error) => console.error('Failed to record interaction:', error)
  })

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all' && value !== 'relevance' && value !== 1 && value !== 20) {
        newParams.set(key, value.toString())
      }
    })
    
    // Always include the query if it exists
    if (filters.q) {
      newParams.set('q', filters.q)
    }
    
    const newUrl = newParams.toString()
    const currentUrl = searchParams.toString()
    
    if (newUrl !== currentUrl) {
      setSearchParams(newParams)
    }
  }, [filters, setSearchParams, searchParams])

  // Handle search from the search interface
  const handleSearch = (query, searchFilters) => {
    const newFilters = {
      ...filters,
      q: query,
      ...searchFilters,
      page: 1 // Reset to first page on new search
    }
    setFilters(newFilters)
  }

  // Handle filter changes from results component
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page on filter change
    }))
  }

  // Handle result interactions for analytics
  const handleInteraction = (interactionData) => {
    recordInteractionMutation.mutate(interactionData)
  }

  return (
    <Container>
      <div className="py-6 space-y-6">
        {/* Advanced Search Interface */}
        <AdvancedSearchInterface
          onSearch={handleSearch}
          showFilters={true}
          showSuggestions={true}
          className="sticky top-4 z-10 bg-white"
        />

        {/* Enterprise Search Results */}
        <EnterpriseSearchResults
          searchResults={searchResults}
          isLoading={isLoading}
          error={error}
          query={filters.q}
          onInteraction={handleInteraction}
          onFilterChange={handleFilterChange}
        />

      </div>
    </Container>
  )
}

export default SearchResults