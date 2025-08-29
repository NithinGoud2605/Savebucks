import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { formatPrice, dateAgo } from '../../lib/format'
import { TagChips } from './TagChips'
import { clsx } from 'clsx'

export function SimilarDeals({ 
  deals = [], 
  currentDeal, 
  comparisonMode = false, 
  selectedComparisons = [],
  onToggleComparison 
}) {
  const [sortBy, setSortBy] = useState('relevance')
  const [filterBy, setFilterBy] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  
  // Sort and filter deals
  const filteredDeals = useMemo(() => {
    let filtered = deals.filter(deal => deal.id !== currentDeal.id)
    
    // Apply filters
    switch (filterBy) {
      case 'same_merchant':
        filtered = filtered.filter(deal => deal.merchant === currentDeal.merchant)
        break
      case 'same_category':
        filtered = filtered.filter(deal => deal.category === currentDeal.category)
        break
      case 'better_price':
        filtered = filtered.filter(deal => (deal.price || 0) < (currentDeal.price || 0))
        break
      case 'active_only':
        filtered = filtered.filter(deal => deal.status === 'active')
        break
      default:
        break
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        return filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'price_high':
        return filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
      case 'rating':
        return filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      case 'newest':
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      case 'popular':
        return filtered.sort((a, b) => ((b.ups || 0) - (b.downs || 0)) - ((a.ups || 0) - (a.downs || 0)))
      case 'relevance':
      default:
        // Calculate relevance score based on multiple factors
        return filtered.sort((a, b) => {
          const scoreA = calculateRelevanceScore(a, currentDeal)
          const scoreB = calculateRelevanceScore(b, currentDeal)
          return scoreB - scoreA
        })
    }
  }, [deals, currentDeal, sortBy, filterBy])
  
  function calculateRelevanceScore(deal, reference) {
    let score = 0
    
    // Same merchant bonus
    if (deal.merchant === reference.merchant) score += 30
    
    // Same category bonus
    if (deal.category === reference.category) score += 20
    
    // Price similarity (closer prices score higher)
    const priceDiff = Math.abs((deal.price || 0) - (reference.price || 0))
    const maxPrice = Math.max(deal.price || 0, reference.price || 0)
    if (maxPrice > 0) {
      score += Math.max(0, 20 - (priceDiff / maxPrice) * 20)
    }
    
    // Tag overlap bonus
    const dealTags = deal.tags || []
    const refTags = reference.tags || []
    const tagOverlap = dealTags.filter(tag => refTags.includes(tag)).length
    score += tagOverlap * 5
    
    // Popularity bonus
    const dealScore = (deal.ups || 0) - (deal.downs || 0)
    score += Math.min(dealScore, 10) // Cap at 10 points
    
    // Recency bonus (newer deals get slight boost)
    const hoursOld = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60)
    score += Math.max(0, 5 - hoursOld / 24) // 5 points for new, declining over 5 days
    
    return score
  }
  
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest First' },
  ]
  
  const filterOptions = [
    { value: 'all', label: 'All Deals' },
    { value: 'same_merchant', label: `Same Store (${currentDeal.merchant})` },
    { value: 'same_category', label: `${currentDeal.category} Only` },
    { value: 'better_price', label: 'Better Price Only' },
    { value: 'active_only', label: 'Active Deals Only' },
  ]
  
  const handleComparisonToggle = (deal) => {
    if (!onToggleComparison) return
    
    const isSelected = selectedComparisons.some(d => d.id === deal.id)
    if (isSelected) {
      onToggleComparison(selectedComparisons.filter(d => d.id !== deal.id))
    } else if (selectedComparisons.length < 3) { // Max 3 comparisons
      onToggleComparison([...selectedComparisons, deal])
    }
  }
  
  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Similar Deals Found
        </h3>
        <p className="text-gray-600">
          We couldn't find any similar deals at the moment. Check back later or browse all deals.
        </p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Browse All Deals
        </Link>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Filter:
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'px-3 py-1 rounded text-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-1 rounded text-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              List
            </button>
          </div>
          
          {/* Comparison Mode Toggle */}
          {onToggleComparison && (
            <button
              onClick={() => onToggleComparison([])}
              className={clsx(
                'btn text-sm',
                selectedComparisons.length > 0 ? 'btn-primary' : 'btn-secondary'
              )}
            >
              Compare ({selectedComparisons.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredDeals.length} similar {filteredDeals.length === 1 ? 'deal' : 'deals'}
      </div>
      
      {/* Deal List */}
      <div className={clsx(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      )}>
        {filteredDeals.map((deal) => (
          <SimilarDealCard
            key={deal.id}
            deal={deal}
            currentDeal={currentDeal}
            viewMode={viewMode}
            comparisonMode={comparisonMode}
            isSelected={selectedComparisons.some(d => d.id === deal.id)}
            onToggleComparison={() => handleComparisonToggle(deal)}
            canCompare={selectedComparisons.length < 3 || selectedComparisons.some(d => d.id === deal.id)}
          />
        ))}
      </div>
      
      {/* Comparison Summary */}
      {selectedComparisons.length > 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">
                {selectedComparisons.length} deals selected for comparison
              </h3>
              <p className="text-sm text-blue-700">
                Including the current deal, you're comparing {selectedComparisons.length + 1} deals
              </p>
            </div>
            <button
              onClick={() => onToggleComparison([])}
              className="btn-primary"
            >
              View Comparison
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SimilarDealCard({ 
  deal, 
  currentDeal, 
  viewMode, 
  comparisonMode,
  isSelected,
  onToggleComparison,
  canCompare
}) {
  const score = (deal.ups || 0) - (deal.downs || 0)
  const priceDiff = (currentDeal.price || 0) - (deal.price || 0)
  const isCurrentBetter = priceDiff > 0
  const tags = [deal.merchant, deal.category].filter(Boolean)
  
  const cardClasses = clsx(
    'card hover:shadow-lg transition-all duration-200',
    viewMode === 'list' ? 'p-4' : 'p-6',
    isSelected && 'ring-2 ring-blue-500 bg-blue-50'
  )
  
  if (viewMode === 'list') {
    return (
      <div className={cardClasses}>
        <div className="flex items-center space-x-4">
          {/* Comparison Checkbox */}
          {comparisonMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleComparison}
              disabled={!canCompare}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
          
          {/* Deal Image */}
          {deal.image_url && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={deal.image_url}
                alt={deal.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Deal Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
              <Link to={`/deal/${deal.id}`} className="hover:text-blue-600">
                {deal.title}
              </Link>
            </h3>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
              <span>{deal.merchant}</span>
              <span>•</span>
              <span>{dateAgo(deal.created_at)}</span>
              {score > 0 && (
                <>
                  <span>•</span>
                  <span className="text-green-600">
                    +{score} votes
                  </span>
                </>
              )}
            </div>
            
            {tags.length > 0 && (
              <TagChips tags={tags.slice(0, 2)} className="mb-2" />
            )}
          </div>
          
          {/* Price Comparison */}
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
            </div>
            
            {priceDiff !== 0 && (
              <div className={clsx(
                'text-sm font-medium',
                isCurrentBetter ? 'text-red-600' : 'text-green-600'
              )}>
                {isCurrentBetter ? '+' : '-'}{formatPrice(Math.abs(priceDiff))}
              </div>
            )}
            
            {deal.list_price && deal.list_price > deal.price && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(deal.list_price)}
              </div>
            )}
          </div>
          
          {/* Vote Button */}
          <VoteButton
            dealId={deal.id}
            votes={score}
            userVote={deal.user_vote}
            className="flex-shrink-0"
          />
        </div>
      </div>
    )
  }
  
  // Grid View
  return (
    <div className={cardClasses}>
      {/* Comparison Checkbox */}
      {comparisonMode && (
        <div className="flex justify-end mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleComparison}
            disabled={!canCompare}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}
      
      {/* Deal Image */}
      {deal.image_url && (
        <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100 mb-4">
          <img
            src={deal.image_url}
            alt={deal.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Deal Content */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          <Link to={`/deal/${deal.id}`} className="hover:text-blue-600">
            {deal.title}
          </Link>
        </h3>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{deal.merchant}</span>
          <span>{dateAgo(deal.created_at)}</span>
        </div>
        
        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-green-600">
              {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
            </span>
            
            {deal.list_price && deal.list_price > deal.price && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(deal.list_price)}
              </span>
            )}
          </div>
          
          {/* Price Comparison with Current Deal */}
          {priceDiff !== 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">vs current:</span>
              <span className={clsx(
                'text-sm font-medium px-2 py-1 rounded-full',
                isCurrentBetter 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              )}>
                {isCurrentBetter ? '+' : '-'}{formatPrice(Math.abs(priceDiff))}
              </span>
            </div>
          )}
        </div>
        
        {/* Tags */}
        {tags.length > 0 && (
          <TagChips tags={tags.slice(0, 3)} />
        )}
        
        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <VoteButton
            dealId={deal.id}
            votes={score}
            userVote={deal.user_vote}
          />
          
          <Link
            to={`/deal/${deal.id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Deal →
          </Link>
        </div>
      </div>
    </div>
  )
}
