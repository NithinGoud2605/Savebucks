import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { VoteButton } from './VoteButton'
import { AffiliateButton } from './AffiliateButton'
import { ShareButton } from './ShareButton'
import { BookmarkButton } from './BookmarkButton'
import { ExpirationTimer } from './ExpirationTimer'
import { formatPrice, dateAgo, truncate } from '../../lib/format'
import { getCompanyName } from '../../lib/companyUtils'
import { clsx } from 'clsx'
import { Eye } from 'lucide-react'

export function CommunityDealCard({ deal, className, compact = false }) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const score = (deal.ups || 0) - (deal.downs || 0)
  const commentCount = deal.comments?.length || 0

  // Get images array - prioritize deal_images, fallback to image_url
  const images = deal.deal_images?.length > 0 ? deal.deal_images : (deal.image_url ? [deal.image_url] : [])
  const currentImage = images[selectedImageIndex] || deal.image_url

  // Calculate deal temperature/hotness
  const temperature = React.useMemo(() => {
    const hoursOld = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60)
    const ageMultiplier = Math.max(0.1, 1 / (1 + hoursOld / 6))
    const baseScore = score * ageMultiplier
    const commentBonus = commentCount * 3
    const viewBonus = (deal.views || 0) * 0.1
    return Math.round(baseScore + commentBonus + viewBonus)
  }, [score, commentCount, deal.views, deal.created_at])

  const getTemperatureStyle = () => {
    if (temperature >= 100) return 'from-red-500 to-pink-500 text-white'
    if (temperature >= 50) return 'from-orange-500 to-red-500 text-white'
    if (temperature >= 20) return 'from-yellow-500 to-orange-500 text-white'
    return 'from-blue-500 to-purple-500 text-white'
  }

  const getDealTypeInfo = () => {
    if (deal.price === 0) return { label: 'FREE', color: 'from-teal-500 to-cyan-500', icon: '🎁' }
    if (deal.coupon_code) return { label: 'COUPON', color: 'from-purple-500 to-pink-500', icon: '🎫' }
    if (deal.discount_percentage >= 50) return { label: 'HOT DEAL', color: 'from-red-500 to-orange-500', icon: '🔥' }
    if (deal.discount_percentage >= 30) return { label: 'GOOD DEAL', color: 'from-orange-500 to-yellow-500', icon: '💰' }
    return { label: 'DEAL', color: 'from-blue-500 to-indigo-500', icon: '💎' }
  }

  const dealType = getDealTypeInfo()

  return (
    <article className={clsx(
      'relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group',
      'border border-gray-100 hover:border-primary-200',
      'transform hover:-translate-y-1',
      className
    )}>
      {/* Colorful top border */}
      <div className={`h-1 bg-gradient-to-r ${dealType.color}`} />

      {/* Temperature indicator */}
      {temperature > 20 && (
        <div className={clsx(
          'absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg',
          'bg-gradient-to-r', getTemperatureStyle(),
          'animate-pulse'
        )}>
          🔥 {temperature}°
        </div>
      )}

      {/* Deal type badge */}
      <div className={clsx(
        'absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg',
        'bg-gradient-to-r', dealType.color
      )}>
        <span className="mr-1">{dealType.icon}</span>
        {dealType.label}
      </div>

      <div className="p-6">
        {/* Header with submitter info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Submitter Avatar */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {deal.submitter?.handle ? deal.submitter.handle.charAt(0).toUpperCase() : '?'}
              </div>
              {deal.submitter?.role === 'admin' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">👑</span>
                </div>
              )}
            </div>

            {/* Submitter details */}
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/user/${deal.submitter?.handle || 'unknown'}`}
                  className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  @{deal.submitter?.handle || 'Anonymous'}
                </Link>
                {deal.submitter?.karma > 100 && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    ⭐ {deal.submitter.karma}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-2">
                <span>{dateAgo(deal.created_at)}</span>
                {deal.submitter?.total_posts > 0 && (
                  <span>• {deal.submitter.total_posts} posts</span>
                )}
              </div>
            </div>
          </div>

          {/* Vote button */}
          <VoteButton
            dealId={deal.id}
            votes={score}
            userVote={deal.user_vote}
            className="flex-shrink-0"
          />
        </div>

        {/* Deal content */}
        <div className="space-y-4">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            <Link
              to={`/deal/${deal.id}`}
              className="hover:text-primary-600 transition-colors focus-ring rounded-lg"
            >
              {deal.title}
            </Link>
          </h2>

          {/* Deal image */}
          {currentImage && !imageError && (
            <div className="relative rounded-xl overflow-hidden bg-gray-50 aspect-video">
              <img
                src={currentImage}
                alt={deal.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={() => setImageError(true)}
              />

              {/* Image Navigation for multiple images */}
              {images.length > 1 && (
                <>
                  {/* Previous button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
                    }}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-90 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Next button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))
                    }}
                    disabled={selectedImageIndex === images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-90 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image counter */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}

          {/* Thumbnail navigation for multiple images */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto mt-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
                    selectedImageIndex === index
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-secondary-200 hover:border-secondary-300'
                  )}
                >
                  <img
                    src={image}
                    alt={`${deal.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Price section */}
          {deal.price !== undefined && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-black text-teal-600">
                    {deal.price === 0 ? 'FREE' : formatPrice(deal.price, deal.currency)}
                  </span>

                  {deal.list_price && deal.list_price > deal.price && (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(deal.list_price, deal.currency)}
                      </span>
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce">
                        -{Math.round(((deal.list_price - deal.price) / deal.list_price) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {deal.expires_at && (
                  <ExpirationTimer expiresAt={deal.expires_at} />
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {deal.description && (
            <div className="text-gray-700 leading-relaxed">
              <p>
                {showFullDescription ? deal.description : truncate(deal.description, 150)}
                {deal.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            </div>
          )}

          {/* Merchant and category tags */}
          <div className="flex flex-wrap gap-2">
            {getCompanyName(deal) && (
              <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                🏪 {getCompanyName(deal)}
              </span>
            )}
            {deal.category && (
              <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                📂 {deal.category?.name || deal.category}
              </span>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3 text-blue-500" />
                <span>{(deal.views_count || deal.views || 0).toLocaleString()}</span>
              </div>

              {commentCount > 0 && (
                <Link
                  to={`/deal/${deal.id}#comments`}
                  className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
                >
                  <svg className="w-3 h-3 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>{commentCount}</span>
                </Link>
              )}

              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>{Math.max(0, score)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              {dateAgo(deal.created_at)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <AffiliateButton
              dealId={deal.id}
              className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              🛒 Get This Deal
            </AffiliateButton>

            <div className="flex items-center space-x-2">
              <BookmarkButton
                dealId={deal.id}
                className="p-3 bg-gray-50 hover:bg-gray-200 rounded-xl transition-colors"
              />
              <ShareButton
                deal={deal}
                className="p-3 bg-gray-50 hover:bg-gray-200 rounded-xl transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div className={`h-1 bg-gradient-to-r ${dealType.color} opacity-50`} />
    </article>
  )
}
