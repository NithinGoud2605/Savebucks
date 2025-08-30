import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/Loader/Skeleton'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

const CategoriesPage = () => {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const featuredCategories = categories?.filter(cat => cat.is_featured && !cat.parent_id) || []
  const otherCategories = categories?.filter(cat => !cat.is_featured && !cat.parent_id) || []

  if (error) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Error Loading Categories</h1>
          <p className="text-secondary-600 mb-8">
            We couldn't load the categories. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-secondary-900 font-medium">Categories</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Browse by Category</h1>
          <p className="text-secondary-600">
            Find the best deals organized by category. From electronics to fashion, we've got you covered.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {/* Featured Categories Skeleton */}
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>

            {/* Other Categories Skeleton */}
            <div>
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Categories */}
            {featuredCategories.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">Featured Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} featured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Categories */}
            {otherCategories.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">All Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} featured={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {categories && categories.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No Categories Available</h3>
                <p className="text-secondary-600">
                  Categories will appear here once they've been added.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

const CategoryCard = ({ category, featured }) => {
  return (
    <Link
      to={`/category/${category.slug}`}
      className={`group block ${
        featured 
          ? 'bg-white border border-secondary-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary-300' 
          : 'bg-white border border-secondary-200 rounded-lg p-4 hover:border-primary-300 transition-colors'
      }`}
    >
      <div className={`flex items-center ${featured ? 'flex-col text-center' : 'space-x-4'}`}>
        {/* Category Icon/Color */}
        <div 
          className={`${
            featured ? 'w-16 h-16 mb-4' : 'w-12 h-12'
          } rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}
          style={{ backgroundColor: category.color }}
        >
          <span className={`text-white font-semibold ${featured ? 'text-xl' : 'text-lg'}`}>
            {category.icon || category.name[0]}
          </span>
        </div>

        {/* Category Info */}
        <div className={featured ? 'text-center' : 'flex-1 min-w-0'}>
          <h3 className={`font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors ${
            featured ? 'text-lg mb-2' : 'text-base mb-1'
          }`}>
            {category.name}
          </h3>
          <p className={`text-secondary-600 ${
            featured ? 'text-sm' : 'text-sm truncate'
          }`}>
            {category.description}
          </p>
        </div>

        {/* Arrow for non-featured */}
        {!featured && (
          <ChevronRightIcon className="w-5 h-5 text-secondary-400 group-hover:text-primary-600 transition-colors" />
        )}
      </div>

      {/* Deal Count (if available) */}
      {category.deal_count && (
        <div className={`${featured ? 'mt-3 pt-3 border-t border-secondary-100' : 'mt-2'}`}>
          <span className="text-xs text-secondary-500">
            {category.deal_count} active deals
          </span>
        </div>
      )}
    </Link>
  )
}

export default CategoriesPage
