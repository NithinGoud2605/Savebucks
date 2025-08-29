import React, { useState } from 'react'
import { formatPrice } from '../../lib/format'

export function PriceHistory({ history = [], currentPrice }) {
  const [showHistory, setShowHistory] = useState(false)
  
  if (!history.length) return null
  
  const lowestPrice = Math.min(...history.map(h => h.price))
  const isLowestPrice = currentPrice === lowestPrice
  
  const priceChange = history.length > 1 ? 
    ((currentPrice - history[history.length - 2].price) / history[history.length - 2].price * 100) : 0
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Price History</span>
        {isLowestPrice && <span className="text-green-600">📉 Lowest!</span>}
        {priceChange !== 0 && (
          <span className={priceChange > 0 ? 'text-red-600' : 'text-green-600'}>
            {priceChange > 0 ? '↑' : '↓'}{Math.abs(priceChange).toFixed(1)}%
          </span>
        )}
      </button>
      
      {showHistory && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Price History</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {history.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <span className={`font-medium ${
                  entry.price === lowestPrice ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {formatPrice(entry.price)}
                  {entry.price === lowestPrice && ' 🏆'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
            Lowest: {formatPrice(lowestPrice)}
          </div>
        </div>
      )}
    </div>
  )
}
