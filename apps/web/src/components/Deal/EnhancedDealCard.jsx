import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../ui/Card'
import { Button, IconButton } from '../ui/Button'
import { Badge, StatusBadge, TrendBadge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { VoteButton } from './VoteButton'
import { AffiliateButton } from './AffiliateButton'
import { ShareButton } from './ShareButton'
import { BookmarkButton } from './BookmarkButton'
import { ExpirationTimer } from './ExpirationTimer'
import { formatPrice, dateAgo, truncate } from '../../lib/format'
import { clsx } from 'clsx'

export function EnhancedDealCard({ 
  deal, 
  compact = false, 
  showStats = true,
  variant = 'default'
}) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  const score = (deal.ups || 0) - (deal.downs || 0)
  const commentCount = deal.comments?.length || 0
  const viewCount = deal.views || 0
  
  // Get images array - prioritize deal_images, fallback to image_url
  const images = deal.deal_images?.length > 0 ? deal.deal_images : (deal.image_url ? [deal.image_url] : [])
  const currentImage = images[selectedImageIndex] || deal.image_url
  
  // Calculate deal temperature/hotness
  const temperature = React.useMemo(() => {
    const hoursOld = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60)
    const ageMultiplier = Math.max(0.1, 1 / (1 + hoursOld / 6))
    const baseScore = score * ageMultiplier
    const commentBonus = commentCount * 3
    const viewBonus = viewCount * 0.1
    return Math.round(baseScore + commentBonus + viewBonus)
  }, [score, commentCount, viewCount, deal.created_at])

  // Get deal type and styling
  const getDealType = () => {
    if (deal.price === 0) return { 
      label: 'FREE', 
      variant: 'gradient',
      icon: 'gift',
      gradient: 'from-green-500 to-emerald-600'
    }
    if (deal.coupon_code) return { 
      label: 'COUPON', 
      variant: 'primary',
      icon: 'ticket',
      gradient: 'from-purple-500 to-pink-500'
    }
    if (deal.discount_percentage >= 70) return { 
      label: 'HOT DEAL', 
      variant: 'danger',
      icon: 'fire',
      gradient: 'from-red-500 to-orange-500'
    }
    if (deal.discount_percentage >= 50) return { 
      label: 'GREAT DEAL', 
      variant: 'warning',
      icon: 'zap',
      gradient: 'from-orange-500 to-yellow-500'
    }
    if (deal.discount_percentage >= 30) return { 
      label: 'GOOD DEAL', 
      variant: 'success',
      icon: 'tag',
      gradient: 'from-blue-500 to-indigo-500'
    }
    return { 
      label: 'DEAL', 
      variant: 'secondary',
      icon: 'tag',
      gradient: 'from-gray-500 to-gray-600'
    }
  }

  const dealType = getDealType()

  // Temperature styling
  const getTemperatureStyle = () => {
    if (temperature >= 100) return { color: 'from-red-500 to-pink-500', text: 'text-white' }
    if (temperature >= 50) return { color: 'from-orange-500 to-red-500', text: 'text-white' }
    if (temperature >= 20) return { color: 'from-yellow-500 to-orange-500', text: 'text-white' }
    return { color: 'from-blue-500 to-purple-500', text: 'text-white' }
  }

  const tempStyle = getTemperatureStyle()

  // Card variants
  const cardVariants = {
    default: 'bg-white border-secondary-200',
    featured: 'bg-gradient-to-br from-white to-primary-50 border-primary-200 ring-1 ring-primary-200',
    hot: 'bg-gradient-to-br from-white to-red-50 border-red-200 ring-1 ring-red-200',
    trending: 'bg-gradient-to-br from-white to-orange-50 border-orange-200 ring-1 ring-orange-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={clsx('group', className)}
    >
      <Card
        variant="elevated"
        padding="none"
        className={clsx(
          'overflow-hidden transition-all duration-300',
          'hover:shadow-2xl hover:ring-1 hover:ring-primary-200',
          cardVariants[variant],
          featured && 'ring-2 ring-primary-300',
          className
        )}
        hover
      >
        {/* Top gradient bar */}
        <div className={`h-1 bg-gradient-to-r ${dealType.gradient}`} />
        
        {/* Card Header with badges */}
        <div className="relative p-4 pb-2">
          <div className="flex items-start justify-between mb-3">
            {/* Deal type badge */}
            <Badge 
              variant={dealType.variant}
              leftIcon={dealType.icon}
              className="shadow-sm"
            >
              {dealType.label}
            </Badge>

            {/* Temperature badge */}
            {temperature > 20 && (
              <Badge
                variant="gradient"
                className={clsx(
                  'bg-gradient-to-r shadow-lg animate-pulse',
                  tempStyle.color,
                  tempStyle.text
                )}
                leftIcon="fire"
              >
                {temperature}°
              </Badge>
            )}
          </div>

          {/* Deal title */}
          <Link 
            to={`/deals/${deal.id}`}
            className="block group-hover:text-primary-600 transition-colors"
          >
            <h3 className={clsx(
              'font-bold leading-tight mb-2',
              compact ? 'text-lg' : 'text-xl'
            )}>
              {deal.title}
            </h3>
          </Link>

          {/* Company and category */}
          <div className="flex items-center gap-2 text-sm text-secondary-600 mb-3">
            {deal.company && (
              <Link 
                to={`/companies/${deal.company.slug}`}
                className="font-medium hover:text-primary-600 transition-colors"
              >
                {deal.company.name}
              </Link>
            )}
            {deal.category && (
              <>
                <span>•</span>
                <Link 
                  to={`/categories/${deal.category.slug}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {deal.category.name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Deal image */}
        {currentImage && !imageError && (
          <div className="relative mx-4 mb-4 rounded-xl overflow-hidden bg-secondary-100">
            <div className={clsx(
              'aspect-video w-full transition-all duration-300',
              !imageLoaded && 'animate-pulse bg-secondary-200'
            )}>
              <img
                src={currentImage}
                alt={deal.title}
                className={clsx(
                  'w-full h-full object-cover transition-all duration-300',
                  'group-hover:scale-105',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
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
                      setImageLoaded(false)
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
                      setImageLoaded(false)
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
            </div>
            
            {/* Image overlay with quick actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-3 right-3 flex gap-2">
                <IconButton
                  icon="eye"
                  size="sm"
                  variant="glass"
                  className="text-white hover:bg-white/20"
                />
                <IconButton
                  icon="share"
                  size="sm"
                  variant="glass"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Thumbnail navigation for multiple images */}
        {images.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto mx-4 mb-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedImageIndex(index)
                  setImageLoaded(false)
                }}
                className={clsx(
                  'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
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

        {/* Deal content */}
        <CardContent className="pt-0">
          {/* Price section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              {deal.original_price && deal.original_price > deal.price && (
                <span className="text-lg text-secondary-500 line-through">
                  {formatPrice(deal.original_price)}
                </span>
              )}
              <span className={clsx(
                'font-bold text-primary-600',
                compact ? 'text-xl' : 'text-2xl'
              )}>
                {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
              </span>
              {deal.discount_percentage > 0 && (
                <Badge variant="success" size="sm">
                  -{deal.discount_percentage}%
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {deal.description && (
            <div className="mb-4">
              <p className={clsx(
                'text-secondary-700 leading-relaxed',
                compact ? 'text-sm' : 'text-base'
              )}>
                {showFullDescription 
                  ? deal.description 
                  : truncate(deal.description, compact ? 80 : 120)
                }
              </p>
              {deal.description.length > (compact ? 80 : 120) && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 transition-colors"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Coupon code */}
          {deal.coupon_code && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">Coupon Code</p>
                  <code className="text-lg font-mono font-bold text-purple-700">
                    {deal.coupon_code}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon="copy"
                  onClick={() => navigator.clipboard.writeText(deal.coupon_code)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {deal.tags.slice(0, compact ? 3 : 5).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  size="xs"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {deal.tags.length > (compact ? 3 : 5) && (
                <Badge variant="secondary" size="xs">
                  +{deal.tags.length - (compact ? 3 : 5)}
                </Badge>
              )}
            </div>
          )}

          {/* Expiration timer */}
          {deal.expires_at && (
            <div className="mb-4">
              <ExpirationTimer expiresAt={deal.expires_at} />
            </div>
          )}
        </CardContent>

        {/* Card Footer */}
        {showActions && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
              {/* Stats */}
              {showStats && (
                <div className="flex items-center gap-4 text-sm text-secondary-600">
                  <div className="flex items-center gap-1">
                    <Icon name="thumbsUp" size="sm" />
                    <span>{score}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="messageCircle" size="sm" />
                    <span>{commentCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="eye" size="sm" />
                    <span>{viewCount}</span>
                  </div>
                  <span className="text-xs">
                    {dateAgo(deal.created_at)}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <VoteButton deal={deal} />
                <BookmarkButton deal={deal} />
                <ShareButton deal={deal} />
                <AffiliateButton 
                  deal={deal}
                  variant="primary"
                  size="sm"
                  className="ml-2"
                >
                  Get Deal
                </AffiliateButton>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default EnhancedDealCard
