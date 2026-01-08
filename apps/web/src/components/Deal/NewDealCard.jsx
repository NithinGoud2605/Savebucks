import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  Eye,
  Clock,
  Star,
  Gift,
  Zap,
  Bookmark,
  BookmarkCheck
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import ImageWithFallback from '../ui/ImageWithFallback'
import SubmitterBadge from './SubmitterBadge'

export function NewDealCard({ deal, index = 0, variant = 'default' }) {
  const { user } = useAuth()
  const qc = useQueryClient()

  // State for image navigation
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Get all available images
  const allImages = []
  if (deal.featured_image) allImages.push(deal.featured_image)
  if (deal.deal_images && Array.isArray(deal.deal_images)) {
    deal.deal_images.forEach(img => {
      if (img && !allImages.includes(img)) allImages.push(img)
    })
  }
  if (deal.image_url && !allImages.includes(deal.image_url)) allImages.push(deal.image_url)

  const images = allImages
  const currentImage = images[selectedImageIndex] || deal.featured_image || deal.image_url

  // Get company name - prioritize company relationship, fallback to merchant
  const getCompanyName = () => {
    if (deal.company?.name) return deal.company.name
    if (deal.companies?.name) return deal.companies.name
    if (deal.merchant) return deal.merchant
    return 'Company'
  }

  const companyName = getCompanyName()

  // Get submitter name (same logic as deal page)
  const getSubmitterName = () => {
    if (deal.submitter?.handle) return deal.submitter.handle
    if (deal.submitter?.id) return `User ${deal.submitter.id}`
    if (deal.submitter_id) return `User ${deal.submitter_id}`
    return 'User'
  }

  const submitterName = getSubmitterName()


  // Calculate discount percentage
  const discountPercentage = deal.discount_percentage ||
    (deal.price && deal.original_price && deal.original_price > deal.price
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : 0)

  // Handle deal click for analytics
  const handleDealClick = (source) => {
    if (deal.id) {
      api.trackDealClick(deal.id, source).catch(console.error)
    }
  }

  // Save/unsave deal
  const saveMutation = useMutation({
    mutationFn: ({ dealId, action }) => action === 'save' ? api.saveDeal(dealId) : api.unsaveDeal(dealId),
    onSuccess: (data, variables) => {
      if (variables.action === 'save') {
        setIsSaved(true)
      } else {
        setIsSaved(false)
      }
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['deal', deal.id] })
    },
    onError: (error) => {
      console.error('Save/unsave error:', error)
    }
  })

  const handleSave = async () => {
    if (!user || isSaving) return

    setIsSaving(true)
    try {
      if (isSaved) {
        await saveMutation.mutateAsync({ dealId: deal.id, action: 'unsave' })
      } else {
        await saveMutation.mutateAsync({ dealId: deal.id, action: 'save' })
      }
    } catch (error) {
      console.error('Save/unsave error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const timeAgo = (timestamp) => {
    if (!timestamp) return ''
    const seconds = Math.floor((Date.now() / 1000) - timestamp)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -2 }}
        className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <div
          className="block cursor-pointer"
          onClick={() => {
            handleDealClick('deal_card_compact')
            window.location.href = `/deal/${deal.id}`
          }}
        >
          <div className="flex p-2">
            {/* Image */}
            <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
              <ImageWithFallback
                src={currentImage}
                alt={deal.title}
                className="w-full h-full object-cover"
                fallbackClassName="w-full h-full"
              />
            </div>

            {/* Content */}
            <div className="flex-1 ml-2 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-xs line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {deal.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-primary-600 font-medium">{companyName}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">by {submitterName}</span>
                  </div>
                </div>
              </div>

              {/* Price and Stats */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  {deal.price && (
                    <span className="text-xs font-semibold text-gray-900">
                      ${Number(deal.price).toFixed(2)}
                    </span>
                  )}
                  {discountPercentage > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">
                      -{discountPercentage}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">{deal.views_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">{deal.ups || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    )
  }

  // Default variant
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div
        className="block cursor-pointer"
        onClick={() => {
          handleDealClick('deal_card_default')
          window.location.href = `/deal/${deal.id}`
        }}
      >
        {/* Image Section */}
        <div className="relative aspect-[3/2] overflow-hidden bg-gray-50">
          <ImageWithFallback
            src={currentImage}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackClassName="w-full h-full"
          />

          {/* Image Navigation for multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
                }}
                disabled={selectedImageIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white bg-opacity-80 rounded-full shadow-sm disabled:opacity-50 hover:bg-opacity-90 transition-all z-10"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))
                }}
                disabled={selectedImageIndex === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white bg-opacity-80 rounded-full shadow-sm disabled:opacity-50 hover:bg-opacity-90 transition-all z-10"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded z-10">
                {selectedImageIndex + 1}/{images.length}
              </div>
            </>
          )}

          {/* Small Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2">
              <div className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                -{discountPercentage}%
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {deal.is_featured && (
              <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                <Star className="w-3 h-3" />
                Featured
              </div>
            )}
            {deal.free_shipping && (
              <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                <Gift className="w-3 h-3" />
                Free Ship
              </div>
            )}
            {deal.deal_type === 'lightning' && (
              <div className="bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                <Zap className="w-3 h-3" />
                Lightning
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Header */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
              {deal.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span className="text-primary-600 font-medium">{companyName}</span>
              <span className="text-gray-400">•</span>
              <span>by {submitterName}</span>
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-3">
            {deal.price ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ${Number(deal.price).toFixed(2)}
                </span>
                {deal.original_price && deal.original_price > deal.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${Number(deal.original_price).toFixed(2)}
                  </span>
                )}
                {discountPercentage > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                    -{discountPercentage}% OFF
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Price not available</span>
            )}

            {deal.discount_amount && (
              <div className="text-xs text-green-600 font-medium mt-0.5">
                Save ${Number(deal.discount_amount).toFixed(2)}
              </div>
            )}
          </div>

          {/* Actions and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDealClick('deal_card_external_link')
                  window.open(deal.url, '_blank')
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all"
              >
                Get Deal
                <ExternalLink className="w-3 h-3" />
              </motion.button>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSave()
                }}
                disabled={isSaving}
                className={`p-1.5 rounded-md border transition-all ${isSaved
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isSaved ? 'Remove from saved items' : 'Save deal'}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-3 h-3 fill-current" />
                ) : (
                  <Bookmark className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-gray-500">
              <div className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                <span className="text-xs">{deal.views_count || 0}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">{deal.ups || 0}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{timeAgo(deal.created)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default NewDealCard
