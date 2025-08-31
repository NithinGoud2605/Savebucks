import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CommunityDealCard } from '../Deal/CommunityDealCard'
import { apiRequest } from '../../lib/api'
import { clsx } from 'clsx'

export function EnhancedDealCollection({ 
  title, 
  subtitle, 
  endpoint, 
  maxItems = 8, 
  showViewAll = true,
  viewAllLink = '/deals',
  gradient = 'from-blue-500 to-purple-600',
  icon = '🔥',
  className 
}) {
  const [viewMode, setViewMode] = useState('grid') // grid, list, compact

  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: ['deals', endpoint],
    queryFn: () => apiRequest(endpoint),
    refetchInterval: 30000
  })

  if (isLoading) {
    return (
      <section className={clsx('py-12', className)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(maxItems)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !deals.length) {
    return null
  }

  const displayDeals = deals.slice(0, maxItems)

  return (
    <section className={clsx('py-12 relative overflow-hidden', className)}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${gradient} rounded-full blur-3xl`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br ${gradient} rounded-full blur-3xl`} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className={`text-6xl mr-4 animate-bounce`}>{icon}</div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">
                <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {title}
                </span>
              </h2>
              {subtitle && (
                <p className="text-lg text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>

          {/* View mode toggles */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="bg-gray-100 rounded-full p-1 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  viewMode === 'grid' 
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg` 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  viewMode === 'list' 
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg` 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  viewMode === 'compact' 
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg` 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Deals grid */}
        <div className={clsx(
          'transition-all duration-500',
          viewMode === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
          viewMode === 'list' && 'space-y-6',
          viewMode === 'compact' && 'grid grid-cols-1 md:grid-cols-2 gap-4'
        )}>
          {displayDeals.map((deal, index) => (
            <div
              key={deal.id}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <CommunityDealCard 
                deal={deal} 
                compact={viewMode === 'compact'}
                className={clsx(
                  'h-full',
                  viewMode === 'list' && 'max-w-4xl mx-auto'
                )}
              />
            </div>
          ))}
        </div>

        {/* View all button */}
        {showViewAll && deals.length > maxItems && (
          <div className="text-center mt-12">
            <Link
              to={viewAllLink}
              className={`group inline-flex items-center px-8 py-4 bg-gradient-to-r ${gradient} text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
            >
              <span>View All {deals.length} Deals</span>
              <svg 
                className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Quick stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {displayDeals.length}
            </div>
            <div className="text-sm text-gray-600">Deals Shown</div>
          </div>
          
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round(displayDeals.reduce((acc, deal) => {
                if (deal.discount_percentage) return acc + deal.discount_percentage
                return acc
              }, 0) / displayDeals.length) || 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Discount</div>
          </div>
          
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              ${Math.round(displayDeals.reduce((acc, deal) => {
                if (deal.price) return acc + deal.price
                return acc
              }, 0) / displayDeals.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Avg Price</div>
          </div>
          
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {displayDeals.reduce((acc, deal) => acc + (deal.ups || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Predefined collections for easy use
export function TrendingDeals({ maxItems = 8, className }) {
  return (
    <EnhancedDealCollection
      title="🔥 Trending Now"
      subtitle="Hottest deals trending in our community right now"
      endpoint="/api/deals?sort=trending&limit=50"
      maxItems={maxItems}
      viewAllLink="/deals?sort=trending"
      gradient="from-red-500 to-orange-500"
      icon="🔥"
      className={clsx('bg-gradient-to-br from-red-50 to-orange-50', className)}
    />
  )
}

export function FeaturedDeals({ maxItems = 6, className }) {
  return (
    <EnhancedDealCollection
      title="⭐ Featured Deals"
      subtitle="Hand-picked deals by our community moderators"
      endpoint="/api/deals?featured=true&limit=30"
      maxItems={maxItems}
      viewAllLink="/deals?featured=true"
      gradient="from-purple-500 to-pink-500"
      icon="⭐"
      className={clsx('bg-gradient-to-br from-purple-50 to-pink-50', className)}
    />
  )
}

export function NewDeals({ maxItems = 8, className }) {
  return (
    <EnhancedDealCollection
      title="✨ Fresh Finds"
      subtitle="Just discovered by our deal hunters"
      endpoint="/api/deals?sort=newest&limit=40"
      maxItems={maxItems}
      viewAllLink="/deals?sort=newest"
      gradient="from-green-500 to-teal-500"
      icon="✨"
      className={clsx('bg-gradient-to-br from-green-50 to-teal-50', className)}
    />
  )
}

export function TopRatedDeals({ maxItems = 6, className }) {
  return (
    <EnhancedDealCollection
      title="🏆 Community Favorites"
      subtitle="Most loved deals by our community members"
      endpoint="/api/deals?sort=top_rated&limit=30"
      maxItems={maxItems}
      viewAllLink="/deals?sort=top_rated"
      gradient="from-yellow-500 to-orange-500"
      icon="🏆"
      className={clsx('bg-gradient-to-br from-yellow-50 to-orange-50', className)}
    />
  )
}

// Add custom CSS for animations
const style = document.createElement('style')
style.textContent = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
  }
`
document.head.appendChild(style)
