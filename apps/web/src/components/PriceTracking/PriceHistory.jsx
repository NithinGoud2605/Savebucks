import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/format'

const PriceSparkline = ({ data, width = 120, height = 40 }) => {
  if (!data || data.length < 2) return null

  const prices = data.map(d => d.price).filter(p => p != null)
  if (prices.length < 2) return null

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * width
    const y = height - ((price - minPrice) / priceRange) * height
    return `${x},${y}`
  }).join(' ')

  const currentPrice = prices[prices.length - 1]
  const previousPrice = prices[prices.length - 2]
  const trend = currentPrice > previousPrice ? 'up' : currentPrice < previousPrice ? 'down' : 'stable'
  
  const trendColors = {
    up: '#EF4444',    // red
    down: '#10B981',  // green
    stable: '#6B7280' // gray
  }

  return (
    <div className="flex items-center space-x-2">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={trendColors[trend]}
          strokeWidth="2"
          points={points}
        />
        {/* Data points */}
        {prices.map((price, index) => {
          const x = (index / (prices.length - 1)) * width
          const y = height - ((price - minPrice) / priceRange) * height
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={trendColors[trend]}
            />
          )
        })}
      </svg>
      <div className="flex items-center space-x-1">
        {trend === 'up' && <span className="text-red-500">↗</span>}
        {trend === 'down' && <span className="text-green-500">↘</span>}
        {trend === 'stable' && <span className="text-gray-500">→</span>}
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-red-500' : 
          trend === 'down' ? 'text-green-500' : 
          'text-gray-500'
        }`}>
          {formatPrice(currentPrice)}
        </span>
      </div>
    </div>
  )
}

const PriceHistoryChart = ({ data, compact = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p className="text-sm">No price history available</p>
      </div>
    )
  }

  const prices = data.map(d => d.price).filter(p => p != null)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const chartHeight = compact ? 120 : 200
  const chartWidth = compact ? 300 : 500

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Price History ({data.length} data points)</span>
        <div className="flex items-center space-x-4">
          <span>Low: {formatPrice(minPrice)}</span>
          <span>High: {formatPrice(maxPrice)}</span>
        </div>
      </div>
      
      <div className="relative">
        <svg width="100%" height={chartHeight} className="border rounded-lg bg-gray-50">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={chartHeight * ratio}
              x2="100%"
              y2={chartHeight * ratio}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray={ratio === 0 || ratio === 1 ? "0" : "2,2"}
            />
          ))}
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100
              const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
              return `${x}%,${y}`
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
            return (
              <g key={index}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r="3"
                  fill="#3B82F6"
                  className="hover:r-5 transition-all cursor-pointer"
                >
                  <title>{`${formatPrice(point.price)} on ${new Date(point.timestamp).toLocaleDateString()}`}</title>
                </circle>
              </g>
            )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{formatPrice(maxPrice)}</span>
          <span>{formatPrice((maxPrice + minPrice) / 2)}</span>
          <span>{formatPrice(minPrice)}</span>
        </div>
      </div>

      {/* Stock status indicators */}
      <div className="flex flex-wrap gap-2 text-xs">
        {data.slice(-5).map((point, index) => (
          <div key={index} className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              point.stock_status === 'in_stock' ? 'bg-green-500' :
              point.stock_status === 'low_stock' ? 'bg-yellow-500' :
              point.stock_status === 'out_of_stock' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-gray-600">
              {new Date(point.timestamp).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PriceHistory({ dealId, compact = false }) {
  const { data: priceHistory, isLoading, error } = useQuery({
    queryKey: ['price-history', dealId],
    queryFn: () => api.priceTracking.getDealHistory(dealId),
    enabled: !!dealId,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className={`bg-gray-200 rounded ${compact ? 'h-20' : 'h-32'}`}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Failed to load price history
      </div>
    )
  }

  if (compact) {
    return <PriceSparkline data={priceHistory} />
  }

  return <PriceHistoryChart data={priceHistory} compact={compact} />
}

export { PriceSparkline }
