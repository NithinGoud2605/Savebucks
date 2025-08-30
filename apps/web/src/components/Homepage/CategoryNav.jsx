import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

const categoryIcons = {
  'electronics': '📱',
  'fashion': '👕',
  'home-garden': '🏠',
  'health-beauty': '💄',
  'sports-outdoors': '⚽',
  'books-media': '📚',
  'food-grocery': '🛒',
  'travel': '✈️',
  'services': '⚙️',
  'automotive': '🚗'
}

export function CategoryNav() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'featured'],
    queryFn: () => api.getCategories({ featured_only: true }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  if (isLoading) {
    return (
      <div className="bg-white border-b border-secondary-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 py-3 overflow-x-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2 animate-pulse">
                <div className="w-6 h-6 bg-secondary-200 rounded"></div>
                <div className="w-20 h-4 bg-secondary-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const featuredCategories = categories.filter(cat => cat.is_featured)

  return (
    <div className="bg-white border-b border-secondary-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6 py-3 overflow-x-auto scrollbar-hide">
          {/* Trending Now - Special Item */}
          <Link
            to="/trending"
            className="flex items-center space-x-2 text-sm font-medium text-success-600 hover:text-success-700 whitespace-nowrap group transition-colors"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse mr-1"></div>
              <span className="text-lg">📈</span>
            </div>
            <span className="group-hover:underline">Trending Now</span>
          </Link>

          {/* Categories */}
          {featuredCategories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="flex items-center space-x-2 text-sm font-medium text-secondary-600 hover:text-secondary-900 whitespace-nowrap group transition-colors"
            >
              <span className="text-lg">
                {categoryIcons[category.slug] || '🏷️'}
              </span>
              <span className="group-hover:underline">{category.name}</span>
            </Link>
          ))}

          {/* View All Categories */}
          <Link
            to="/categories"
            className="flex items-center space-x-2 text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap group transition-colors ml-4"
          >
            <span className="text-lg">📋</span>
            <span className="group-hover:underline">All Categories</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

