import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api.js'
import { EnhancedDealCard } from '../Deal/EnhancedDealCard.jsx'

export function DealCollection({ collectionSlug, title, showViewAll = true, maxItems = 6 }) {
  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', collectionSlug],
    queryFn: () => api.getCollection(collectionSlug),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-secondary-200 rounded animate-pulse"></div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(maxItems)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-soft border border-secondary-200 p-4 animate-pulse">
                <div className="w-full h-48 bg-secondary-200 rounded-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="w-3/4 h-4 bg-secondary-200 rounded"></div>
                  <div className="w-1/2 h-4 bg-secondary-200 rounded"></div>
                  <div className="w-full h-4 bg-secondary-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || !collection) {
    return null
  }

  const displayDeals = collection.deals?.slice(0, maxItems) || []
  const displayTitle = title || collection.name
  const updateFrequency = collection.type === 'manual' ? null : 'Updated every 3 hours'

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-1">
              {displayTitle}
            </h2>
            {collection.description && (
              <p className="text-secondary-600 text-sm">
                {collection.description}
              </p>
            )}
            {updateFrequency && (
              <p className="text-secondary-500 text-xs mt-1">
                {updateFrequency}
              </p>
            )}
          </div>

          {showViewAll && collection.deals?.length > maxItems && (
            <Link
              to={`/collections/${collectionSlug}`}
              className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm group transition-colors"
            >
              View all
              <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Deals Grid */}
        {displayDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
            {displayDeals.map((deal, index) => (
              <div key={deal.id} className="relative">
                <EnhancedDealCard 
                  deal={deal} 
                  compact={true}
                  showCategory={false}
                />
                
                {/* Position badge for top deals */}
                {collection.slug === 'amazon-best-sellers' && index < 3 && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${
                      index === 0 ? 'bg-warning-500' : 
                      index === 1 ? 'bg-secondary-400' : 
                      'bg-warning-600'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-secondary-400 mb-4">
              <svg className="mx-auto w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No deals available</h3>
            <p className="text-secondary-500">Check back soon for new deals in this collection.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// Pre-configured collection components for common use cases
export function TrendingDeals(props) {
  return <DealCollection collectionSlug="trending-now" title="Trending Now" {...props} />
}

export function AmazonBestSellers(props) {
  return <DealCollection collectionSlug="amazon-best-sellers" title="Amazon Best Sellers" {...props} />
}

export function Over50PercentOff(props) {
  return <DealCollection collectionSlug="over-50-off" title="Over 50% Off" {...props} />
}

export function Under20Dollars(props) {
  return <DealCollection collectionSlug="under-20" title="Under $20" {...props} />
}

export function ElectronicsDeals(props) {
  return <DealCollection collectionSlug="electronics-deals" title="Electronics Deals" {...props} />
}

export function FashionFinds(props) {
  return <DealCollection collectionSlug="fashion-finds" title="Women's Fashion" {...props} />
}

