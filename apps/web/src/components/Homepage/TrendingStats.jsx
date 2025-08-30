import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

export function TrendingStats() {
  const { data: stats } = useQuery({
    queryKey: ['homepage', 'stats'],
    queryFn: async () => {
      // Get trending deals to calculate stats
      const deals = await api.getDeals({ tab: 'trending' })
      
      const totalSavings = deals.reduce((sum, deal) => {
        if (deal.savings) return sum + deal.savings
        if (deal.discount_percentage && deal.price) {
          return sum + (deal.price * deal.discount_percentage / 100)
        }
        return sum
      }, 0)
      
      const averageDiscount = deals.reduce((sum, deal) => {
        if (deal.discount_percentage) return sum + deal.discount_percentage
        return sum
      }, 0) / deals.filter(d => d.discount_percentage).length || 0
      
      const topMerchants = [...new Set(deals.map(d => d.merchant).filter(Boolean))]
      
      return {
        totalDeals: deals.length,
        totalSavings: Math.round(totalSavings),
        averageDiscount: Math.round(averageDiscount),
        topMerchants: topMerchants.slice(0, 3)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (!stats) {
    return (
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded mx-auto mb-2"></div>
              <div className="w-12 h-4 bg-white bg-opacity-20 rounded mx-auto mb-1"></div>
              <div className="w-16 h-3 bg-white bg-opacity-20 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">SaveBucks Stats</h3>
        <p className="text-primary-100 text-sm">Updated in real-time</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{stats.totalDeals.toLocaleString()}</div>
          <div className="text-primary-100 text-sm">Active Deals</div>
        </div>
        
        <div className="text-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="text-2xl font-bold">${stats.totalSavings.toLocaleString()}</div>
          <div className="text-primary-100 text-sm">Total Savings</div>
        </div>
        
        <div className="text-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{stats.averageDiscount}%</div>
          <div className="text-primary-100 text-sm">Avg. Discount</div>
        </div>
        
        <div className="text-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{stats.topMerchants.length}</div>
          <div className="text-primary-100 text-sm">Top Stores</div>
        </div>
      </div>
      
      {stats.topMerchants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="text-center">
            <p className="text-primary-100 text-sm mb-2">Featured Stores:</p>
            <div className="flex justify-center space-x-4">
              {stats.topMerchants.map((merchant, index) => (
                <span key={index} className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {merchant}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

