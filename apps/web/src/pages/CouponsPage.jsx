import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/Loader/Skeleton'
import { 
  TagIcon, 
  ClockIcon, 
  FireIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const CouponsPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    category: '',
    type: '',
    sort: 'newest'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Fetch coupons
  const { data: coupons, isLoading, error } = useQuery({
    queryKey: ['coupons', filters],
    queryFn: () => api.listCoupons(filters),
    staleTime: 2 * 60 * 1000
  })

  // Fetch companies and categories for filters
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 })
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      company: '',
      category: '',
      type: '',
      sort: 'newest'
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'sort' && value !== ''
  )

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: ClockIcon },
    { value: 'expiring', label: 'Expiring Soon', icon: ClockIcon },
    { value: 'popular', label: 'Most Popular', icon: FireIcon },
    { value: 'success_rate', label: 'Best Success Rate', icon: TagIcon }
  ]

  const couponTypes = [
    { value: '', label: 'All Types' },
    { value: 'percentage', label: 'Percentage Off' },
    { value: 'fixed_amount', label: 'Fixed Amount Off' },
    { value: 'free_shipping', label: 'Free Shipping' },
    { value: 'bogo', label: 'Buy One Get One' },
    { value: 'other', label: 'Other' }
  ]

  if (error) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Error Loading Coupons</h1>
          <p className="text-secondary-600 mb-8">
            We couldn't load the coupons. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Coupons & Promo Codes</h1>
            <p className="text-secondary-600">
              Find the best coupon codes and save money on your favorite brands
            </p>
          </div>
          
          <Link
            to="/post-coupon"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Submit Coupon
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search coupons, brands, or codes..."
              className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Sort */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-secondary-700">Sort by:</span>
              <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('sort', option.value)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      filters.sort === option.value
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
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Company Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company
                  </label>
                  <select
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Companies</option>
                    {companies?.map(company => (
                      <option key={company.id} value={company.slug}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {categories?.filter(cat => !cat.parent_id).map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Coupon Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {couponTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
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
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : coupons && coupons.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-secondary-600">
                Found {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <TagIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No coupons found
            </h3>
            <p className="text-secondary-600 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters or check back later for new coupons.'
                : 'Be the first to submit a coupon!'
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
                to="/post-coupon"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit a Coupon
              </Link>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

const CouponCard = ({ coupon }) => {
  const formatDiscount = () => {
    switch (coupon.coupon_type) {
      case 'percentage':
        return `${coupon.discount_value}% OFF`
      case 'fixed_amount':
        return `$${coupon.discount_value} OFF`
      case 'free_shipping':
        return 'FREE SHIPPING'
      case 'bogo':
        return 'BUY ONE GET ONE'
      default:
        return 'SPECIAL OFFER'
    }
  }

  const formatExpiry = () => {
    if (!coupon.expires_at) return null
    const expiryDate = new Date(coupon.expires_at)
    const now = new Date()
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return 'Expires tomorrow'
    if (diffDays <= 7) return `Expires in ${diffDays} days`
    return `Expires ${expiryDate.toLocaleDateString()}`
  }

  const expiryInfo = formatExpiry()
  const isExpiringSoon = expiryInfo && (expiryInfo.includes('today') || expiryInfo.includes('tomorrow') || expiryInfo.includes('days'))

  return (
    <Link
      to={`/coupon/${coupon.id}`}
      className="group block bg-white rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-all duration-200 hover:border-primary-300 overflow-hidden"
    >
      {/* Company Header */}
      <div className="p-4 border-b border-secondary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {coupon.companies?.logo_url ? (
              <img
                src={coupon.companies.logo_url}
                alt={coupon.companies.name}
                className="w-8 h-8 rounded object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-secondary-200 rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-secondary-600">
                  {coupon.companies?.name?.[0] || '?'}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600">
                {coupon.companies?.name || 'Unknown Company'}
              </h3>
              {coupon.companies?.is_verified && (
                <span className="text-xs text-primary-600 font-medium">✓ Verified</span>
              )}
            </div>
          </div>
          
          {coupon.is_exclusive && (
            <span className="px-2 py-1 bg-warning-100 text-warning-800 text-xs font-medium rounded">
              Exclusive
            </span>
          )}
        </div>
      </div>

      {/* Coupon Content */}
      <div className="p-4">
        {/* Discount Badge */}
        <div className="text-center mb-4">
          <div className="inline-block px-4 py-2 bg-primary-600 text-white font-bold text-lg rounded-lg">
            {formatDiscount()}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
          {coupon.title}
        </h4>

        {/* Description */}
        {coupon.description && (
          <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
            {coupon.description}
          </p>
        )}

        {/* Coupon Code */}
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary-500 uppercase">Code</span>
            <span className="font-mono font-bold text-secondary-900">
              {coupon.coupon_code}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-secondary-500 mb-3">
          <span>{coupon.used_count || 0} uses</span>
          {coupon.success_rate && (
            <span>{coupon.success_rate}% success rate</span>
          )}
          <span>{coupon.votes?.score || 0} votes</span>
        </div>

        {/* Expiry */}
        {expiryInfo && (
          <div className={`text-xs px-2 py-1 rounded ${
            isExpiringSoon 
              ? 'bg-warning-100 text-warning-800' 
              : 'bg-secondary-100 text-secondary-600'
          }`}>
            {expiryInfo}
          </div>
        )}
      </div>
    </Link>
  )
}

export default CouponsPage
