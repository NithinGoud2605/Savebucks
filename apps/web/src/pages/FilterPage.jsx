import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import NewDealCard from '../components/Deal/NewDealCard'
import { Skeleton } from '../components/ui/Skeleton'
import {
  FireIcon,
  BoltIcon,
  StarIcon,
  GiftIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const filterConfig = {
  trending: {
    title: 'Trending Now',
    description: 'The most popular deals with high engagement and recent activity',
    icon: BoltIcon,
    color: 'orange',
    apiMethod: 'getTrendingDeals'
  },
  'under-20': {
    title: 'Under $20',
    description: 'Amazing deals under $20 - perfect for budget shopping',
    icon: StarIcon,
    color: 'teal',
    apiMethod: 'getUnder20Deals'
  },
  '50-off': {
    title: '50% Off+',
    description: 'Deals with 50% or more discount - maximum savings',
    icon: FireIcon,
    color: 'red',
    apiMethod: 'get50OffDeals'
  },
  'free-shipping': {
    title: 'Free Shipping',
    description: 'Deals with free shipping included',
    icon: GiftIcon,
    color: 'blue',
    apiMethod: 'getFreeShippingDeals'
  },
  'new-arrivals': {
    title: 'New Arrivals',
    description: 'Freshly posted deals from the last 7 days',
    icon: ClockIcon,
    color: 'purple',
    apiMethod: 'getNewArrivalsDeals'
  },
  'hot-deals': {
    title: 'Hot Deals',
    description: 'High engagement deals with lots of user interaction',
    icon: FireIcon,
    color: 'red',
    apiMethod: 'getHotDeals'
  },
  'ending-soon': {
    title: 'Ending Soon',
    description: 'Deals expiring within the next 7 days - act fast!',
    icon: ClockIcon,
    color: 'orange',
    apiMethod: 'getEndingSoonDeals'
  }
}

const FilterPage = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)

  // Extract filter type from the current path
  const filterType = location.pathname.substring(1) // Remove leading slash
  const config = filterConfig[filterType]
  const page = parseInt(searchParams.get('page')) || 1
  const limit = 20

  // Set page title and meta
  useEffect(() => {
    if (config) {
      setPageMeta({
        title: `${config.title} - SaveBucks`,
        description: config.description,
      })
    }
  }, [config])

  // Fetch deals based on filter type
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [`${filterType}-deals`, page],
    queryFn: () => {
      if (!config?.apiMethod) {
        throw new Error('Invalid filter type')
      }
      return api[config.apiMethod]({ page, limit })
    },
    enabled: !!config?.apiMethod,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    setCurrentPage(page)
  }, [page])

  if (!config) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Filter Not Found</h1>
          <p className="text-secondary-600">The requested filter category does not exist.</p>
        </div>
      </div>
    )
  }

  const IconComponent = config.icon
  const deals = data?.data?.deals || []
  const totalPages = data?.data?.totalPages || 0
  const total = data?.data?.total || 0

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('page', newPage.toString())
      window.history.pushState({}, '', `?${newSearchParams.toString()}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Error Loading Deals</h1>
          <p className="text-secondary-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 rounded-xl bg-${config.color}-100`}>
              <IconComponent className={`w-8 h-8 text-${config.color}-600`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">{config.title}</h1>
              <p className="text-secondary-600">{config.description}</p>
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-500">
                Showing {deals.length} of {total.toLocaleString()} deals
              </p>
              <div className="flex items-center space-x-2 text-sm text-secondary-500">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          )}
        </div>

        {/* Deals Grid */}
        {deals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {deals.map((deal, index) => (
                <NewDealCard
                  key={deal.id}
                  deal={deal}
                  index={index}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-secondary-700 bg-white border border-secondary-300 hover:bg-secondary-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <IconComponent className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No deals found</h3>
            <p className="text-secondary-600 mb-6">
              We couldn't find any deals matching this filter. Check back later for new deals!
            </p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <ArrowRightIcon className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterPage
