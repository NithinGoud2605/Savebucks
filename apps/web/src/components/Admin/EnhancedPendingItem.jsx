import React, { useState } from 'react'
import { formatPrice, dateAgo } from '../../lib/format'
import SubmitterBadge from '../Deal/SubmitterBadge'
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

export default function EnhancedPendingItem({
  item,
  type,
  onApprove,
  onReject,
  onToggleSelection,
  isSelected,
  isLoading,
  onEdit
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const handleApprove = () => onApprove(item)
  const handleReject = () => onReject(item)
  const handleToggleSelection = () => onToggleSelection(item)

  const isDeal = type === 'deals'
  const isCoupon = type === 'coupons'

  // Calculate karma points for this submission
  const calculateKarmaPoints = () => {
    let fieldCount = 0
    let totalFields = isDeal ? 15 : 10

    if (isDeal) {
      if (item.original_price) fieldCount++
      if (item.discount_percentage) fieldCount++
      if (item.merchant) fieldCount++
      if (item.category_id) fieldCount++
      if (item.deal_type && item.deal_type !== 'deal') fieldCount++
      if (item.coupon_code) fieldCount++
      if (item.coupon_type && item.coupon_type !== 'none') fieldCount++
      if (item.starts_at) fieldCount++
      if (item.expires_at) fieldCount++
      if (item.stock_status && item.stock_status !== 'unknown') fieldCount++
      if (item.stock_quantity) fieldCount++
      if (item.tags) fieldCount++
      if (item.image_url) fieldCount++
      if (item.description) fieldCount++
      if (item.terms_conditions) fieldCount++
    } else {
      if (item.minimum_order_amount) fieldCount++
      if (item.maximum_discount_amount) fieldCount++
      if (item.usage_limit) fieldCount++
      if (item.usage_limit_per_user) fieldCount++
      if (item.starts_at) fieldCount++
      if (item.expires_at) fieldCount++
      if (item.source_url) fieldCount++
      if (item.category_id) fieldCount++
      if (item.description) fieldCount++
      if (item.terms_conditions) fieldCount++
    }

    if (fieldCount === 0) return 3
    if (fieldCount <= totalFields * 0.3) return 5
    if (fieldCount <= totalFields * 0.7) return 8
    return 10
  }

  const karmaPoints = calculateKarmaPoints()
  const getKarmaColor = () => {
    if (karmaPoints === 3) return 'text-gray-600 bg-gray-50'
    if (karmaPoints === 5) return 'text-blue-600 bg-blue-100'
    if (karmaPoints === 8) return 'text-green-600 bg-green-100'
    if (karmaPoints === 10) return 'text-purple-600 bg-purple-100'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title and Status */}
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelection}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {item.title}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending Review
              </span>
            </div>

            {/* Submitter Info */}
            <div className="mb-4">
              <SubmitterBadge
                submitter={item.profiles}
                submitter_id={item.submitter_id}
                created_at={item.created_at}
                size="sm"
                showDate={true}
              />
            </div>

            {/* Karma Points Preview */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Karma Points:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getKarmaColor()}`}>
                  {karmaPoints} points
                </span>
                <span className="text-xs text-gray-500">
                  ({karmaPoints === 3 ? 'Basic' : karmaPoints === 5 ? 'Good' : karmaPoints === 8 ? 'Great' : 'Excellent'} submission)
                </span>
              </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Price/Value */}
              {isDeal && item.price && (
                <div className="flex items-center gap-2 text-sm">
                  <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">{formatPrice(item.price)}</span>
                  {item.original_price && (
                    <span className="text-gray-500 line-through">
                      {formatPrice(item.original_price)}
                    </span>
                  )}
                </div>
              )}

              {isCoupon && item.discount_value && (
                <div className="flex items-center gap-2 text-sm">
                  <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">
                    {item.coupon_type === 'percentage'
                      ? `${item.discount_value}% off`
                      : `$${item.discount_value} off`
                    }
                  </span>
                </div>
              )}

              {/* Merchant/Company */}
              <div className="flex items-center gap-2 text-sm">
                <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">
                  {isDeal ? item.merchant : item.companies?.name}
                </span>
                {item.companies?.is_verified && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>

              {/* Category */}
              {item.categories && (
                <div className="flex items-center gap-2 text-sm">
                  <TagIcon className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">{item.categories.name}</span>
                </div>
              )}

              {/* Submission Date */}
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Expiration */}
              {item.expires_at && (
                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">
                    Expires {new Date(item.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description Preview */}
            {item.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {item.description}
                </p>
                {item.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Full Description */}
            {showFullDescription && item.description && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {/* Images */}
            {item.deal_images && item.deal_images.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <PhotoIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Images ({item.deal_images.length})
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {item.deal_images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                  {item.deal_images.length > 3 && (
                    <div className="w-16 h-16 bg-gray-50 rounded border flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        +{item.deal_images.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coupon Code */}
            {isCoupon && item.coupon_code && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-green-800">Coupon Code:</span>
                    <code className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-mono">
                      {item.coupon_code}
                    </code>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(item.coupon_code)}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Deal URL */}
            {isDeal && item.url && (
              <div className="mb-4">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  View Deal URL
                </a>
              </div>
            )}

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 mb-4"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  Show less details
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  Show more details
                </>
              )}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t pt-4 space-y-3">
                {/* Additional Deal Info */}
                {isDeal && (
                  <>
                    {item.discount_percentage && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium">{item.discount_percentage}%</span>
                      </div>
                    )}
                    {item.discount_amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount Amount:</span>
                        <span className="font-medium">{formatPrice(item.discount_amount)}</span>
                      </div>
                    )}
                    {item.coupon_code && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coupon Code:</span>
                        <code className="font-mono text-sm">{item.coupon_code}</code>
                      </div>
                    )}
                    {item.deal_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Deal Type:</span>
                        <span className="font-medium">{item.deal_type}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Additional Coupon Info */}
                {isCoupon && (
                  <>
                    {item.coupon_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coupon Type:</span>
                        <span className="font-medium">{item.coupon_type}</span>
                      </div>
                    )}
                    {item.minimum_order_amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Minimum Order:</span>
                        <span className="font-medium">{formatPrice(item.minimum_order_amount)}</span>
                      </div>
                    )}
                    {item.maximum_discount_amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Discount:</span>
                        <span className="font-medium">{formatPrice(item.maximum_discount_amount)}</span>
                      </div>
                    )}
                    {item.usage_limit && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Usage Limit:</span>
                        <span className="font-medium">{item.usage_limit}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Submission Details */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Submission Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{item.status}</span>
                    </div>
                    {item.is_featured && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Featured:</span>
                        <span className="text-yellow-600">Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => onEdit?.(item)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
