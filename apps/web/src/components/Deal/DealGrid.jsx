import React, { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { api } from '../../lib/api'
import { EnhancedDealCard } from './EnhancedDealCard'
import { Card } from '../ui/Card'
import { Button, IconButton } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { LoadingSpinner, CardSkeleton } from '../ui/Loading'

const DealGrid = ({
  filters = {},
  sortBy = 'hot',
  viewMode = 'grid',
  className,
  showFilters = true,
  showViewModes = true
}) => {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode)
  const [currentSort, setCurrentSort] = useState(sortBy)

  // Fetch deals with infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['deals', filters, currentSort],
    queryFn: ({ pageParam = 1 }) => 
      api.getDeals({ 
        ...filters, 
        sort: currentSort, 
        page: pageParam, 
        limit: 20 
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined
    },
    staleTime: 5 * 60 * 1000
  })

  const deals = data?.pages.flatMap(page => page.deals) || []

  // Sort options
  const sortOptions = [
    { value: 'hot', label: 'Hot 🔥', icon: 'fire' },
    { value: 'new', label: 'New ✨', icon: 'clock' },
    { value: 'top', label: 'Top ⭐', icon: 'star' },
    { value: 'price_low', label: 'Price: Low to High 💰', icon: 'arrowUp' },
    { value: 'price_high', label: 'Price: High to Low 💎', icon: 'arrowDown' },
    { value: 'expiring', label: 'Ending Soon ⏰', icon: 'clock' },
    { value: 'discussed', label: 'Most Discussed 💬', icon: 'messageCircle' }
  ]

  // View mode options
  const viewModes = [
    { value: 'grid', label: 'Grid', icon: 'grid' },
    { value: 'list', label: 'List', icon: 'list' },
    { value: 'compact', label: 'Compact', icon: 'minus' }
  ]

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😞</div>
        <h3 className="text-xl font-semibold text-secondary-900 mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-secondary-600 mb-4">
          {error?.message || 'Failed to load deals. Please try again.'}
        </p>
        <Button 
          variant="primary" 
          leftIcon="refresh"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Controls */}
      {(showFilters || showViewModes) && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Sort options */}
            {showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-secondary-700 mr-2">
                  Sort by:
                </span>
                {sortOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={currentSort === option.value ? 'primary' : 'secondary'}
                    className="cursor-pointer hover:bg-primary-100 transition-colors"
                    leftIcon={option.icon}
                    onClick={() => setCurrentSort(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* View modes */}
            {showViewModes && (
              <div className="flex items-center gap-1 bg-secondary-100 rounded-lg p-1">
                {viewModes.map((mode) => (
                  <IconButton
                    key={mode.value}
                    icon={mode.icon}
                    size="sm"
                    variant={currentViewMode === mode.value ? 'primary' : 'ghost'}
                    onClick={() => setCurrentViewMode(mode.value)}
                    className={clsx(
                      'transition-all duration-200',
                      currentViewMode === mode.value && 'shadow-sm'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Results count */}
      {!isLoading && deals.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-secondary-600">
            Showing {deals.length} deals
            {data?.pages[0]?.total && (
              <span> of {data.pages[0].total.toLocaleString()}</span>
            )}
          </p>
          
          {/* Quick filters */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-success-50">
              Free Shipping
            </Badge>
            <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-danger-50">
              50% Off+
            </Badge>
            <Badge variant="outline" size="sm" className="cursor-pointer hover:bg-warning-50">
              Ending Soon
            </Badge>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className={clsx(
          currentViewMode === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
          currentViewMode === 'list' && 'space-y-4',
          currentViewMode === 'compact' && 'grid grid-cols-1 md:grid-cols-2 gap-4'
        )}>
          {[...Array(12)].map((_, i) => (
            <CardSkeleton key={i} compact={currentViewMode === 'compact'} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && deals.length === 0 && (
        <div className="text-center py-16">
          <div className="text-8xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            No deals found
          </h3>
          <p className="text-secondary-600 mb-6 max-w-md mx-auto">
            We couldn't find any deals matching your criteria. 
            Try adjusting your filters or search terms.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="primary" 
              leftIcon="refresh"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
            <Button 
              variant="ghost" 
              leftIcon="filter"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Deals grid */}
      {!isLoading && deals.length > 0 && (
        <div className={clsx(
          'transition-all duration-300',
          currentViewMode === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
          currentViewMode === 'list' && 'space-y-6',
          currentViewMode === 'compact' && 'grid grid-cols-1 md:grid-cols-2 gap-4'
        )}>
          <AnimatePresence>
            {deals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <EnhancedDealCard
                  deal={deal}
                  compact={currentViewMode === 'compact'}
                  variant={deal.featured ? 'featured' : 'default'}
                  className={clsx(
                    currentViewMode === 'list' && 'max-w-4xl mx-auto'
                  )}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && (
        <div className="text-center pt-8">
          <Button
            variant="outline"
            size="lg"
            leftIcon="plus"
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="min-w-[200px]"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More Deals'}
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  )
}

export default DealGrid
