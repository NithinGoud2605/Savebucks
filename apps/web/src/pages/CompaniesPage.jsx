import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  CheckBadgeIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  TagIcon,
  FireIcon,
  ClockIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { formatCompactNumber, dateAgo } from '../lib/format'
import CompanySubmissionForm from '../components/Company/CompanySubmissionForm'

const CompaniesPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    verified: false,
    sort: 'name'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showCompanyForm, setShowCompanyForm] = useState(false)

  // Fetch companies
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies-listings', filters],
    queryFn: () => api.getCompanyListings(filters),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch company categories
  const { data: categories } = useQuery({
    queryKey: ['company-categories'],
    queryFn: () => api.getCompanyCategories(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  // Set page meta
  React.useEffect(() => {
    setPageMeta({
      title: 'Companies & Merchants - Find Deals and Coupons',
      description: 'Browse verified companies and merchants to find the best deals, discounts, and coupons. Save money on your purchases.',
      keywords: ['companies', 'merchants', 'deals', 'coupons', 'discounts', 'savings'],
      canonical: '/companies'
    })
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      verified: false,
      sort: 'name'
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) =>
    key !== 'sort' && value !== '' && value !== false
  )

  const sortOptions = [
    { value: 'name', label: 'Name A-Z', icon: BuildingOfficeIcon },
    { value: 'deals', label: 'Most Deals', icon: TagIcon },
    { value: 'coupons', label: 'Most Coupons', icon: FireIcon },
    { value: 'popularity', label: 'Most Popular', icon: EyeIcon },
    { value: 'rating', label: 'Highest Rated', icon: StarIcon },
    { value: 'newest', label: 'Newest', icon: ClockIcon }
  ]

  const CompanyCard = ({ company }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-mint-300 group"
    >
      <Link to={`/company/${company.slug}?tab=coupons`} className="block">
        <div className="p-6">
          {/* Company Header */}
          <div className="flex items-start space-x-4 mb-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-16 h-16 rounded-lg object-contain bg-white p-2 border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-mint-100 to-emerald-100 flex items-center justify-center border border-gray-200">
                  <BuildingOfficeIcon className="w-8 h-8 text-mint-600" />
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-mint-700 transition-colors">
                  {company.name}
                </h3>
                {company.is_verified && (
                  <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>

              {company.category_name && (
                <span className="inline-block px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
                  {company.category_name}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {company.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-mint-600">
                {company.deals_count || 0}
              </div>
              <div className="text-xs text-gray-500">Deals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-mint-600">
                {company.coupons_count || 0}
              </div>
              <div className="text-xs text-gray-500">Coupons</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-mint-600">
                {formatCompactNumber(company.total_views || 0)}
              </div>
              <div className="text-xs text-gray-500">Views</div>
            </div>
          </div>

          {/* Rating */}
          {company.rating && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">
                  {company.rating}/5
                </span>
                {company.total_reviews && (
                  <span className="text-xs text-gray-500">
                    ({formatCompactNumber(company.total_reviews)})
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {company.website_url && 'Visit Site →'}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )

  if (isLoading) {
    return (
      <Container>
        <div className="py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="py-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            Error Loading Companies
          </h1>
          <p className="text-secondary-600 mb-6">
            Unable to load company data. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Container>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-12 sm:pt-14 lg:pt-16">
      <Container>
        <div className="py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Companies & Merchants
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover verified companies and merchants offering the best deals, discounts, and coupons.
              Save money on your purchases with trusted brands.
            </p>

            {/* Add Company Button */}
            <div className="mt-6">
              <button
                onClick={() => setShowCompanyForm(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-mint-500 to-emerald-600 text-white rounded-lg hover:from-mint-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add New Company</span>
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Can't find a company? Add it to our database!
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-8 shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="w-full">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex-1 sm:w-48">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  >
                    <option value="">All Categories</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="flex-1 sm:w-48">
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Verified Filter */}
              <div className="sm:w-auto">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    className="w-4 h-4 text-mint-600 border-gray-300 rounded focus:ring-mint-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Verified Only
                  </span>
                </label>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-secondary-600">Active filters:</span>
                  {filters.search && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      Search: "{filters.search}"
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-2 text-primary-600 hover:text-primary-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      Category: {categories?.find(cat => cat.slug === filters.category)?.name || filters.category}
                      <button
                        onClick={() => handleFilterChange('category', '')}
                        className="ml-2 text-primary-600 hover:text-primary-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {filters.verified && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      Verified Only
                      <button
                        onClick={() => handleFilterChange('verified', false)}
                        className="ml-2 text-primary-600 hover:text-primary-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>

                <button
                  onClick={clearFilters}
                  className="text-sm text-secondary-600 hover:text-secondary-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">
                {companies?.length || 0} Companies Found
              </h2>

              {companies && companies.length > 0 && (
                <div className="text-sm text-secondary-600">
                  Showing {companies.length} companies
                </div>
              )}
            </div>
          </div>

          {/* Companies Grid */}
          {companies && companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                No Companies Found
              </h3>
              <p className="text-secondary-600 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find more companies.'
                  : 'No companies are available at the moment.'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Company Submission Modal */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CompanySubmissionForm
              onCompanyCreated={(company) => {
                setShowCompanyForm(false)
                // Optionally refresh the companies list
                // You could invalidate the query here
              }}
              onCancel={() => setShowCompanyForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CompaniesPage
