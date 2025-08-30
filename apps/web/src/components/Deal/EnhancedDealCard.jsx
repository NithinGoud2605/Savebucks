import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { VoteButton } from './VoteButton'
import { AffiliateButton } from './AffiliateButton'
import { InlineDisclosure } from './InlineDisclosure'
import { TagChips } from './TagChips'
import { ShareButton } from './ShareButton'
import { BookmarkButton } from './BookmarkButton'
import { PriceHistory } from './PriceHistory'
import { DealScore } from './DealScore'
import { ExpirationTimer } from './ExpirationTimer'
import { CompactCouponCode } from './CouponCode.jsx'
import { useToast } from '../Toast'
import { api } from '../../lib/api'
import { formatPrice, dateAgo, truncate } from '../../lib/format'
import { clsx } from 'clsx'

export function EnhancedDealCard({ deal, compact = false, enhanced = true, className }) {
  const [showDetails, setShowDetails] = useState(false)
  const [imageError, setImageError] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToast()

  const tags = [deal.merchant, deal.category].filter(Boolean)
  const score = (deal.ups || 0) - (deal.downs || 0)
  const commentCount = deal.comments?.length || 0
  
  // Calculate deal temperature (hotness score)
  const temperature = React.useMemo(() => {
    const hoursOld = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60)
    const ageMultiplier = Math.max(0.1, 1 / (1 + hoursOld / 6)) // Decay over 6 hours
    const baseScore = score * ageMultiplier
    const commentBonus = commentCount * 2
    const viewBonus = (deal.views || 0) * 0.1
    return Math.round(baseScore + commentBonus + viewBonus)
  }, [score, commentCount, deal.views, deal.created_at])

  // Quick actions mutations
  const reportMutation = useMutation({
    mutationFn: (reason) => api.reportDeal(deal.id, reason),
    onSuccess: () => toast.success('Deal reported successfully'),
    onError: () => toast.error('Failed to report deal')
  })

  const hideMutation = useMutation({
    mutationFn: () => api.hideDeal(deal.id),
    onSuccess: () => {
      queryClient.setQueryData(['deals'], (old) => 
        old?.pages?.map(page => ({
          ...page,
          data: page.data.filter(d => d.id !== deal.id)
        }))
      )
      toast.success('Deal hidden')
    },
    onError: () => toast.error('Failed to hide deal')
  })

  const handleQuickReport = () => {
    const reason = prompt('Why are you reporting this deal?')
    if (reason) {
      reportMutation.mutate(reason)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const getTemperatureColor = () => {
    if (temperature >= 100) return 'text-red-500 bg-red-50'
    if (temperature >= 50) return 'text-orange-500 bg-orange-50'
    if (temperature >= 20) return 'text-yellow-500 bg-yellow-50'
    return 'text-blue-500 bg-blue-50'
  }

  const getDealTypeIcon = () => {
    if (deal.price === 0) return 'FREE'
    if (deal.coupon_code) return 'COUPON'
    if (deal.cashback) return 'CASHBACK'
    if (deal.is_flash_sale) return 'FLASH'
    return 'DEAL'
  }

  return (
    <article className={clsx(
      'card hover:shadow-lg transition-all duration-200 group relative overflow-hidden',
      compact ? 'p-4' : 'p-6',
      className
    )}>
      {/* Deal Temperature Indicator */}
      {enhanced && temperature > 20 && (
        <div className={clsx(
          'absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-xs font-bold',
          getTemperatureColor()
        )}>
          {temperature}° HOT
        </div>
      )}

      <div className="flex items-start space-x-4">
        {/* Vote Section */}
        <VoteButton 
          dealId={deal.id} 
          votes={score}
          userVote={deal.user_vote}
          className="flex-shrink-0"
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg" title={deal.deal_type}>
                  {getDealTypeIcon()}
                </span>
                
                {deal.coupon_code && (
                  <CompactCouponCode 
                    code={deal.coupon_code}
                    type={deal.coupon_type || 'code'}
                    discount={deal.discount_percentage}
                  />
                )}
                
                {deal.is_verified && (
                  <span className="text-green-500" title="Verified deal">
                    VERIFIED
                  </span>
                )}
              </div>

              <h2 className={clsx(
                'font-semibold text-gray-900 mb-2 leading-tight',
                compact ? 'text-base' : 'text-lg'
              )}>
                <Link 
                  to={`/deal/${deal.id}`}
                  className="hover:text-blue-600 focus-ring rounded"
                >
                  {deal.title}
                </Link>
              </h2>

              {/* Deal Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                {deal.merchant && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0v-4a1 1 0 011-1h4a1 1 0 011 1v4M7 7h10M7 10h10M7 13h10" />
                    </svg>
                    <span className="font-medium">{deal.merchant}</span>
                    {deal.merchant_rating && (
                      <span className="text-yellow-500">
                        ★{deal.merchant_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
                
                <span>{dateAgo(deal.created_at)}</span>
                
                {deal.views > 0 && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{deal.views.toLocaleString()}</span>
                  </div>
                )}

                {commentCount > 0 && (
                  <Link 
                    to={`/deal/${deal.id}#comments`}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{commentCount}</span>
                  </Link>
                )}

                {deal.expires_at && (
                  <ExpirationTimer expiresAt={deal.expires_at} />
                )}
              </div>
            </div>

            {/* Deal Image */}
            {deal.image_url && !imageError && (
              <div className={clsx(
                'flex-shrink-0 rounded-lg overflow-hidden bg-gray-100',
                compact ? 'w-16 h-16 ml-3' : 'w-20 h-20 ml-4'
              )}>
                <img
                  src={deal.image_url}
                  alt={deal.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>
            )}
          </div>

          {/* Price Section */}
          {deal.price !== undefined && (
            <div className="flex items-baseline space-x-3 mb-4">
              <div className="flex items-baseline space-x-2">
                <span className={clsx(
                  'font-bold text-green-600',
                  compact ? 'text-lg' : 'text-2xl'
                )}>
                  {deal.price === 0 ? 'FREE' : formatPrice(deal.price, deal.currency)}
                </span>
                
                {deal.list_price && deal.list_price > deal.price && (
                  <>
                    <span className="text-gray-500 line-through">
                      {formatPrice(deal.list_price, deal.currency)}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                      -{Math.round(((deal.list_price - deal.price) / deal.list_price) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {enhanced && deal.price_history && (
                <PriceHistory history={deal.price_history} currentPrice={deal.price} />
              )}
            </div>
          )}

          {/* Description Preview */}
          {!compact && deal.description && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                {truncate(deal.description, 150)}
                {deal.description.length > 150 && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    {showDetails ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
              
              {showDetails && deal.description.length > 150 && (
                <p className="text-gray-700 text-sm leading-relaxed mt-2">
                  {deal.description.substring(150)}
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <TagChips tags={tags} className="mb-4" />
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <AffiliateButton 
                dealId={deal.id} 
                className={clsx(compact ? 'text-sm px-3 py-1.5' : 'px-4 py-2')}
              >
                {deal.action_text || 'Go to Deal'}
              </AffiliateButton>
              
              <InlineDisclosure />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {enhanced && (
                <>
                  <BookmarkButton dealId={deal.id} />
                  <ShareButton deal={deal} />
                </>
              )}

              {/* More Actions Dropdown */}
              <div className="relative group">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <div className="py-1">
                    <button
                      onClick={handleQuickReport}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🚩 Report Deal
                    </button>
                    <button
                      onClick={() => hideMutation.mutate()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Hide Deal
                    </button>
                    <Link
                      to={`/deal/${deal.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🔗 Permalink
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {deal.status && deal.status !== 'active' && (
            <div className="mt-3">
              <span className={clsx(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                deal.status === 'expired' && 'bg-red-100 text-red-800',
                deal.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                deal.status === 'out_of_stock' && 'bg-gray-100 text-gray-800'
              )}>
                {deal.status === 'expired' && 'Expired'}
                {deal.status === 'pending' && 'Pending'}
                {deal.status === 'out_of_stock' && 'Out of Stock'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Deal Score (only for enhanced mode) */}
      {enhanced && !compact && (
        <DealScore 
          score={score}
          comments={commentCount}
          views={deal.views || 0}
          temperature={temperature}
        />
      )}
    </article>
  )
}
