import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { AffiliateButton } from './AffiliateButton'
import { formatPrice, dateAgo, formatDate } from '../../lib/format'
import { clsx } from 'clsx'

export function DealComparison({ deals = [], onRemove }) {
  const [comparisonView, setComparisonView] = useState('overview')
  const [highlightDifferences, setHighlightDifferences] = useState(true)

  if (deals.length === 0) {
    return null
  }

  const comparisonViews = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'pricing', label: 'Pricing', icon: '$' },
    { key: 'details', label: 'Details', icon: '📋' },
    { key: 'community', label: 'Community', icon: '👥' },
  ]

  // Find best values for highlighting
  const bestValues = {
    lowestPrice: Math.min(...deals.map(d => d.price || Infinity)),
    highestScore: Math.max(...deals.map(d => (d.ups || 0) - (d.downs || 0))),
    mostViews: Math.max(...deals.map(d => d.views || 0)),
    mostComments: Math.max(...deals.map(d => d.comments?.length || 0)),
    highestRating: Math.max(...deals.map(d => d.average_rating || 0)),
    biggest_savings: Math.max(...deals.map(d => d.list_price && d.price ? d.list_price - d.price : 0)),
  }

  const getBestClass = (value, bestValue, type = 'positive') => {
    if (!highlightDifferences || value !== bestValue || bestValue === 0) return ''

    return type === 'positive'
      ? 'bg-green-100 text-green-800 font-semibold'
      : 'bg-blue-100 text-blue-800 font-semibold'
  }

  const ComparisonRow = ({ label, children, className = '' }) => (
    <div className={clsx('border-b border-gray-200 py-3', className)}>
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `200px repeat(${deals.length}, 1fr)` }}>
        <div className="font-medium text-gray-900 px-4">
          {label}
        </div>
        {children}
      </div>
    </div>
  )

  const ComparisonCell = ({ children, className = '', highlight = false }) => (
    <div className={clsx(
      'px-4 py-2 rounded-lg text-center',
      highlight && 'bg-green-100 text-green-800',
      className
    )}>
      {children}
    </div>
  )

  return (
    <div className="card">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Deal Comparison
            </h2>
            <p className="text-gray-600">
              Compare {deals.length} deals side by side
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={highlightDifferences}
                onChange={(e) => setHighlightDifferences(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">
                Highlight best values
              </span>
            </label>

            <button
              onClick={() => onRemove && onRemove()}
              className="text-gray-400 hover:text-gray-600"
              title="Close comparison"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <nav className="flex space-x-1 mt-4">
          {comparisonViews.map((view) => (
            <button
              key={view.key}
              onClick={() => setComparisonView(view.key)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2',
                comparisonView === view.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Comparison Content */}
      <div className="p-6">
        {comparisonView === 'overview' && (
          <div className="space-y-0">
            {/* Deal Headers */}
            <div className="grid grid-cols-1 gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${deals.length}, 1fr)` }}>
              <div></div>
              {deals.map((deal) => (
                <div key={deal.id} className="text-center">
                  <div className="relative">
                    {onRemove && deals.length > 2 && (
                      <button
                        onClick={() => onRemove(deal.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        title="Remove from comparison"
                      >
                        ×
                      </button>
                    )}

                    {/* Get images array - prioritize deal_images, fallback to image_url */}
                    {(deal.deal_images?.length > 0 ? deal.deal_images[0] : deal.image_url) && (
                      <div className="w-24 h-24 mx-auto mb-3 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={deal.deal_images?.length > 0 ? deal.deal_images[0] : deal.image_url}
                          alt={deal.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link to={`/deal/${deal.id}`} className="hover:text-blue-600">
                        {deal.title}
                      </Link>
                    </h3>

                    <p className="text-sm text-gray-600">
                      {deal.merchant}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Comparison */}
            <ComparisonRow label="Price">
              {deals.map((deal) => (
                <ComparisonCell
                  key={deal.id}
                  className={getBestClass(deal.price || 0, bestValues.lowestPrice)}
                >
                  <div className="text-2xl font-bold text-green-600">
                    {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                  </div>
                  {deal.list_price && deal.list_price > deal.price && (
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(deal.list_price)}
                    </div>
                  )}
                </ComparisonCell>
              ))}
            </ComparisonRow>

            {/* Savings */}
            <ComparisonRow label="You Save">
              {deals.map((deal) => {
                const savings = deal.list_price && deal.price ? deal.list_price - deal.price : 0
                return (
                  <ComparisonCell
                    key={deal.id}
                    className={getBestClass(savings, bestValues.biggest_savings)}
                  >
                    <div className="font-semibold text-red-600">
                      {savings > 0 ? formatPrice(savings) : 'N/A'}
                    </div>
                    {savings > 0 && deal.list_price && (
                      <div className="text-xs text-gray-600">
                        {Math.round((savings / deal.list_price) * 100)}% OFF
                      </div>
                    )}
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            {/* Community Score */}
            <ComparisonRow label="Community Score">
              {deals.map((deal) => {
                const score = (deal.ups || 0) - (deal.downs || 0)
                return (
                  <ComparisonCell
                    key={deal.id}
                    className={getBestClass(score, bestValues.highestScore)}
                  >
                    <div className={clsx(
                      'font-semibold',
                      score > 0 ? 'text-green-600' :
                        score < 0 ? 'text-red-600' :
                          'text-gray-600'
                    )}>
                      {score > 0 ? `+${score}` : score}
                    </div>
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            {/* Actions */}
            <ComparisonRow label="Actions">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="space-y-2">
                    <AffiliateButton
                      dealId={deal.id}
                      className="w-full text-sm py-2"
                    >
                      Get Deal
                    </AffiliateButton>
                    <VoteButton
                      dealId={deal.id}
                      votes={(deal.ups || 0) - (deal.downs || 0)}
                      userVote={deal.user_vote}
                      className="mx-auto"
                    />
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>
          </div>
        )}

        {comparisonView === 'pricing' && (
          <div className="space-y-0">
            <ComparisonRow label="Current Price">
              {deals.map((deal) => (
                <ComparisonCell
                  key={deal.id}
                  className={getBestClass(deal.price || 0, bestValues.lowestPrice)}
                >
                  <div className="text-xl font-bold text-green-600">
                    {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Original Price">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="text-gray-600">
                    {deal.list_price ? formatPrice(deal.list_price) : 'Not specified'}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Discount Amount">
              {deals.map((deal) => {
                const savings = deal.list_price && deal.price ? deal.list_price - deal.price : 0
                return (
                  <ComparisonCell
                    key={deal.id}
                    className={getBestClass(savings, bestValues.biggest_savings)}
                  >
                    <div className="font-semibold text-red-600">
                      {savings > 0 ? formatPrice(savings) : 'N/A'}
                    </div>
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            <ComparisonRow label="Discount Percentage">
              {deals.map((deal) => {
                const percentage = deal.list_price && deal.price && deal.list_price > deal.price
                  ? Math.round(((deal.list_price - deal.price) / deal.list_price) * 100)
                  : 0
                return (
                  <ComparisonCell key={deal.id}>
                    <div className="font-semibold text-red-600">
                      {percentage > 0 ? `${percentage}% OFF` : 'No discount'}
                    </div>
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            <ComparisonRow label="Deal Type">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="text-sm">
                    {deal.coupon_code ? 'Coupon Code' :
                      deal.cashback ? 'Cashback' :
                        deal.price === 0 ? 'Free' :
                          'Direct Discount'}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            {deals.some(d => d.expires_at) && (
              <ComparisonRow label="Expiration">
                {deals.map((deal) => (
                  <ComparisonCell key={deal.id}>
                    <div className="text-sm text-gray-600">
                      {deal.expires_at ? formatDate(deal.expires_at) : 'No expiration'}
                    </div>
                  </ComparisonCell>
                ))}
              </ComparisonRow>
            )}
          </div>
        )}

        {comparisonView === 'details' && (
          <div className="space-y-0">
            <ComparisonRow label="Merchant">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="font-medium">{deal.merchant || 'Unknown'}</div>
                  {deal.merchant_rating && (
                    <div className="text-sm text-yellow-600">
                      {deal.merchant_rating}/5 Stars
                    </div>
                  )}
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Category">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <span className="text-sm">{deal.category?.name || deal.category || 'General'}</span>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Posted Date">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="text-sm text-gray-600">
                    {dateAgo(deal.created_at)}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Author">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <Link
                    to={`/u/${deal.author}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {deal.author || 'Anonymous'}
                  </Link>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Verification">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="text-sm">
                    {deal.is_verified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-gray-500">Not Verified</span>
                    )}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            {deals.some(d => d.tags?.length > 0) && (
              <ComparisonRow label="Tags">
                {deals.map((deal) => (
                  <ComparisonCell key={deal.id}>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {deal.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-50 px-2 py-1 rounded">
                          {tag}
                        </span>
                      )) || <span className="text-gray-500 text-sm">No tags</span>}
                    </div>
                  </ComparisonCell>
                ))}
              </ComparisonRow>
            )}
          </div>
        )}

        {comparisonView === 'community' && (
          <div className="space-y-0">
            <ComparisonRow label="Community Score">
              {deals.map((deal) => {
                const score = (deal.ups || 0) - (deal.downs || 0)
                return (
                  <ComparisonCell
                    key={deal.id}
                    className={getBestClass(score, bestValues.highestScore)}
                  >
                    <div className={clsx(
                      'text-xl font-bold',
                      score > 0 ? 'text-green-600' :
                        score < 0 ? 'text-red-600' :
                          'text-gray-600'
                    )}>
                      {score > 0 ? `+${score}` : score}
                    </div>
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            <ComparisonRow label="Upvotes">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="text-green-600 font-medium">
                    ↑ {deal.ups || 0}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Downvotes">
              {deals.map((deal) => (
                <ComparisonCell key={deal.id}>
                  <div className="text-red-600 font-medium">
                    ↓ {deal.downs || 0}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Comments">
              {deals.map((deal) => {
                const count = deal.comments?.length || 0
                return (
                  <ComparisonCell
                    key={deal.id}
                    className={getBestClass(count, bestValues.mostComments)}
                  >
                    <div className="font-medium">
                      {count} Comments
                    </div>
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            <ComparisonRow label="Views">
              {deals.map((deal) => {
                const views = deal.views || 0
                return (
                  <ComparisonCell
                    key={deal.id}
                    className={getBestClass(views, bestValues.mostViews)}
                  >
                    <div className="font-medium">
                      {views.toLocaleString()} Views
                    </div>
                  </ComparisonCell>
                )
              })}
            </ComparisonRow>

            {deals.some(d => d.average_rating > 0) && (
              <ComparisonRow label="Average Rating">
                {deals.map((deal) => {
                  const rating = deal.average_rating || 0
                  return (
                    <ComparisonCell
                      key={deal.id}
                      className={getBestClass(rating, bestValues.highestRating)}
                    >
                      <div className="font-medium text-yellow-600">
                        {rating > 0 ? `${rating.toFixed(1)}/5 Stars` : 'No rating'}
                      </div>
                    </ComparisonCell>
                  )
                })}
              </ComparisonRow>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">
            Quick Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Best Price</div>
              <div className="font-bold text-green-600">
                {bestValues.lowestPrice === Infinity ? 'N/A' : formatPrice(bestValues.lowestPrice)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Highest Score</div>
              <div className="font-bold text-blue-600">
                +{bestValues.highestScore}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Most Popular</div>
              <div className="font-bold text-purple-600">
                {bestValues.mostViews.toLocaleString()} views
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
