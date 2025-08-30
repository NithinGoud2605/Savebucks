import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

export function AdvancedSearch({ isOpen, onClose, onSearch }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    merchant: searchParams.get('merchant') || '',
    min_discount: searchParams.get('min_discount') || '',
    max_price: searchParams.get('max_price') || '',
    has_coupon: searchParams.get('has_coupon') === 'true',
    sort: searchParams.get('sort') || 'hot'
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => api.getCategories({ include_subcategories: true }),
    staleTime: 10 * 60 * 1000,
  })

  const popularMerchants = [
    'Amazon', 'Walmart', 'Target', 'Best Buy', 'Home Depot',
    'Macy\'s', 'Nike', 'Apple', 'Samsung', 'Dell'
  ]

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Build search params
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value.toString())
      }
    })
    
    // Navigate to search results
    const searchUrl = `/search?${params.toString()}`
    navigate(searchUrl)
    
    if (onSearch) {
      onSearch(filters)
    }
    
    if (onClose) {
      onClose()
    }
  }

  const handleReset = () => {
    setFilters({
      search: '',
      category_id: '',
      merchant: '',
      min_discount: '',
      max_price: '',
      has_coupon: false,
      sort: 'hot'
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== false && value !== 'hot'
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Advanced Search
            </h3>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Query */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Search for deals
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search deals, products, brands..."
                className="input w-full"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Category
              </label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                className="input w-full"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <optgroup key={category.id} label={category.name}>
                    <option value={category.id}>{category.name}</option>
                    {category.subcategories?.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;{sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Merchant Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Store/Brand
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.merchant}
                  onChange={(e) => handleFilterChange('merchant', e.target.value)}
                  placeholder="Enter store name or select from popular..."
                  className="input w-full"
                  list="merchants"
                />
                <datalist id="merchants">
                  {popularMerchants.map(merchant => (
                    <option key={merchant} value={merchant} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Price and Discount Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Maximum Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    placeholder="100"
                    min="0"
                    step="0.01"
                    className="input w-full pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Minimum Discount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={filters.min_discount}
                    onChange={(e) => handleFilterChange('min_discount', e.target.value)}
                    placeholder="50"
                    min="0"
                    max="100"
                    className="input w-full pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">%</span>
                </div>
              </div>
            </div>

            {/* Quick Discount Filters */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Quick Filters
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '25% Off', value: '25' },
                  { label: '50% Off', value: '50' },
                  { label: '75% Off', value: '75' },
                  { label: 'Under $10', price: '10' },
                  { label: 'Under $25', price: '25' },
                  { label: 'Under $50', price: '50' }
                ].map(filter => (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={() => {
                      if (filter.value) {
                        handleFilterChange('min_discount', filter.value)
                      }
                      if (filter.price) {
                        handleFilterChange('max_price', filter.price)
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      (filter.value && filters.min_discount === filter.value) ||
                      (filter.price && filters.max_price === filter.price)
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-white border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon Filter */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.has_coupon}
                  onChange={(e) => handleFilterChange('has_coupon', e.target.checked)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">
                  Only deals with coupon codes
                </span>
              </label>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Sort by
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input w-full"
              >
                <option value="hot">Hottest Deals</option>
                <option value="new">Newest First</option>
                <option value="trending">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasActiveFilters}
                className="text-sm text-secondary-600 hover:text-secondary-800 disabled:text-secondary-400 disabled:cursor-not-allowed"
              >
                Reset Filters
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-6 py-2"
                >
                  Search Deals
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

