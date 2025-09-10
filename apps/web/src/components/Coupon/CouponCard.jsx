import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Tag, 
  Building2, 
  Clock, 
  Eye, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  Percent,
  DollarSign,
  Calendar,
  User
} from 'lucide-react'
import { CouponCode } from '../Deal/CouponCode'
import { dateAgo } from '../../lib/format'

const CouponCard = ({ 
  coupon, 
  variant = 'default', // 'default', 'compact'
  onSave = null,
  onVote = null,
  className = ''
}) => {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Handle save functionality
  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      await onSave(coupon.id)
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error saving coupon:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get company name
  const companyName = coupon.companies?.name || coupon.company_name || 'Unknown Store'
  
  // Get submitter name
  const submitterName = coupon.profiles?.handle || coupon.submitter_name || 'Anonymous'
  
  // Get category name
  const categoryName = coupon.categories?.name || coupon.category_name

  // Format discount value
  const formatDiscount = () => {
    if (!coupon.discount_value) return null
    
    if (coupon.coupon_type === 'percentage') {
      return `${coupon.discount_value}% OFF`
    } else if (coupon.coupon_type === 'fixed') {
      return `$${coupon.discount_value} OFF`
    } else if (coupon.coupon_type === 'free_shipping') {
      return 'Free Shipping'
    } else if (coupon.coupon_type === 'cashback') {
      return `${coupon.discount_value}% Cashback`
    }
    return `${coupon.discount_value} OFF`
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.article
        whileHover={{ y: -2 }}
        className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group ${className}`}
        onClick={() => window.location.href = `/coupon/${coupon.id}`}
      >
        <div className="flex p-3">
          {/* Company Logo/Icon */}
          <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
            {coupon.companies?.logo_url ? (
              <img 
                src={coupon.companies.logo_url} 
                alt={companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 ml-3 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {coupon.title}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-primary-600 font-medium">{companyName}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">by {submitterName}</span>
                </div>
              </div>
            </div>
            
            {/* Discount and Stats */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                {formatDiscount() && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                    {formatDiscount()}
                  </span>
                )}
                {coupon.coupon_code && (
                  <span className="text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded font-mono">
                    {coupon.coupon_code}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">{coupon.views_count || 0}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{dateAgo(coupon.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    )
  }

  // Default variant
  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={`bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all cursor-pointer group ${className}`}
      onClick={() => window.location.href = `/coupon/${coupon.id}`}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
              {coupon.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-primary-600 font-medium">{companyName}</span>
              <span className="text-gray-400">•</span>
              <span>by {submitterName}</span>
              {categoryName && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{categoryName}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Company Logo */}
          <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden ml-4">
            {coupon.companies?.logo_url ? (
              <img 
                src={coupon.companies.logo_url} 
                alt={companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Discount Badge */}
        {formatDiscount() && (
          <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
            <Percent className="w-4 h-4 mr-1" />
            {formatDiscount()}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Description */}
        {coupon.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {coupon.description}
          </p>
        )}

        {/* Coupon Code */}
        {coupon.coupon_code && (
          <div className="mb-4">
            <CouponCode
              code={coupon.coupon_code}
              type={coupon.coupon_type}
              discount={coupon.discount_value}
              dealUrl={coupon.source_url}
              merchant={companyName}
              expiresAt={coupon.expires_at}
              size="default"
            />
          </div>
        )}

        {/* Terms and Conditions */}
        {coupon.terms_conditions && (
          <div className="mb-4">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">Terms & Conditions</summary>
              <p className="mt-2 text-gray-600">{coupon.terms_conditions}</p>
            </details>
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{coupon.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{dateAgo(coupon.created_at)}</span>
            </div>
            {coupon.expires_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSave()
              }}
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
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {coupon.source_url && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.open(coupon.source_url, '_blank')
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Use Coupon
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default CouponCard
