import React from 'react'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { AffiliateButton } from './AffiliateButton'
import { InlineDisclosure } from './InlineDisclosure'
import { TagChips } from './TagChips'
import { EnhancedDealCard } from './EnhancedDealCard'
import { formatPrice, dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export function DealCard({ deal, className, compact = false, enhanced = false }) {
  // Use enhanced version if requested
  if (enhanced) {
    return <EnhancedDealCard deal={deal} className={className} compact={compact} enhanced />
  }
  const tags = [deal.merchant, deal.category].filter(Boolean)
  const score = (deal.ups || 0) - (deal.downs || 0)

  return (
    <article className={clsx(
      'card hover:shadow-lg transition-shadow',
      compact ? 'p-4' : 'p-6',
      className
    )}>
      <div className="flex items-start space-x-4">
        {/* Vote Button */}
        <VoteButton 
          dealId={deal.id} 
          votes={score}
          userVote={deal.user_vote}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            <Link 
              to={`/deal/${deal.id}`}
              className="hover:text-blue-600 focus-ring rounded"
            >
              {deal.title}
            </Link>
          </h2>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            {deal.merchant && (
              <span className="font-medium">{deal.merchant}</span>
            )}
            <span>{dateAgo(deal.created_at)}</span>
            {deal.comments?.length > 0 && (
              <span>{deal.comments.length} comments</span>
            )}
          </div>

          {/* Price */}
          {deal.price && (
            <div className="flex items-baseline space-x-2 mb-3">
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(deal.price, deal.currency)}
              </span>
              {deal.list_price && deal.list_price > deal.price && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(deal.list_price, deal.currency)}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          <TagChips tags={tags} className="mb-4" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AffiliateButton dealId={deal.id} />
              <InlineDisclosure />
            </div>

            {/* Status Badge */}
            {deal.status && deal.status !== 'active' && (
              <span className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                deal.status === 'expired' && 'bg-red-100 text-red-800',
                deal.status === 'pending' && 'bg-yellow-100 text-yellow-800'
              )}>
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Image */}
        {deal.image_url && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={deal.image_url}
              alt={deal.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </article>
  )
}
