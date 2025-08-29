import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '../components/Layout/Container'
import { VoteButton } from '../components/Deal/VoteButton'
import { AffiliateButton } from '../components/Deal/AffiliateButton'
import { InlineDisclosure } from '../components/Deal/InlineDisclosure'
import { TagChips } from '../components/Deal/TagChips'
import { ShareButton } from '../components/Deal/ShareButton'
import { BookmarkButton } from '../components/Deal/BookmarkButton'
import { PriceHistory } from '../components/Deal/PriceHistory'
import { ExpirationTimer } from '../components/Deal/ExpirationTimer'
import { DealAlerts } from '../components/Deal/DealAlerts'
import { SimilarDeals } from '../components/Deal/SimilarDeals'
import { DealComparison } from '../components/Deal/DealComparison'
import { StoreRating } from '../components/Deal/StoreRating'
import { DealReviews } from '../components/Deal/DealReviews'
import { AdSlot } from '../components/AdSlot'
import { CommentThread } from '../components/Comments/CommentThread'
import { Skeleton } from '../components/Loader/Skeleton'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { api } from '../lib/api'
import { formatPrice, formatDate, dateAgo, pluralize } from '../lib/format'
import { setPageMeta, setProductJsonLd } from '../lib/head'
import { useAdsense } from '../lib/useAdsense'
import { clsx } from 'clsx'

export default function DealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [dealAlert, setDealAlert] = useState(null)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [selectedComparisons, setSelectedComparisons] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // User preferences and tracking
  const [viewHistory, setViewHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('viewHistory') || '[]')
    } catch {
      return []
    }
  })
  
  const [bookmarkedDeals, setBookmarkedDeals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bookmarkedDeals') || '[]')
    } catch {
      return []
    }
  })
  
  useAdsense()

  // Fetch deal data
  const { data: deal, isLoading, error, refetch } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.getDeal(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  
  // Fetch similar deals
  const { data: similarDeals = [] } = useQuery({
    queryKey: ['similar-deals', deal?.category, deal?.merchant, id],
    queryFn: () => api.getSimilarDeals(id, { 
      category: deal?.category, 
      merchant: deal?.merchant,
      priceRange: [Math.max(0, deal?.price * 0.5), deal?.price * 2]
    }),
    enabled: !!deal,
  })
  
  // Fetch deal alerts for this user
  const { data: existingAlerts = [] } = useQuery({
    queryKey: ['deal-alerts', id],
    queryFn: () => api.getDealAlerts(id),
    enabled: !!deal && !!localStorage.getItem('demo_user'),
  })
  
  // Track deal views
  useEffect(() => {
    if (deal && !viewHistory.some(item => item.dealId === deal.id)) {
      const newView = {
        dealId: deal.id,
        title: deal.title,
        viewedAt: new Date().toISOString(),
        price: deal.price,
        merchant: deal.merchant,
      }
      
      const updatedHistory = [newView, ...viewHistory.slice(0, 49)] // Keep last 50
      setViewHistory(updatedHistory)
      localStorage.setItem('viewHistory', JSON.stringify(updatedHistory))
      
      // Track view in backend (mock)
      api.trackDealView(deal.id).catch(() => {})
    }
  }, [deal, viewHistory])
  
  // Set comprehensive SEO metadata
  useEffect(() => {
    if (deal) {
      const url = window.location.href
      const canonicalUrl = `${import.meta.env.VITE_SITE_URL || 'http://localhost:5173'}/deal/${deal.id}`
      
      // Enhanced meta description
      const discountPercent = deal.list_price && deal.price ? 
        Math.round(((deal.list_price - deal.price) / deal.list_price) * 100) : null
      
      const metaDescription = [
        deal.title,
        deal.price ? (deal.price === 0 ? 'FREE' : formatPrice(deal.price)) : '',
        discountPercent ? `${discountPercent}% OFF` : '',
        deal.merchant ? `at ${deal.merchant}` : '',
        deal.expires_at ? 'Limited time offer' : '',
      ].filter(Boolean).join(' - ')
      
      setPageMeta({
        title: `${deal.title} - ${deal.merchant || 'Deal'}`,
        description: metaDescription,
        image: deal.image_url,
        url,
        canonical: canonicalUrl,
        type: 'article',
        keywords: [
          deal.title,
          deal.merchant,
          deal.category,
          'deal',
          'discount',
          'save money',
          ...deal.tags || []
        ].filter(Boolean).join(', ')
      })

      // Enhanced JSON-LD structured data
      setProductJsonLd({
        deal: {
          ...deal,
          aggregateRating: deal.user_ratings ? {
            ratingValue: deal.average_rating || 4.2,
            reviewCount: deal.user_ratings.length,
            bestRating: 5,
            worstRating: 1
          } : undefined,
          offers: {
            price: deal.price || 0,
            priceCurrency: deal.currency || 'USD',
            availability: deal.status === 'active' ? 'InStock' : 'OutOfStock',
            validThrough: deal.expires_at,
            url: deal.url,
            seller: {
              name: deal.merchant,
              url: deal.merchant_url
            }
          }
        },
        url: canonicalUrl,
      })
    }
  }, [deal])
  
  // Mutations for user interactions
  const reportMutation = useMutation({
    mutationFn: (reason) => api.reportDeal(id, reason),
    onSuccess: () => {
      toast.success('Deal reported successfully. Thank you for keeping our community safe.')
      setShowReportModal(false)
    },
    onError: () => toast.error('Failed to report deal')
  })
  
  const rateDealMutation = useMutation({
    mutationFn: (rating) => api.rateDeal(id, rating),
    onSuccess: () => {
      toast.success('Thank you for your rating!')
      queryClient.invalidateQueries(['deal', id])
    },
    onError: () => toast.error('Failed to submit rating')
  })
  
  const alertMutation = useMutation({
    mutationFn: (alertData) => api.createDealAlert({ ...alertData, dealId: id }),
    onSuccess: () => {
      toast.success('Deal alert created! We\'ll notify you when the price drops.')
      queryClient.invalidateQueries(['deal-alerts', id])
    },
    onError: () => toast.error('Failed to create deal alert')
  })
  
  // Deal analysis and metrics
  const dealMetrics = useMemo(() => {
    if (!deal) return null
    
    const score = (deal.ups || 0) - (deal.downs || 0)
    const commentCount = deal.comments?.length || 0
    const hours = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60)
    const velocity = score / Math.max(hours, 1) // votes per hour
    
    return {
      score,
      commentCount,
      velocity: Math.round(velocity * 10) / 10,
      hotness: Math.max(0, score + velocity * 10),
      engagement: score + commentCount * 2 + (deal.views || 0) * 0.1,
      trustScore: calculateTrustScore(deal),
      dealQuality: calculateDealQuality(deal),
    }
  }, [deal])
  
  function calculateTrustScore(deal) {
    let score = 70 // Base score
    if (deal.is_verified) score += 15
    if (deal.merchant_rating >= 4.5) score += 10
    if (deal.user_ratings?.length >= 10) score += 5
    if (deal.ups > deal.downs * 2) score += 10
    if (deal.expires_at) score -= 5 // Time pressure reduces trust
    return Math.min(100, Math.max(0, score))
  }
  
  function calculateDealQuality(deal) {
    if (!deal.list_price || !deal.price) return 'Unknown'
    const discount = (deal.list_price - deal.price) / deal.list_price
    if (discount >= 0.5) return 'Excellent'
    if (discount >= 0.3) return 'Very Good'
    if (discount >= 0.15) return 'Good'
    if (discount >= 0.05) return 'Fair'
    return 'Minimal'
  }
  
  // Handlers
  const handleReport = async () => {
    const reasons = [
      'Expired or incorrect deal',
      'Misleading information',
      'Spam or duplicate',
      'Inappropriate content',
      'Price manipulation',
      'Other'
    ]
    
    const reason = await new Promise(resolve => {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4'
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 This Deal</h3>
          <div class="space-y-2 mb-4">
            ${reasons.map(r => `
              <label class="flex items-center">
                <input type="radio" name="reason" value="${r}" class="mr-2">
                <span class="text-gray-700 text-sm">${r}</span>
              </label>
            `).join('')}
          </div>
          <textarea id="additional-info" placeholder="Additional information (optional)" class="w-full p-3 border rounded-lg mb-4" rows="3"></textarea>
          <div class="flex space-x-3 justify-end">
            <button id="cancel-report" class="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button id="submit-report" class="px-4 py-2 bg-red-600 text-white rounded-lg">Report</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)
      
      modal.querySelector('#cancel-report').onclick = () => {
        document.body.removeChild(modal)
        resolve(null)
      }
      
      modal.querySelector('#submit-report').onclick = () => {
        const selectedReason = modal.querySelector('input[name="reason"]:checked')?.value
        const additionalInfo = modal.querySelector('#additional-info').value
        document.body.removeChild(modal)
        resolve(selectedReason ? `${selectedReason}${additionalInfo ? ` - ${additionalInfo}` : ''}` : null)
      }
    })
    
    if (reason) {
      reportMutation.mutate(reason)
    }
  }
  
  const handleCreateAlert = async () => {
    const targetPrice = await new Promise(resolve => {
      const currentPrice = deal.price || 0
      const suggestedPrice = Math.floor(currentPrice * 0.9) // 10% discount
      
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4'
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 Price Alert</h3>
          <p class="text-gray-600 mb-4">Get notified when this deal drops below your target price.</p>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Current Price</label>
            <div class="text-2xl font-bold text-green-600">${formatPrice(currentPrice)}</div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Target Price</label>
            <input type="number" id="target-price" value="${suggestedPrice}" step="0.01" min="0" max="${currentPrice}" 
                   class="w-full p-3 border rounded-lg">
          </div>
          <div class="flex space-x-3 justify-end">
            <button id="cancel-alert" class="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button id="create-alert" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Create Alert</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)
      
      modal.querySelector('#cancel-alert').onclick = () => {
        document.body.removeChild(modal)
        resolve(null)
      }
      
      modal.querySelector('#create-alert').onclick = () => {
        const price = parseFloat(modal.querySelector('#target-price').value)
        document.body.removeChild(modal)
        resolve(price)
      }
    })
    
    if (targetPrice && targetPrice < deal.price) {
      alertMutation.mutate({ targetPrice })
    }
  }
  
  if (error) {
    return (
      <Container className="py-8">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
          <p className="text-gray-600 mb-8">
            This deal may have expired, been removed, or the URL might be incorrect.
          </p>
          <div className="space-y-4">
            <Link to="/" className="btn-primary block">Browse Active Deals</Link>
            <div className="text-sm text-gray-500 space-x-4">
              <Link to="/forums" className="text-blue-600 hover:text-blue-700">Forums</Link>
              <span>•</span>
              <Link to="/post" className="text-blue-600 hover:text-blue-700">Post a Deal</Link>
              <span>•</span>
              <Link to="/contact" className="text-blue-600 hover:text-blue-700">Support</Link>
            </div>
          </div>
        </div>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-6 w-1/3" />
          <div className="card p-8 space-y-6">
            <div className="flex items-start space-x-6">
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-32 w-32" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </Container>
    )
  }

  const tags = [deal.merchant, deal.category, ...(deal.tags || [])].filter(Boolean)
  const isBookmarked = bookmarkedDeals.includes(deal.id)
  const hasActiveAlert = existingAlerts.some(alert => alert.isActive)

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Breadcrumb with Schema */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link 
                to="/" 
                itemProp="item"
                className="text-blue-600 hover:text-blue-700"
              >
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <span className="text-gray-400">›</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link 
                to={`/?category=${deal.category}`}
                itemProp="item" 
                className="text-blue-600 hover:text-blue-700"
              >
                <span itemProp="name">{deal.category}</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span className="text-gray-400">›</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-gray-900">
                {deal.title}
              </span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        {/* Main Deal Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Primary Content - Deal Details */}
          <div className="xl:col-span-3">
            {/* Deal Header Card */}
            <article className="card p-8 mb-6" itemScope itemType="https://schema.org/Product">
              <div className="flex items-start space-x-6">
                {/* Vote & Actions Column */}
                <div className="flex flex-col items-center space-y-4">
                  <VoteButton 
                    dealId={deal.id}
                    votes={dealMetrics?.score}
                    userVote={deal.user_vote}
                  />
                  
                  <div className="flex flex-col items-center space-y-2">
                    <BookmarkButton dealId={deal.id} size="lg" />
                    <ShareButton deal={deal} size="lg" />
                    
                    <button
                      onClick={handleReport}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                      title="Report deal"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Deal Title & Status */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight" itemProp="name">
                          {deal.title}
                        </h1>
                        
                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {deal.is_verified && (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified Deal
                            </span>
                          )}
                          
                          {deal.coupon_code && (
                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              Code: {deal.coupon_code}
                            </span>
                          )}
                          
                          {deal.is_flash_sale && (
                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              Flash Sale
                            </span>
                          )}
                          
                          {dealMetrics?.hotness > 50 && (
                            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                              Hot Deal
                            </span>
                          )}
                        </div>
                        
                        {/* Deal Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {deal.merchant && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0v-4a1 1 0 011-1h4a1 1 0 011 1v4M7 7h10M7 10h10M7 13h10" />
                              </svg>
                              <span className="font-medium" itemProp="brand">{deal.merchant}</span>
                            </div>
                          )}
                          
                          <span>•</span>
                          <span title={formatDate(deal.created_at)}>
                            Posted {dateAgo(deal.created_at)}
                          </span>
                          
                          {deal.views > 0 && (
                            <>
                              <span>•</span>
                              <span>{deal.views.toLocaleString()} views</span>
                            </>
                          )}
                          
                          {dealMetrics?.commentCount > 0 && (
                            <>
                              <span>•</span>
                              <Link 
                                to="#comments"
                                className="hover:text-blue-600"
                              >
                                {dealMetrics.commentCount} {pluralize(dealMetrics.commentCount, 'comment')}
                              </Link>
                            </>
                          )}
                          
                          {deal.expires_at && (
                            <>
                              <span>•</span>
                              <ExpirationTimer expiresAt={deal.expires_at} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comprehensive Price Section */}
                    <div className="mb-6" itemScope itemType="https://schema.org/Offer" itemProp="offers">
                      <meta itemProp="priceCurrency" content={deal.currency || 'USD'} />
                      <meta itemProp="price" content={deal.price || 0} />
                      <meta itemProp="availability" content={deal.status === 'active' ? 'InStock' : 'OutOfStock'} />
                      <meta itemProp="url" content={deal.url} />
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-baseline space-x-3">
                          <span className="text-4xl font-bold text-green-600">
                            {deal.price === 0 ? 'FREE' : formatPrice(deal.price, deal.currency)}
                          </span>
                          
                          {deal.list_price && deal.list_price > deal.price && (
                            <>
                              <span className="text-2xl text-gray-500 line-through">
                                {formatPrice(deal.list_price, deal.currency)}
                              </span>
                              <div className="flex flex-col items-center">
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                  -{Math.round(((deal.list_price - deal.price) / deal.list_price) * 100)}% OFF
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  Save {formatPrice(deal.list_price - deal.price)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Deal Quality Indicator */}
                        {dealMetrics?.dealQuality && (
                          <div className="flex items-center space-x-2">
                            <div className={clsx(
                              'w-3 h-3 rounded-full',
                              dealMetrics.dealQuality === 'Excellent' && 'bg-green-500',
                              dealMetrics.dealQuality === 'Very Good' && 'bg-blue-500',
                              dealMetrics.dealQuality === 'Good' && 'bg-yellow-500',
                              dealMetrics.dealQuality === 'Fair' && 'bg-orange-500',
                              dealMetrics.dealQuality === 'Minimal' && 'bg-gray-500'
                            )}></div>
                            <span className="text-sm text-gray-600">
                              {dealMetrics.dealQuality} Deal
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Price History Component */}
                      {deal.price_history && deal.price_history.length > 1 && (
                        <PriceHistory 
                          history={deal.price_history} 
                          currentPrice={deal.price}
                          className="mb-4"
                        />
                      )}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <TagChips tags={tags} className="mb-6" />
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                      <AffiliateButton 
                        dealId={deal.id}
                        className="text-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                      >
                        {deal.price === 0 ? 'Get Free Deal' : 'Get This Deal'}
                      </AffiliateButton>
                      
                      <button
                        onClick={handleCreateAlert}
                        disabled={hasActiveAlert || alertMutation.isPending}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM9 7h6a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2z" />
                        </svg>
                        <span>
                          {hasActiveAlert ? 'Alert Active' : 'Price Alert'}
                        </span>
                      </button>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <InlineDisclosure className="mr-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal Image */}
                {deal.image_url && (
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        itemProp="image"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Navigation Tabs */}
            <div className="card p-0 mb-6">
              <nav className="flex border-b border-gray-200">
                {[
                  { key: 'overview', label: 'Overview', icon: 'INFO' },
                  { key: 'details', label: 'Details', icon: '📋' },
                  { key: 'reviews', label: 'Reviews', icon: 'STAR', count: deal.user_ratings?.length },
                  { key: 'similar', label: 'Similar', icon: '🔍', count: similarDeals.length },
                  { key: 'discussions', label: 'Discussions', icon: 'CHAT', count: dealMetrics?.commentCount }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      'flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors',
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    )}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Deal Description */}
                    {deal.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          About This Deal
                        </h3>
                        <div className="prose prose-gray max-w-none">
                          <div itemProp="description">
                            {showFullDescription || deal.description.length <= 300 ? (
                              <p className="whitespace-pre-wrap">{deal.description}</p>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap">
                                  {deal.description.substring(0, 300)}...
                                </p>
                                <button
                                  onClick={() => setShowFullDescription(true)}
                                  className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                  Show more
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Deal Metrics Dashboard */}
                    {dealMetrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {dealMetrics.score > 0 ? `+${dealMetrics.score}` : dealMetrics.score}
                          </div>
                          <div className="text-sm text-green-600">Deal Score</div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(dealMetrics.engagement)}
                          </div>
                          <div className="text-sm text-blue-600">Engagement</div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {dealMetrics.trustScore}%
                          </div>
                          <div className="text-sm text-purple-600">Trust Score</div>
                        </div>
                        
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {dealMetrics.velocity}
                          </div>
                          <div className="text-sm text-orange-600">Velocity</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Store Rating */}
                    {deal.merchant && (
                      <StoreRating merchant={deal.merchant} rating={deal.merchant_rating} />
                    )}
                  </div>
                )}
                
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
                        <dl className="space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-gray-600">List Price</dt>
                            <dd className="font-medium text-gray-900">
                              {deal.list_price ? formatPrice(deal.list_price) : 'Not specified'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Sale Price</dt>
                            <dd className="font-medium text-green-600">
                              {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">You Save</dt>
                            <dd className="font-medium text-red-600">
                              {deal.list_price && deal.price ? formatPrice(deal.list_price - deal.price) : 'N/A'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Deal Type</dt>
                            <dd className="font-medium text-gray-900">
                              {deal.coupon_code ? 'Coupon Code' : deal.cashback ? 'Cashback' : 'Direct Discount'}
                            </dd>
                          </div>
                          {deal.expires_at && (
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Expires</dt>
                              <dd className="font-medium text-gray-900">
                                {formatDate(deal.expires_at)}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
                        <dl className="space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Store</dt>
                            <dd className="font-medium text-gray-900">{deal.merchant || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Store Rating</dt>
                            <dd className="font-medium text-gray-900">
                              {deal.merchant_rating ? `${deal.merchant_rating}/5 Stars` : 'Not rated'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Category</dt>
                            <dd className="font-medium text-gray-900">{deal.category || 'General'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Posted By</dt>
                            <dd className="font-medium text-gray-900">
                              <Link to={`/u/${deal.author}`} className="hover:text-blue-600">
                                {deal.author || 'Community'}
                              </Link>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'reviews' && (
                  <DealReviews 
                    dealId={deal.id} 
                    reviews={deal.user_ratings || []} 
                    userRating={userRating}
                    onRate={setUserRating}
                  />
                )}
                
                {activeTab === 'similar' && (
                  <SimilarDeals 
                    deals={similarDeals} 
                    currentDeal={deal}
                    comparisonMode={comparisonMode}
                    selectedComparisons={selectedComparisons}
                    onToggleComparison={setSelectedComparisons}
                  />
                )}
                
                {activeTab === 'discussions' && (
                  <div id="comments">
                    <CommentThread 
                      dealId={deal.id} 
                      comments={deal.comments || []} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Deal Comparison Tool */}
            {selectedComparisons.length > 0 && (
              <DealComparison 
                deals={[deal, ...selectedComparisons]}
                onRemove={(dealId) => setSelectedComparisons(prev => prev.filter(d => d.id !== dealId))}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleCreateAlert}
                  className="w-full btn-secondary text-left flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                  </svg>
                  <span>Create Price Alert</span>
                </button>
                
                <button className="w-full btn-secondary text-left flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Price History</span>
                </button>
                
                <Link to={`/forums/deals/new?title=${encodeURIComponent(deal.title)}`} className="w-full btn-secondary text-left flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Start Discussion</span>
                </Link>
              </div>
            </div>

            {/* Deal Statistics */}
            {dealMetrics && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Deal Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deal Score</span>
                    <span className={clsx(
                      'font-bold',
                      dealMetrics.score > 10 ? 'text-green-600' :
                      dealMetrics.score > 0 ? 'text-blue-600' :
                      'text-gray-600'
                    )}>
                      {dealMetrics.score > 0 ? `+${dealMetrics.score}` : dealMetrics.score}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium text-gray-900">
                      {deal.views?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-medium text-gray-900">
                      {dealMetrics.commentCount}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Trust Score</span>
                    <span className={clsx(
                      'font-bold',
                      dealMetrics.trustScore >= 80 ? 'text-green-600' :
                      dealMetrics.trustScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {dealMetrics.trustScore}%
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Velocity</span>
                      <span className="text-gray-700">
                        {dealMetrics.velocity} votes/hr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advertisement */}
            <AdSlot size="rectangle" />
          </div>
        </div>

        {/* Bottom Content */}
        <div className="mt-8 space-y-6">
          {/* Similar Deals Preview */}
          {similarDeals.length > 0 && activeTab !== 'similar' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Similar Deals
                </h3>
                <button
                  onClick={() => setActiveTab('similar')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All ({similarDeals.length})
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarDeals.slice(0, 3).map(similar => (
                  <Link
                    key={similar.id}
                    to={`/deal/${similar.id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {similar.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(similar.price)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {similar.merchant}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Ad */}
          <AdSlot size="leaderboard" />
        </div>
      </div>
    </Container>
  )
}
