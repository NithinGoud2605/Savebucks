import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import DealCard from '../components/DealCard'
import { Skeleton } from '../components/Loader/Skeleton'
import { formatPrice, dateAgo } from '../lib/format'

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    merchant: searchParams.get('merchant') || '',
    min_discount: searchParams.get('min_discount') || '',
    max_price: searchParams.get('max_price') || '',
    has_coupon: searchParams.get('has_coupon') || '',
    sort: searchParams.get('sort') || 'newest'
  })

  const {
    data: deals,
    isLoading,
    error
  } = useQuery({
    queryKey: ['search', filters],
    queryFn: () => api.listDeals(filters),
    enabled: !!filters.search || !!filters.category || !!filters.merchant
  })

  const {
    data: categories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  })

  useEffect(() => {
    const newParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) newParams.set(key, value)
    })
    setSearchParams(newParams)
  }, [filters, setSearchParams])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      merchant: '',
      min_discount: '',
      max_price: '',
      has_coupon: '',
      sort: 'newest'
    })
  }

  if (error) {
    return (
      <Container>
        <div className="py-8 text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Search Error</h1>
          <p className="text-secondary-600">Unable to load search results. Please try again.</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Search Results
            {filters.search && (
              <span className="text-secondary-600 font-normal"> for "{filters.search}"</span>
            )}
          </h1>
          {deals && (
            <p className="text-secondary-600">
              Found {deals.length} deal{deals.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search deals..."
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  placeholder="Enter max price"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Min Discount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Min Discount %
                </label>
                <input
                  type="number"
                  value={filters.min_discount}
                  onChange={(e) => handleFilterChange('min_discount', e.target.value)}
                  placeholder="Enter min discount"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Has Coupon */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.has_coupon === 'true'}
                    onChange={(e) => handleFilterChange('has_coupon', e.target.checked ? 'true' : '')}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-secondary-700">Has Coupon Code</span>
                </label>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : deals && deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-secondary-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No deals found</h3>
                <p className="text-secondary-600 mb-4">
                  Try adjusting your search criteria or browse our latest deals.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Browse All Deals
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export default SearchResults
