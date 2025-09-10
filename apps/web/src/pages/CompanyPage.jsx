import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import { BookmarkCheck } from 'lucide-react'
import { Container } from '../components/Layout/Container'
import { NewDealCard } from '../components/Deal/NewDealCard'
import { Skeleton } from '../components/Loader/Skeleton'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { useAuth } from '../hooks/useAuth'
import { formatPrice, dateAgo, formatCompactNumber } from '../lib/format'
import SubmitterBadge from '../components/Deal/SubmitterBadge'

const CompanyPage = () => {
  const { slug } = useParams()
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.slice(0, 6).map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
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
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-secondary-900">
          All Deals ({deals.length})
        </h3>
        <div className="flex items-center space-x-2 text-sm text-secondary-600">
          <EyeIcon className="w-4 h-4" />
          <span>{formatCompactNumber(stats.total_views)} total views</span>
        </div>
      </div>
      
      {deals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal, index) => (
            <NewDealCard key={deal.id} deal={deal} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TagIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No Deals Available
          </h3>
          <p className="text-secondary-600">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
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
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        {company.banner_image && (
          <div className="absolute inset-0">
            <img
              src={company.banner_image}
              alt={company.name}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        
        <Container>
          <div className="py-12 relative z-10">
            <div className="flex items-start space-x-6">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-24 h-24 rounded-xl object-cover bg-white p-2"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-white/20 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold">{company.name}</h1>
                  {company.is_verified && (
                    <CheckBadgeIcon className="w-8 h-8 text-blue-300" />
                  )}
                </div>
                
                {company.description && (
                  <p className="text-xl text-primary-100 mb-4 max-w-3xl">
                    {company.description}
                  </p>
                )}

                <div className="flex items-center space-x-6 text-primary-100">
                  {company.website_url && (
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-white transition-colors"
                    >
                      <GlobeAltIcon className="w-5 h-5" />
                      <span>Visit Website</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  )}
                  
                  {company.rating && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-5 h-5 text-yellow-300 fill-current" />
                      <span>{company.rating}/5</span>
                      {company.total_reviews && (
                        <span>({formatCompactNumber(company.total_reviews)} reviews)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8">
          {/* Navigation Tabs */}
          <div className="border-b border-secondary-200 mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
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
      </Container>
    </div>
  )
}

// Coupon Card Component
const CouponCard = ({ coupon }) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(coupon.is_saved || false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCopyCode = async () => {
    if (!coupon.coupon_code) return
    
    try {
      await navigator.clipboard.writeText(coupon.coupon_code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      
      // Track coupon click when copying code
      await handleCouponClick('coupon_copy_code')
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleSave = async () => {
    if (!user) {
      navigate('/signin')
      return
    }

    if (isSaving) return

    setIsSaving(true)
    try {
      if (isSaved) {
        await api.unsaveCoupon(coupon.id)
        setIsSaved(false)
        console.log('Coupon unsaved successfully')
      } else {
        await api.saveCoupon(coupon.id)
        setIsSaved(true)
        console.log('Coupon saved successfully')
      }
    } catch (error) {
      console.error('Failed to save/unsave coupon:', error)
      alert(`Failed to ${isSaved ? 'unsave' : 'save'} coupon: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Track coupon click
  const handleCouponClick = async (source = 'coupon_card') => {
    try {
      await api.trackCouponClick(coupon.id, source)
    } catch (error) {
      console.error('Failed to track coupon click:', error)
      // Don't prevent action if tracking fails
    }
  }

  const getCouponTypeIcon = (type) => {
    switch (type) {
      case 'percentage':
        return <TagIcon className="w-5 h-5 text-green-600" />
      case 'fixed_amount':
        return <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
      case 'free_shipping':
        return <TruckIcon className="w-5 h-5 text-purple-600" />
      default:
        return <GiftIcon className="w-5 h-5 text-orange-600" />
    }
  }

  const getCouponTypeLabel = (type) => {
    switch (type) {
      case 'percentage':
        return 'Percentage Off'
      case 'fixed_amount':
        return 'Fixed Amount Off'
      case 'free_shipping':
        return 'Free Shipping'
      default:
        return 'Special Offer'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getCouponTypeIcon(coupon.coupon_type)}
            <span className="text-sm font-medium text-secondary-600">
              {getCouponTypeLabel(coupon.coupon_type)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {coupon.is_featured && (
              <SparklesIcon className="w-5 h-5 text-yellow-500" />
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-2 rounded-lg border transition-all ${
                isSaved
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? 'Remove from saved items' : 'Save coupon'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-current" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-2">
          {coupon.title}
        </h3>
        
        {/* Submitter Info */}
        <div className="mb-3">
          <SubmitterBadge 
            submitter={coupon.profiles} 
            submitter_id={coupon.submitter_id}
            created_at={coupon.created_at}
            size="sm"
            showDate={true}
          />
        </div>
        
        {coupon.description && (
          <p className="text-sm text-secondary-600 mb-4 line-clamp-2">
            {coupon.description}
          </p>
        )}

        <div className="space-y-3 mb-4">
          {coupon.discount_value && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Discount:</span>
              <span className="text-lg font-bold text-green-600">
                {coupon.coupon_type === 'percentage' 
                  ? `${coupon.discount_value}%` 
                  : `$${coupon.discount_value}`
                }
              </span>
            </div>
          )}
          
          {coupon.minimum_order_amount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Min. Order:</span>
              <span className="text-sm font-medium text-secondary-900">
                ${coupon.minimum_order_amount}
              </span>
            </div>
          )}
          
          {coupon.maximum_discount_amount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Max. Discount:</span>
              <span className="text-sm font-medium text-secondary-900">
                ${coupon.maximum_discount_amount}
              </span>
            </div>
          )}
        </div>

        {coupon.coupon_code && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-secondary-700">Coupon Code:</span>
              <button
                onClick={handleCopyCode}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 text-center">
              <code className="text-lg font-mono font-bold text-secondary-900">
                {coupon.coupon_code}
              </code>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-secondary-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{formatCompactNumber(coupon.views_count)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <CursorArrowRaysIcon className="w-4 h-4" />
              <span>{formatCompactNumber(coupon.clicks_count)}</span>
            </span>
          </div>
          
          {coupon.expires_at && (
            <span className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>Expires {dateAgo(coupon.expires_at)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyPage
