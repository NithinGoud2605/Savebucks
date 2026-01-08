import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Tag,
  Star,
  Calendar
} from 'lucide-react'
import { dateAgo } from '../../lib/format'

const CompanyCard = ({ company, variant = 'default' }) => {
  const isCompact = variant === 'compact'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 ${isCompact ? 'p-3' : 'p-4'
        }`}
    >
      {/* Company Header */}
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className={`flex-shrink-0 ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}`}>
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-full h-full rounded-lg object-cover bg-gray-50"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gray-50 flex items-center justify-center">
              <Building2 className={`${isCompact ? 'w-5 h-5' : 'w-6 h-6'} text-gray-500`} />
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/company/${company.slug}`}
              className={`font-semibold text-gray-900 hover:text-primary-600 transition-colors ${isCompact ? 'text-sm' : 'text-base'
                }`}
            >
              {company.name}
            </Link>

            {/* Verification Badge */}
            {company.is_verified && (
              <CheckCircle className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
            )}
          </div>

          {/* Category */}
          {company.categories && (
            <div className="flex items-center gap-1 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium`}
                style={{
                  backgroundColor: company.categories.color ? `${company.categories.color}20` : '#f3f4f6',
                  color: company.categories.color || '#6b7280'
                }}
              >
                {company.categories.name}
              </span>
            </div>
          )}

          {/* Description */}
          {company.description && !isCompact && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {company.description}
            </p>
          )}

          {/* Stats and Links */}
          <div className="flex items-center gap-3 text-gray-500 text-xs mb-3">
            {company.total_offers > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="font-medium text-gray-900">{company.total_offers}</span>
                <span>offers</span>
              </div>
            )}

            {company.website_url && (
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Website</span>
              </a>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Added {dateAgo(company.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Offers */}
      {!isCompact && (company.recent_deals?.length > 0 || company.recent_coupons?.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
            <Star className="w-4 h-4" />
            Latest Offers
          </h4>

          <div className="space-y-1">
            {/* Recent Deals */}
            {company.recent_deals?.slice(0, 2).map((deal) => (
              <div key={deal.id} className="flex items-center gap-2 text-xs text-gray-600">
                <TrendingUp className="w-3 h-3 text-primary-500" />
                <Link
                  to={`/deal/${deal.id}`}
                  className="hover:text-primary-600 transition-colors line-clamp-1 flex-1"
                >
                  {deal.title}
                </Link>
                {deal.discount_percentage && (
                  <span className="text-green-600 font-medium">
                    {deal.discount_percentage}% off
                  </span>
                )}
                <span className="text-gray-400">
                  by @{deal.profiles?.handle}
                </span>
              </div>
            ))}

            {/* Recent Coupons */}
            {company.recent_coupons?.slice(0, 2).map((coupon) => (
              <div key={coupon.id} className="flex items-center gap-2 text-xs text-gray-600">
                <Tag className="w-3 h-3 text-green-500" />
                <Link
                  to={`/coupon/${coupon.id}`}
                  className="hover:text-primary-600 transition-colors line-clamp-1 flex-1"
                >
                  {coupon.title}
                </Link>
                {coupon.discount_value && (
                  <span className="text-green-600 font-medium">
                    {coupon.discount_value}% off
                  </span>
                )}
                <span className="text-gray-400">
                  by @{coupon.profiles?.handle}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default CompanyCard
