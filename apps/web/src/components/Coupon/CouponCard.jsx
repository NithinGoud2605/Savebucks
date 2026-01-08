import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  User,
  Copy,
  Check,
  Sparkles,
  Gift,
  Truck,
  CreditCard
} from 'lucide-react'
import { CouponCode } from '../Deal/CouponCode'
import { dateAgo } from '../../lib/format'

const CouponCard = ({
  coupon,
  variant = 'default', // 'default', 'compact', 'modern'
  onSave = null,
  onVote = null,
  className = ''
}) => {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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

  // Handle copy coupon code
  const handleCopyCode = async () => {
    if (!coupon.coupon_code) return

    try {
      await navigator.clipboard.writeText(coupon.coupon_code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
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
      return `${coupon.discount_value}%`
    } else if (coupon.coupon_type === 'fixed_amount') {
      return `$${coupon.discount_value}`
    } else if (coupon.coupon_type === 'free_shipping') {
      return 'Free'
    } else if (coupon.coupon_type === 'cashback') {
      return `${coupon.discount_value}%`
    }
    return `${coupon.discount_value}`
  }

  // Get coupon type label
  const getCouponTypeLabel = () => {
    if (coupon.coupon_type === 'percentage') return 'Coupon'
    if (coupon.coupon_type === 'fixed_amount') return 'Coupon'
    if (coupon.coupon_type === 'free_shipping') return 'Offer'
    if (coupon.coupon_type === 'cashback') return 'Coupon'
    return 'Offer'
  }

  // Get coupon type icon
  const getCouponTypeIcon = () => {
    switch (coupon.coupon_type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />
      case 'fixed_amount':
        return <DollarSign className="w-4 h-4" />
      case 'free_shipping':
        return <Truck className="w-4 h-4" />
      case 'cashback':
        return <CreditCard className="w-4 h-4" />
      default:
        return <Gift className="w-4 h-4" />
    }
  }

  const cornerLabel = (() => {
    if (coupon.coupon_type === 'percentage' && coupon.discount_value) return `${coupon.discount_value}%`
    if (coupon.coupon_type === 'fixed_amount' && coupon.discount_value) return `$${coupon.discount_value}`
    return 'SALE'
  })()

  // Modern variant - inspired by the image design
  if (variant === 'modern') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`relative rounded-2xl ${className}`}
      >
        {/* Animated gradient border */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', filter: 'blur(10px)', opacity: 0.15 }}
          animate={{ opacity: isHovered ? 0.28 : 0.15 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex items-center p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
          {/* Left Side - Discount & Type */}
          <div className="flex-shrink-0 w-20 text-center">
            <motion.div
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-bold text-blue-600 mb-1"
            >
              {formatDiscount()}
            </motion.div>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              {getCouponTypeIcon()}
              <span className="font-medium">{getCouponTypeLabel()}</span>
            </div>
          </div>

          {/* Middle - Description */}
          <div className="flex-1 mx-6 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
              {coupon.title}
            </h3>
            {coupon.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {coupon.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{coupon.views_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{dateAgo(coupon.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Button */}
          <div className="flex-shrink-0 relative">
            {coupon.coupon_code ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyCode}
                className="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <AnimatePresence mode="wait">
                  {isCopied ? (
                    <motion.div
                      key="copied"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy coupon</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Peeled corner effect */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 transform rotate-45 origin-bottom-right rounded-sm"
                  animate={{ rotate: isHovered ? 47 : 45 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute top-0 left-0 w-3.5 h-3.5 bg-white transform -rotate-45 -translate-x-1 -translate-y-1 rounded-sm">
                    <span className="absolute top-0.5 left-0.5 text-[10px] font-extrabold text-blue-600">{cornerLabel}</span>
                  </div>
                </motion.div>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(coupon.source_url, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>View deal</span>
                </div>
              </motion.button>
            )}

            {/* Confetti burst when copied */}
            <AnimatePresence>
              {isCopied && (
                <>
                  {[...Array(10)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: ['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][i % 5] }}
                      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      animate={{
                        opacity: 0,
                        x: (Math.random() - 0.5) * 80,
                        y: (Math.random() - 0.8) * 120,
                        scale: 0.8
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>
    )
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
          <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
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

  // Default variant - use modern design by default
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative rounded-2xl ${className}`}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', filter: 'blur(10px)', opacity: 0.15 }}
        animate={{ opacity: isHovered ? 0.28 : 0.15 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative flex items-center p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
        {/* Left Side - Discount & Type */}
        <div className="flex-shrink-0 w-20 text-center">
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="text-4xl font-bold text-blue-600 mb-1"
          >
            {formatDiscount()}
          </motion.div>
          <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
            {getCouponTypeIcon()}
            <span className="font-medium">{getCouponTypeLabel()}</span>
          </div>
        </div>

        {/* Middle - Description */}
        <div className="flex-1 mx-6 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {coupon.title}
          </h3>
          {coupon.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {coupon.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{coupon.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{dateAgo(coupon.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Action Button */}
        <div className="flex-shrink-0 relative">
          {coupon.coupon_code ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyCode}
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.div
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy coupon</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Peeled corner effect */}
              <motion.div
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 transform rotate-45 origin-bottom-right rounded-sm"
                animate={{ rotate: isHovered ? 47 : 45 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute top-0 left-0 w-3.5 h-3.5 bg-white transform -rotate-45 -translate-x-1 -translate-y-1 rounded-sm">
                  <span className="absolute top-0.5 left-0.5 text-[10px] font-extrabold text-blue-600">{cornerLabel}</span>
                </div>
              </motion.div>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(coupon.source_url, '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>View deal</span>
              </div>
            </motion.button>
          )}

          {/* Confetti burst when copied */}
          <AnimatePresence>
            {isCopied && (
              <>
                {[...Array(10)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][i % 5] }}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: (Math.random() - 0.5) * 80,
                      y: (Math.random() - 0.8) * 120,
                      scale: 0.8
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  )
}

export default CouponCard
