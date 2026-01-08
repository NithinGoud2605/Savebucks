import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  StarIcon,
  CheckBadgeIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ClockIcon,
  TruckIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  GiftIcon,
  SparklesIcon,
  FireIcon,
  TagIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  PhotoIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { Container } from '../components/Layout/Container'
import { NewDealCard } from '../components/Deal/NewDealCard'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { formatCompactNumber } from '../lib/format'
import CouponCard from '../components/Coupon/CouponCard'

const CompanyPage = () => {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [couponSearch, setCouponSearch] = useState('')
  const [couponTypeFilter, setCouponTypeFilter] = useState('all')

  // Fetch comprehensive company data
  const { data: companyData, isLoading, error } = useQuery({
    queryKey: ['company-full', slug],
    queryFn: () => api.getCompanyFull(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  useEffect(() => {
    if (companyData?.company) {
      const company = companyData.company
      setPageMeta({
        title: company.meta_title || `${company.name} - Deals & Coupons`,
        description: company.meta_description || `Find the best deals, discounts, and coupons from ${company.name}. Save money on your purchases with verified offers.`,
        keywords: company.meta_keywords || [company.name, 'deals', 'coupons', 'discounts', 'savings'],
        ogImage: company.banner_image || company.logo_url,
        canonical: company.canonical_url || `/company/${company.slug}`
      })
    }
  }, [companyData, slug])

  // Initialize tab from URL once and ensure URL contains a tab value
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (tabParam && ['overview', 'deals', 'coupons', 'about'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else {
      params.set('tab', 'overview')
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
    }
    // run only on mount for initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTab = (tabId) => {
    if (tabId === activeTab) return
    setActiveTab(tabId)
    const params = new URLSearchParams(location.search)
    params.set('tab', tabId)
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
  }

  if (isLoading) {
    return (
      <Container>
        <div className="py-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error || !companyData) {
    return (
      <Container>
        <div className="py-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            Company Not Found
          </h1>
          <p className="text-secondary-600 mb-6">
            The company you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </Container>
    )
  }

  const { company, deals, coupons } = companyData
  const stats = company?.stats || { total_deals: 0, total_coupons: 0, total_views: 0, total_clicks: 0 }
  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'deals', label: 'Deals', count: stats.total_deals },
    { id: 'coupons', label: 'Coupons', count: stats.total_coupons },
    { id: 'about', label: 'About', count: null }
  ]

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Company Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-secondary-200 text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.total_deals}</div>
          <div className="text-sm text-secondary-600">Active Deals</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-secondary-200 text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.total_coupons}</div>
          <div className="text-sm text-secondary-600">Active Coupons</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-secondary-200 text-center">
          <div className="text-2xl font-bold text-primary-600">{formatCompactNumber(stats.total_views)}</div>
          <div className="text-sm text-secondary-600">Total Views</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-secondary-200 text-center">
          <div className="text-2xl font-bold text-primary-600">{formatCompactNumber(stats.total_clicks)}</div>
          <div className="text-sm text-secondary-600">Total Clicks</div>
        </div>
      </div>

      {/* Featured Deals & Coupons */}
      {deals.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">
            Featured Deals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.slice(0, 6).map((deal, index) => (
              <NewDealCard key={deal.id} deal={deal} index={index} />
            ))}
          </div>
          {deals.length > 6 && (
            <div className="text-center mt-6">
              <Link
                to={`/company/${slug}?tab=deals`}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                View All {deals.length} Deals
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
        </div>
      )}

      {coupons.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">
            Featured Coupons
          </h3>
          <div className="space-y-4">
            {coupons.slice(0, 6).map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} variant="modern" />
            ))}
          </div>
          {coupons.length > 6 && (
            <div className="text-center mt-6">
              <Link
                to={`/company/${slug}?tab=coupons`}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                View All {coupons.length} Coupons
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderDeals = () => (
    <div className="space-y-6">
      {deals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal, index) => (
            <div
              key={deal.id}
              className="bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group hover:border-mint-300"
            >
              <Link to={`/deal/${deal.id}`} className="block">
                <div className="p-4">
                  {/* Deal Image */}
                  <div className="w-full h-48 rounded-lg bg-white border border-gray-200 p-3 flex items-center justify-center mb-4">
                    {deal.image_url || deal.featured_image ? (
                      <img
                        src={deal.image_url || deal.featured_image}
                        alt={deal.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mint-100 to-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-4xl">🎁</span>
                      </div>
                    )}
                  </div>

                  {/* Deal Content */}
                  <div className="space-y-3">
                    {/* Deal Title */}
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-mint-700 transition-colors">
                      {deal.title}
                    </h3>

                    {/* Price and Discount */}
                    {deal.price !== undefined && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-mint-700">
                            {deal.price === 0 ? 'FREE' : `$${deal.price}`}
                          </span>
                          {deal.original_price && deal.original_price > deal.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${deal.original_price}
                            </span>
                          )}
                        </div>

                        {/* Discount Badge */}
                        {deal.discount_percentage && (
                          <div className="px-2 py-1 bg-red-100 text-red-700 text-sm font-bold rounded">
                            -{deal.discount_percentage}%
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deal Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{deal.views_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Deals Available
          </h3>
          <p className="text-gray-600">
            This company doesn't have any active deals at the moment.
          </p>
        </div>
      )}
    </div>
  )

  const renderCoupons = () => {
    // Filter coupons based on search and type
    const filteredCoupons = coupons.filter(coupon => {
      const matchesSearch = !couponSearch ||
        coupon.title.toLowerCase().includes(couponSearch.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(couponSearch.toLowerCase()) ||
        coupon.coupon_code?.toLowerCase().includes(couponSearch.toLowerCase())

      const matchesType = couponTypeFilter === 'all' || coupon.coupon_type === couponTypeFilter

      return matchesSearch && matchesType
    })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-secondary-900">
            All Coupons ({filteredCoupons.length})
          </h3>
          <div className="flex items-center space-x-2 text-sm text-secondary-600">
            <CursorArrowRaysIcon className="w-4 h-4" />
            <span>{formatCompactNumber(stats.total_clicks)} total clicks</span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search coupons..."
              value={couponSearch}
              onChange={(e) => setCouponSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={couponTypeFilter}
              onChange={(e) => setCouponTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage Off</option>
              <option value="fixed_amount">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
        </div>

        {filteredCoupons.length > 0 ? (
          <div className="space-y-4">
            {filteredCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} variant="modern" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <GiftIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {coupons.length === 0 ? 'No Coupons Available' : 'No Coupons Match Your Search'}
            </h3>
            <p className="text-secondary-600">
              {coupons.length === 0
                ? "This company doesn't have any active coupons at the moment."
                : "Try adjusting your search terms or filters."
              }
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderAbout = () => (
    <div className="space-y-8">
      {/* Company Information */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.founded_year && (
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-secondary-400" />
              <div>
                <div className="text-sm font-medium text-secondary-900">Founded</div>
                <div className="text-sm text-secondary-600">{company.founded_year}</div>
              </div>
            </div>
          )}

          {company.headquarters && (
            <div className="flex items-center space-x-3">
              <MapPinIcon className="w-5 h-5 text-secondary-400" />
              <div>
                <div className="text-sm font-medium text-secondary-900">Headquarters</div>
                <div className="text-sm text-secondary-600">{company.headquarters}</div>
              </div>
            </div>
          )}

          {company.employee_count && (
            <div className="flex items-center space-x-3">
              <UsersIcon className="w-5 h-5 text-secondary-400" />
              <div>
                <div className="text-sm font-medium text-secondary-900">Employees</div>
                <div className="text-sm text-secondary-600">{company.employee_count}</div>
              </div>
            </div>
          )}

          {company.revenue_range && (
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="w-5 h-5 text-secondary-400" />
              <div>
                <div className="text-sm font-medium text-secondary-900">Revenue</div>
                <div className="text-sm text-secondary-600">{company.revenue_range}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      {company.contact_info && Object.keys(company.contact_info).length > 0 && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            {company.contact_info.phone && (
              <div className="flex items-center space-x-3">
                <PhoneIcon className="w-5 h-5 text-secondary-400" />
                <a
                  href={`tel:${company.contact_info.phone}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {company.contact_info.phone}
                </a>
              </div>
            )}

            {company.contact_info.email && (
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-secondary-400" />
                <a
                  href={`mailto:${company.contact_info.email}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {company.contact_info.email}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Hours */}
      {company.business_hours && Object.keys(company.business_hours).length > 0 && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Business Hours
          </h3>
          <div className="space-y-2">
            {Object.entries(company.business_hours).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-sm font-medium text-secondary-900 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-sm text-secondary-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {company.payment_methods && company.payment_methods.length > 0 && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Payment Methods
          </h3>
          <div className="flex flex-wrap gap-2">
            {company.payment_methods.map((method) => (
              <span
                key={method}
                className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
              >
                {method.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Information */}
      {company.shipping_info && Object.keys(company.shipping_info).length > 0 && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Shipping Information
          </h3>
          <div className="space-y-3">
            {Object.entries(company.shipping_info).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3">
                <TruckIcon className="w-5 h-5 text-secondary-400" />
                <div>
                  <div className="text-sm font-medium text-secondary-900 capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-secondary-600">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Policy */}
      {company.return_policy && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Return Policy
          </h3>
          <p className="text-secondary-700">{company.return_policy}</p>
        </div>
      )}

      {/* Customer Service */}
      {company.customer_service && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Customer Service
          </h3>
          <p className="text-secondary-700">{company.customer_service}</p>
        </div>
      )}

      {/* Ratings & Reviews */}
      {(company.trustpilot_rating || company.app_store_rating || company.play_store_rating) && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Ratings & Reviews
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {company.trustpilot_rating && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">{company.trustpilot_rating}</span>
                </div>
                <div className="text-sm text-secondary-600">Trustpilot</div>
                {company.trustpilot_reviews_count && (
                  <div className="text-xs text-secondary-500">
                    {formatCompactNumber(company.trustpilot_reviews_count)} reviews
                  </div>
                )}
              </div>
            )}

            {company.app_store_rating && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">{company.app_store_rating}</span>
                </div>
                <div className="text-sm text-secondary-600">App Store</div>
              </div>
            )}

            {company.play_store_rating && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">{company.play_store_rating}</span>
                </div>
                <div className="text-sm text-secondary-600">Play Store</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications & Awards */}
      {((company.certifications && company.certifications.length > 0) ||
        (company.awards && company.awards.length > 0)) && (
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Certifications & Awards
            </h3>
            <div className="space-y-4">
              {company.certifications && company.certifications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {company.awards && company.awards.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Awards</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.awards.map((award) => (
                      <span
                        key={award}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                      >
                        {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <Container>
          <div className="py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm mb-4">
              <Link to="/" className="text-mint-600 hover:text-mint-700 font-medium">Home</Link>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <Link to="/companies" className="text-mint-600 hover:text-mint-700 font-medium">Companies</Link>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{company.name}</span>
            </nav>

            {/* Company Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4 mb-3">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-16 h-16 rounded-xl object-contain bg-white p-2 border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-mint-100 to-emerald-100 rounded-xl flex items-center justify-center border border-gray-200">
                        <BuildingOfficeIcon className="w-8 h-8 text-mint-600" />
                      </div>
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                      {company.is_verified && (
                        <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                      )}
                    </div>

                    {company.description && (
                      <p className="text-gray-600 mb-2 max-w-3xl">
                        {company.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      {company.website_url && (
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 hover:text-mint-600 transition-colors font-medium"
                        >
                          <GlobeAltIcon className="w-4 h-4" />
                          <span>Visit Website</span>
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                      )}

                      {company.rating && (
                        <div className="flex items-center space-x-2">
                          <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{company.rating}/5</span>
                          {company.total_reviews && (
                            <span>({formatCompactNumber(company.total_reviews)} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  className="p-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  title="Bookmark company"
                >
                  <BookmarkIcon className="w-5 h-5" />
                </button>

                <button
                  className="p-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  title="Share company"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                  ? 'text-mint-600 border-b-2 border-mint-600 bg-mint-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.count !== null && (
                  <span className={`ml-1 sm:ml-2 py-0.5 px-1 sm:px-2 rounded-full text-xs ${activeTab === tab.id
                    ? 'bg-mint-100 text-mint-700'
                    : 'bg-gray-50 text-gray-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'deals' && renderDeals()}
            {activeTab === 'coupons' && renderCoupons()}
            {activeTab === 'about' && renderAbout()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CompanyPage
