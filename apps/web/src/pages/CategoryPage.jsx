import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import { NewDealCard } from '../components/Deal/NewDealCard'
import { Skeleton } from '../components/ui/Skeleton'
import { ChevronRightIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { TagIcon, FireIcon, ClockIcon } from '@heroicons/react/24/solid'

const CategoryPage = () => {
  const { slug } = useParams()
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState({
    min_discount: '',
    max_price: '',
    has_coupon: false,
    merchant: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Get category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.getCategory(slug),
    enabled: !!slug
  })

  // Get deals for this category
  const { data: deals, isLoading: dealsLoading, error } = useQuery({
    queryKey: ['deals', 'category', slug, sortBy, filters],
    queryFn: () => api.listDeals({
      category: slug,
      sort: sortBy,
      ...filters
    }),
    enabled: !!slug
  })

  // Get subcategories
  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', category?.id],
    queryFn: () => api.getCategories({ parent_id: category?.id }),
    enabled: !!category?.id
  })

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: ClockIcon },
    { value: 'popular', label: 'Most Popular', icon: FireIcon },
    { value: 'discount', label: 'Highest Discount', icon: TagIcon }
  ]

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      min_discount: '',
      max_price: '',
      has_coupon: false,
      merchant: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  )

  if (categoryLoading) {
    return (
      <Container>
        <div className="py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (!category) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Category Not Found</h1>
          <p className="text-secondary-600 mb-8">
            The category you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse All Deals
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <Link to="/categories" className="hover:text-primary-600">Categories</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-secondary-900 font-medium">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color }}
            >
              <span className="text-white text-xl">
                {category.icon || category.name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">{category.name}</h1>
              <p className="text-secondary-600 mt-1">{category.description}</p>
            </div>
          </div>

          {/* Subcategories */}
          {subcategories && subcategories.length > 0 && (
            <div className="bg-secondary-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-secondary-900 mb-3">Browse by subcategory:</h3>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/category/${sub.slug}`}
                    className="inline-flex items-center px-3 py-1 bg-white border border-secondary-200 rounded-full text-sm text-secondary-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-secondary-700">Sort by:</span>
            <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    sortBy === option.value
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-secondary-300 text-secondary-700 hover:border-secondary-400'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-secondary-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Min Discount */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Min Discount %
                </label>
                <input
                  type="number"
                  value={filters.min_discount}
                  onChange={(e) => handleFilterChange('min_discount', e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Merchant */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Merchant
                </label>
                <input
                  type="text"
                  value={filters.merchant}
                  onChange={(e) => handleFilterChange('merchant', e.target.value)}
                  placeholder="e.g. Amazon"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Has Coupon */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary-700">
                  Has Coupon Code
                </label>
                <input
                  type="checkbox"
                  checked={filters.has_coupon}
                  onChange={(e) => handleFilterChange('has_coupon', e.target.checked)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {dealsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-secondary-600 mb-4">Failed to load deals</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : deals && deals.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-secondary-600">
                Found {deals.length} deal{deals.length !== 1 ? 's' : ''} in {category.name}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal, index) => (
                <NewDealCard key={deal.id} deal={deal} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <span 
                className="text-2xl"
                style={{ color: category.color }}
              >
                {category.icon || category.name[0]}
              </span>
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No deals found in {category.name}
            </h3>
            <p className="text-secondary-600 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters or check back later for new deals.'
                : 'Be the first to post a deal or coupon in this category!'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:border-secondary-400 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/post"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Post Deal/Coupon
              </Link>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export default CategoryPage
