import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  MapPin,
  Globe,
  Star,
  TrendingUp,
  Tag,
  Calendar,
  Award
} from 'lucide-react'
import { dateAgo } from '../../lib/format'

const UserCard = ({ user, variant = 'default' }) => {
  const isCompact = variant === 'compact'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 ${isCompact ? 'p-3' : 'p-4'
        }`}
    >
      {/* User Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}`}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.handle}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
              <User className={`${isCompact ? 'w-5 h-5' : 'w-6 h-6'} text-primary-600`} />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/user/${user.handle}`}
              className={`font-semibold text-gray-900 hover:text-primary-600 transition-colors ${isCompact ? 'text-sm' : 'text-base'
                }`}
            >
              @{user.handle}
            </Link>

            {/* Role Badge */}
            {user.role && user.role !== 'user' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                ? 'bg-red-100 text-red-700'
                : user.role === 'moderator'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 text-gray-700'
                }`}>
                {user.role}
              </span>
            )}
          </div>

          {/* Karma and Stats */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1">
              <Star className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-500`} />
              <span className={`font-medium text-gray-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                {user.karma || 0}
              </span>
              <span className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                karma
              </span>
            </div>

            {user.total_contributions > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-green-500`} />
                <span className={`font-medium text-gray-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  {user.total_contributions}
                </span>
                <span className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  posts
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio && !isCompact && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Location and Website */}
          <div className="flex items-center gap-3 text-gray-500 text-xs mb-3">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{user.location}</span>
              </div>
            )}

            {user.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors"
                >
                  Website
                </a>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Joined {dateAgo(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {!isCompact && (user.recent_deals?.length > 0 || user.recent_coupons?.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
            <Award className="w-4 h-4" />
            Recent Activity
          </h4>

          <div className="space-y-1">
            {/* Recent Deals */}
            {user.recent_deals?.slice(0, 2).map((deal) => (
              <div key={deal.id} className="flex items-center gap-2 text-xs text-gray-600">
                <TrendingUp className="w-3 h-3 text-primary-500" />
                <Link
                  to={`/deal/${deal.id}`}
                  className="hover:text-primary-600 transition-colors line-clamp-1"
                >
                  {deal.title}
                </Link>
                {deal.discount_percentage && (
                  <span className="text-green-600 font-medium">
                    {deal.discount_percentage}% off
                  </span>
                )}
              </div>
            ))}

            {/* Recent Coupons */}
            {user.recent_coupons?.slice(0, 2).map((coupon) => (
              <div key={coupon.id} className="flex items-center gap-2 text-xs text-gray-600">
                <Tag className="w-3 h-3 text-green-500" />
                <Link
                  to={`/coupon/${coupon.id}`}
                  className="hover:text-primary-600 transition-colors line-clamp-1"
                >
                  {coupon.title}
                </Link>
                {coupon.discount_value && (
                  <span className="text-green-600 font-medium">
                    {coupon.discount_value}% off
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default UserCard
