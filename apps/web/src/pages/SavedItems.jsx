import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { toast } from '../lib/toast'
import {
  BookmarkIcon,
  HeartIcon,
  EyeIcon,
  ShoppingCartIcon,
  TagIcon,
  CalendarIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid'
import ImageWithFallback from '../components/ui/ImageWithFallback'

const SavedItems = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'deals', 'coupons'

  // Fetch saved items
  const { data: savedData, isLoading } = useQuery({
    queryKey: ['saved-items', activeTab],
    queryFn: () => api.getSavedItems(activeTab),
    enabled: !!user
  })

  // Unsave deal mutation
  const unsaveDealMutation = useMutation({
    mutationFn: (dealId) => api.unsaveDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-items'])
      toast.success('Deal removed from saved items')
    },
    onError: () => {
      toast.error('Failed to remove deal')
    }
  })

  // Unsave coupon mutation
  const unsaveCouponMutation = useMutation({
    mutationFn: (couponId) => api.unsaveCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-items'])
      toast.success('Coupon removed from saved items')
    },
    onError: () => {
      toast.error('Failed to remove coupon')
    }
  })

  const handleUnsaveDeal = (dealId) => {
    unsaveDealMutation.mutate(dealId)
  }

  const handleUnsaveCoupon = (couponId) => {
    unsaveCouponMutation.mutate(couponId)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view saved items</h2>
          <p className="text-gray-600 mb-6">Save deals and coupons to access them later</p>
          <button
            onClick={() => navigate('/signin')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const items = savedData?.items || []
  const dealsCount = savedData?.deals_count || 0
  const couponsCount = savedData?.coupons_count || 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Saved Items</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 sm:mb-8 bg-gray-50 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'all'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('deals')}
          className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'deals'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Deals ({dealsCount})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'coupons'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Coupons ({couponsCount})
        </button>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved items yet</h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'all'
              ? 'Start saving deals and coupons to see them here'
              : `No saved ${activeTab} yet`
            }
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Deals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isDeal = 'deal' in item
            const data = isDeal ? item.deal : item.coupon
            const itemId = isDeal ? item.deal_id : item.coupon_id

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative">
                  <ImageWithFallback
                    src={data.image_url}
                    alt={data.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                    fallbackClassName="w-full h-48 bg-gray-50 rounded-t-lg"
                  />

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDeal
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {isDeal ? 'Deal' : 'Coupon'}
                    </span>
                  </div>

                  {/* Unsave Button */}
                  <button
                    onClick={() => isDeal ? handleUnsaveDeal(itemId) : handleUnsaveCoupon(itemId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                    title="Remove from saved items"
                  >
                    <TrashIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {data.title}
                  </h3>

                  {isDeal ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(data.price)}
                        </span>
                        {data.original_price && data.original_price > data.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(data.original_price)}
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              {data.discount_percentage}% off
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{data.merchant}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">
                          {data.discount_type === 'percentage'
                            ? `${data.discount_value}% OFF`
                            : `${formatPrice(data.discount_value)} OFF`
                          }
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{data.merchant}</p>
                      {data.coupon_code && (
                        <div className="flex items-center space-x-2">
                          <TagIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                            {data.coupon_code}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Saved {formatDate(item.created_at)}
                    </div>
                    <button
                      onClick={() => window.open(data.url, '_blank')}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <span>{isDeal ? 'View Deal' : 'Get Coupon'}</span>
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedItems

