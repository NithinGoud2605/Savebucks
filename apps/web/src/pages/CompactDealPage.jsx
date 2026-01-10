import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { formatPrice, dateAgo, truncate } from '../lib/format'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Tag,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Bookmark,
  BadgeCheck,
  Sparkles,
  Zap,
  AlertTriangle
} from 'lucide-react'
import ImageWithFallback from '../components/ui/ImageWithFallback'
import ReviewsAndRatings from '../components/Deal/ReviewsAndRatings'

// Compact Image Gallery
const CompactGallery = ({ images, title }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const validImages = Array.isArray(images) ? images.filter(Boolean) : []

  if (validImages.length === 0) {
    return (
      <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <span className="text-sm">No image</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <motion.div
        className="aspect-square bg-white rounded-xl border border-slate-200 p-3 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ImageWithFallback
          src={validImages[activeIndex]}
          alt={title}
          className="w-full h-full object-contain"
        />
      </motion.div>

      {validImages.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {validImages.slice(0, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-12 h-12 flex-shrink-0 rounded-lg border-2 p-1 transition-all ${i === activeIndex
                  ? 'border-violet-500 ring-2 ring-violet-200'
                  : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <ImageWithFallback src={img} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Inline Price Badge
const PriceBadge = ({ deal }) => {
  const hasDiscount = deal.original_price && deal.original_price > deal.price
  const discount = hasDiscount
    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
    : deal.discount_percentage

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-2xl font-bold text-emerald-600">
        {formatPrice(deal.price)}
      </span>

      {hasDiscount && (
        <span className="text-base text-slate-400 line-through">
          {formatPrice(deal.original_price)}
        </span>
      )}

      {discount > 0 && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`px-2.5 py-1 text-white text-sm font-bold rounded-full ${discount >= 50
              ? 'bg-gradient-to-r from-red-500 to-pink-500'
              : discount >= 30
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
            }`}
        >
          -{discount}%
        </motion.span>
      )}
    </div>
  )
}

// Coupon Code Component
const CouponCode = ({ code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-amber-50 border border-dashed border-amber-300 rounded-lg px-3 py-2"
    >
      <Tag className="w-4 h-4 text-amber-600" />
      <code className="font-mono font-bold text-amber-900 flex-1">{code}</code>
      <motion.button
        onClick={handleCopy}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded font-medium transition-colors ${copied
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
      >
        <Copy className="w-3 h-3" />
        {copied ? 'Copied!' : 'Copy'}
      </motion.button>
    </motion.div>
  )
}

// Vote Buttons
const VoteButtons = ({ deal, onVote }) => (
  <div className="flex items-center gap-2">
    <motion.button
      onClick={() => onVote('up')}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${deal?.userVote === 1
          ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
    >
      <ThumbsUp className="w-4 h-4" />
      <span>{deal.upvotes || 0}</span>
    </motion.button>

    <motion.button
      onClick={() => onVote('down')}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${deal?.userVote === -1
          ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
          : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
        }`}
    >
      <ThumbsDown className="w-4 h-4" />
      <span>{deal.downvotes || 0}</span>
    </motion.button>

    <span className="text-sm text-slate-500 ml-2">
      Score: <span className="font-bold text-slate-900">{(deal.upvotes || 0) - (deal.downvotes || 0)}</span>
    </span>
  </div>
)

// Trust Badges Inline
const TrustBadges = () => (
  <div className="flex items-center gap-4 text-xs text-slate-500">
    <div className="flex items-center gap-1.5">
      <Shield className="w-4 h-4 text-emerald-500" />
      <span>Secure</span>
    </div>
    <div className="flex items-center gap-1.5">
      <Truck className="w-4 h-4 text-blue-500" />
      <span>Fast delivery</span>
    </div>
    <div className="flex items-center gap-1.5">
      <RotateCcw className="w-4 h-4 text-purple-500" />
      <span>Easy returns</span>
    </div>
  </div>
)

// Main Component
export default function StreamlinedDealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Fetch deal
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.getDeal(id),
    enabled: !!id
  })

  // Mutations
  const bookmarkMutation = useMutation({
    mutationFn: (dealId) => api.toggleBookmark(dealId),
    onSuccess: () => {
      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? 'Removed from saves' : 'Saved!')
    }
  })

  const voteMutation = useMutation({
    mutationFn: ({ dealId, vote }) => {
      const value = vote === 'up' ? 1 : vote === 'down' ? -1 : null
      return api.voteDeal(dealId, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deal', id])
      toast.success('Vote recorded')
    },
    onError: () => toast.error('Failed to vote')
  })

  const handleVote = (vote) => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }
    const currentVote = deal?.userVote
    const newVote = currentVote === vote ? null : vote
    voteMutation.mutate({ dealId: id, vote: newVote })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          url: window.location.href
        })
      } catch {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied!')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
            <div className="lg:col-span-2">
              <div className="aspect-square bg-slate-200 rounded-xl" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-8 bg-slate-200 rounded w-1/2" />
              <div className="h-32 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error
  if (error || !deal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Deal Not Found</h1>
          <p className="text-slate-600 mb-4">This deal doesn't exist or was removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Browse Deals
          </button>
        </div>
      </div>
    )
  }

  const images = [
    deal.featured_image,
    ...(Array.isArray(deal.deal_images) ? deal.deal_images : []),
    deal.image_url
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50 pt-14">
      {/* Compact Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link to="/" className="hover:text-violet-600">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {deal.categories && (
              <>
                <Link to={`/category/${deal.categories.slug}`} className="hover:text-violet-600">
                  {deal.categories.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-slate-400 truncate max-w-[180px]">{truncate(deal.title, 35)}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Image */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <CompactGallery images={images} title={deal.title} />
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-3 space-y-4">

            {/* Title & Meta */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">
                    {deal.title}
                  </h1>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Link
                      to={`/company/${deal.companies?.slug || deal.merchant}`}
                      className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
                    >
                      {deal.companies?.logo_url ? (
                        <img src={deal.companies.logo_url} alt="" className="w-4 h-4 rounded object-contain" />
                      ) : (
                        <div className="w-4 h-4 bg-violet-100 rounded flex items-center justify-center text-[10px] font-bold text-violet-700">
                          {(deal.companies?.name || deal.merchant || 'S').charAt(0)}
                        </div>
                      )}
                      {deal.companies?.name || deal.merchant}
                      {deal.companies?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </Link>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateAgo(deal.created_at)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {deal.views_count || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={() => user ? bookmarkMutation.mutate(id) : toast.error('Login to save')}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-lg transition-colors ${isBookmarked ? 'bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-400'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    onClick={handleShare}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <PriceBadge deal={deal} />

              {deal.original_price && deal.original_price > deal.price && (
                <p className="mt-2 text-sm text-emerald-700 font-medium flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  You save {formatPrice(deal.original_price - deal.price)}
                </p>
              )}

              {deal.coupon_code && (
                <div className="mt-3">
                  <CouponCode code={deal.coupon_code} />
                </div>
              )}

              <motion.a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => api.trackDealClick(deal.id).catch(() => { })}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Get This Deal
                <ExternalLink className="w-4 h-4" />
              </motion.a>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <VoteButtons deal={deal} onVote={handleVote} />
              </div>
            </div>

            {/* Description */}
            {deal.description && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Details</h3>
                <p className={`text-sm text-slate-600 leading-relaxed ${!showFullDescription && deal.description.length > 200 ? 'line-clamp-3' : ''
                  }`}>
                  {deal.description}
                </p>
                {deal.description.length > 200 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-medium"
                  >
                    {showFullDescription ? (
                      <>Show less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Read more <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}

                {deal.tags && deal.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {deal.tags.slice(0, 6).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                        #{tag.name || tag.slug || tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trust & Merchant */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <TrustBadges />

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/company/${deal.companies?.slug || deal.merchant}`}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-violet-600"
                >
                  {deal.companies?.logo_url ? (
                    <img src={deal.companies.logo_url} alt="" className="w-6 h-6 rounded object-contain border border-slate-200" />
                  ) : (
                    <div className="w-6 h-6 bg-violet-100 rounded flex items-center justify-center text-xs font-bold text-violet-700">
                      {(deal.companies?.name || deal.merchant || 'S').charAt(0)}
                    </div>
                  )}
                  <span>{deal.companies?.name || deal.merchant}</span>
                  {deal.companies?.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                </Link>
                <a
                  href={deal.companies?.website_url || deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  Visit Store <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {deal?.id && (
          <div className="mt-6">
            <ReviewsAndRatings dealId={String(deal.id)} />
          </div>
        )}
      </div>
    </div>
  )
}
