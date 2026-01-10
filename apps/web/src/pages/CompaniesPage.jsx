import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Search,
  Filter,
  Star,
  BadgeCheck,
  Eye,
  Tag,
  Flame,
  Clock,
  X,
  Plus,
  ChevronDown,
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  ExternalLink
} from 'lucide-react'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { formatCompactNumber, dateAgo } from '../lib/format'
import CompanySubmissionForm from '../components/Company/CompanySubmissionForm'

// Sort options with icons
const SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z', icon: Building2 },
  { value: 'deals', label: 'Most Deals', icon: Tag },
  { value: 'coupons', label: 'Most Coupons', icon: Flame },
  { value: 'popularity', label: 'Most Popular', icon: Eye },
  { value: 'rating', label: 'Highest Rated', icon: Star },
  { value: 'newest', label: 'Newest', icon: Clock }
]

// Animated company card
const CompanyCard = ({ company, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    layout
  >
    <Link
      to={`/company/${company.slug}?tab=coupons`}
      className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-violet-200 transition-all duration-300"
    >
      {/* Header with logo */}
      <div className="relative p-5 pb-3">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {company.logo_url ? (
              <motion.img
                src={company.logo_url}
                alt={company.name}
                className="w-14 h-14 rounded-xl object-contain bg-white p-2 border border-slate-100 group-hover:scale-105 transition-transform"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center border border-slate-100">
                <Building2 className="w-7 h-7 text-violet-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                {company.name}
              </h3>
              {company.is_verified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>

            {company.category_name && (
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {company.category_name}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <p className="mt-3 text-sm text-slate-500 line-clamp-2">
            {company.description}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-slate-900">{company.deals_count || 0}</span>
              <span className="text-xs text-slate-500">deals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-slate-900">{company.coupons_count || 0}</span>
              <span className="text-xs text-slate-500">coupons</span>
            </div>
          </div>

          {company.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span className="text-sm font-medium text-slate-700">{company.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </Link>
  </motion.div>
)

// Filter chip component
const FilterChip = ({ label, onRemove }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
  >
    {label}
    <button onClick={onRemove} className="hover:text-violet-900 transition-colors">
      <X className="w-3.5 h-3.5" />
    </button>
  </motion.span>
)

// Main component
const CompaniesPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    verified: false,
    sort: 'name'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  // Fetch companies
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies-listings', filters],
    queryFn: () => api.getCompanyListings(filters),
    staleTime: 5 * 60 * 1000
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['company-categories'],
    queryFn: () => api.getCompanyCategories(),
    staleTime: 10 * 60 * 1000
  })

  // Set page meta
  React.useEffect(() => {
    setPageMeta({
      title: 'Companies & Merchants - Find Deals and Coupons | SaveBucks',
      description: 'Browse verified companies and merchants for the best deals, discounts, and coupons.',
      canonical: '/companies'
    })
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ search: '', category: '', verified: false, sort: 'name' })
  }

  const hasActiveFilters = filters.search || filters.category || filters.verified

  // Skeleton loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16">
        <Container>
          <div className="py-8 space-y-6">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16">
        <Container>
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Companies</h1>
            <p className="text-slate-600 mb-6">Unable to load company data</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-14">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 text-white">
        <Container>
          <div className="py-10 md:py-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Companies & Merchants
              </h1>
              <p className="text-lg text-violet-100 mb-6">
                Discover verified companies offering the best deals, discounts, and coupons. Save money with trusted brands.
              </p>

              {/* Add Company CTA */}
              <motion.button
                onClick={() => setShowCompanyForm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add New Company
              </motion.button>
            </motion.div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-6">
          {/* Search & Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="appearance-none w-full lg:w-48 px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none w-full lg:w-44 px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 bg-white"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Verified Toggle */}
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                />
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Verified Only</span>
              </label>
            </div>

            {/* Active Filters */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap"
                >
                  <span className="text-sm text-slate-500">Active filters:</span>

                  {filters.search && (
                    <FilterChip
                      label={`"${filters.search}"`}
                      onRemove={() => handleFilterChange('search', '')}
                    />
                  )}

                  {filters.category && (
                    <FilterChip
                      label={categories?.find(c => c.slug === filters.category)?.name || filters.category}
                      onRemove={() => handleFilterChange('category', '')}
                    />
                  )}

                  {filters.verified && (
                    <FilterChip
                      label="Verified Only"
                      onRemove={() => handleFilterChange('verified', false)}
                    />
                  )}

                  <button
                    onClick={clearFilters}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium ml-auto"
                  >
                    Clear all
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {companies?.length || 0} Companies Found
            </h2>
          </div>

          {/* Companies Grid */}
          {companies && companies.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <AnimatePresence>
                {companies.map((company, i) => (
                  <CompanyCard key={company.id} company={company} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Companies Found</h3>
              <p className="text-slate-600 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find more companies.'
                  : 'No companies are available at the moment.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </Container>

      {/* Company Submission Modal */}
      <AnimatePresence>
        {showCompanyForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCompanyForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CompanySubmissionForm
                onCompanyCreated={() => setShowCompanyForm(false)}
                onCancel={() => setShowCompanyForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CompaniesPage
