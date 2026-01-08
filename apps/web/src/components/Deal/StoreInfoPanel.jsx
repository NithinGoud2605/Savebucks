import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  StarIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  ClockIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  GiftIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  NewspaperIcon,
  BellIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid'

const StoreInfoPanel = ({ company, deal }) => {
  const [isFollowing, setIsFollowing] = useState(false)
  const [showFullInfo, setShowFullInfo] = useState(false)

  if (!company) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
            <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{deal?.merchant || 'Store'}</h3>
            <p className="text-sm text-gray-500">Store Information</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          Store information is not available for this deal.
        </p>
      </div>
    )
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // TODO: Implement follow functionality
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${company.name} - Store Profile`,
        url: window.location.origin + `/company/${company.slug}`
      })
    } else {
      navigator.clipboard.writeText(window.location.origin + `/company/${company.slug}`)
    }
  }

  const renderRating = (rating, reviewsCount, label) => {
    if (!rating) return null

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
        {reviewsCount && (
          <span className="text-sm text-gray-500">({reviewsCount.toLocaleString()} reviews)</span>
        )}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    )
  }

  const renderSocialLinks = () => {
    if (!company.social_media || Object.keys(company.social_media).length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Follow Us</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(company.social_media).map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </a>
          ))}
        </div>
      </div>
    )
  }

  const renderBusinessHours = () => {
    if (!company.business_hours || Object.keys(company.business_hours).length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <ClockIcon className="w-4 h-4" />
          Business Hours
        </h4>
        <div className="space-y-1">
          {Object.entries(company.business_hours).map(([day, hours]) => (
            <div key={day} className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">{day}</span>
              <span className="text-gray-900">{hours}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPaymentMethods = () => {
    if (!company.payment_methods || company.payment_methods.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <CreditCardIcon className="w-4 h-4" />
          Payment Methods
        </h4>
        <div className="flex flex-wrap gap-2">
          {company.payment_methods.map((method, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderShippingInfo = () => {
    if (!company.shipping_info || Object.keys(company.shipping_info).length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <TruckIcon className="w-4 h-4" />
          Shipping Information
        </h4>
        <div className="space-y-1 text-sm">
          {Object.entries(company.shipping_info).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderContactInfo = () => {
    if (!company.contact_info || Object.keys(company.contact_info).length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Contact Information</h4>
        <div className="space-y-1 text-sm">
          {company.contact_info.phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-gray-400" />
              <a href={`tel:${company.contact_info.phone}`} className="text-blue-600 hover:underline">
                {company.contact_info.phone}
              </a>
            </div>
          )}
          {company.contact_info.email && (
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${company.contact_info.email}`} className="text-blue-600 hover:underline">
                {company.contact_info.email}
              </a>
            </div>
          )}
          {company.contact_info.address && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{company.contact_info.address}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCertifications = () => {
    if (!company.certifications || company.certifications.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <CheckBadgeIcon className="w-4 h-4" />
          Certifications
        </h4>
        <div className="flex flex-wrap gap-2">
          {company.certifications.map((cert, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
            >
              {cert}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderAwards = () => {
    if (!company.awards || company.awards.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <GiftIcon className="w-4 h-4" />
          Awards & Recognition
        </h4>
        <div className="space-y-1">
          {company.awards.map((award, index) => (
            <div key={index} className="text-sm text-gray-700">
              • {award}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={company.logo_url || '/placeholder-logo.png'}
              alt={`${company.name} logo`}
              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                e.target.src = '/placeholder-logo.png'
              }}
            />
            {company.is_verified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckBadgeIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
              {company.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  <ShieldCheckIcon className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            {company.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{company.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFollow}
            className={`p-2 rounded-lg border transition-colors ${isFollowing
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {isFollowing ? (
              <HeartIconSolid className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ratings & Reviews */}
      <div className="space-y-3 mb-6">
        {company.rating && (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Overall Rating</h4>
              {renderRating(company.rating, company.total_reviews, '')}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.trustpilot_rating && renderRating(company.trustpilot_rating, company.trustpilot_reviews_count, 'Trustpilot')}
          {company.app_store_rating && renderRating(company.app_store_rating, null, 'App Store')}
          {company.play_store_rating && renderRating(company.play_store_rating, null, 'Play Store')}
        </div>

        {company.bbb_rating && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">BBB Rating:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${company.bbb_rating === 'A+' ? 'bg-green-100 text-green-800' :
              company.bbb_rating === 'A' ? 'bg-green-100 text-green-800' :
                company.bbb_rating === 'B' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
              }`}>
              {company.bbb_rating}
            </span>
            {company.bbb_accreditation && (
              <span className="text-xs text-green-600 font-medium">Accredited</span>
            )}
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {company.founded_year && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{company.founded_year}</div>
            <div className="text-xs text-gray-500">Founded</div>
          </div>
        )}
        {company.employee_count && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{company.employee_count}</div>
            <div className="text-xs text-gray-500">Employees</div>
          </div>
        )}
        {company.headquarters && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 truncate">{company.headquarters}</div>
            <div className="text-xs text-gray-500">Headquarters</div>
          </div>
        )}
        {company.revenue_range && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{company.revenue_range}</div>
            <div className="text-xs text-gray-500">Revenue</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {company.website_url && (
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <GlobeAltIcon className="w-4 h-4" />
            Visit Website
          </a>
        )}
        <Link
          to={`/company/${company.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <BuildingOfficeIcon className="w-4 h-4" />
          View All Deals
        </Link>
        {company.mobile_app_url && (
          <a
            href={company.mobile_app_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DevicePhoneMobileIcon className="w-4 h-4" />
            Mobile App
          </a>
        )}
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowFullInfo(!showFullInfo)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {showFullInfo ? 'Show Less' : 'Show More Details'}
          {showFullInfo ? (
            <InformationCircleIcon className="w-4 h-4" />
          ) : (
            <InformationCircleIcon className="w-4 h-4" />
          )}
        </button>

        {showFullInfo && (
          <div className="mt-4 space-y-6">
            {renderContactInfo()}
            {renderBusinessHours()}
            {renderPaymentMethods()}
            {renderShippingInfo()}
            {renderSocialLinks()}
            {renderCertifications()}
            {renderAwards()}

            {/* Additional Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.faq_url && (
                <a
                  href={company.faq_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">FAQ</span>
                </a>
              )}
              {company.blog_url && (
                <a
                  href={company.blog_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <NewspaperIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Blog</span>
                </a>
              )}
              {company.customer_service && (
                <a
                  href={company.customer_service}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Customer Service</span>
                </a>
              )}
              {company.newsletter_signup && (
                <a
                  href={company.newsletter_signup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BellIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Newsletter</span>
                </a>
              )}
            </div>

            {/* Policies */}
            {company.return_policy && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  Return Policy
                </h4>
                <p className="text-sm text-gray-700">{company.return_policy}</p>
              </div>
            )}

            {company.loyalty_program && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <GiftIcon className="w-4 h-4" />
                  Loyalty Program
                </h4>
                <p className="text-sm text-gray-700">{company.loyalty_program}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StoreInfoPanel

