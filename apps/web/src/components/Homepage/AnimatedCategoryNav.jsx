import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'

export function AnimatedCategoryNav() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef(null)

  // Fetch categories with deal counts
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: () => apiRequest('/api/categories?include_counts=true'),
    initialData: [
      { id: 1, name: 'Electronics', slug: 'electronics', deal_count: 245, icon: '📱', color: 'from-blue-500 to-cyan-500' },
      { id: 2, name: 'Fashion', slug: 'fashion', deal_count: 189, icon: '👗', color: 'from-pink-500 to-rose-500' },
      { id: 3, name: 'Home & Garden', slug: 'home-garden', deal_count: 156, icon: '🏠', color: 'from-green-500 to-emerald-500' },
      { id: 4, name: 'Health & Beauty', slug: 'health-beauty', deal_count: 134, icon: '💄', color: 'from-purple-500 to-violet-500' },
      { id: 5, name: 'Sports & Outdoors', slug: 'sports', deal_count: 98, icon: '⚽', color: 'from-orange-500 to-amber-500' },
      { id: 6, name: 'Books & Media', slug: 'books', deal_count: 87, icon: '📚', color: 'from-indigo-500 to-blue-500' },
      { id: 7, name: 'Food & Grocery', slug: 'food', deal_count: 76, icon: '🛒', color: 'from-red-500 to-pink-500' },
      { id: 8, name: 'Travel', slug: 'travel', deal_count: 65, icon: '✈️', color: 'from-sky-500 to-blue-500' },
      { id: 9, name: 'Automotive', slug: 'automotive', deal_count: 54, icon: '🚗', color: 'from-gray-600 to-slate-600' },
      { id: 10, name: 'Services', slug: 'services', deal_count: 43, icon: '⚙️', color: 'from-yellow-500 to-orange-500' },
      { id: 11, name: 'Gaming', slug: 'gaming', deal_count: 89, icon: '🎮', color: 'from-violet-500 to-purple-500' },
      { id: 12, name: 'Toys & Kids', slug: 'toys', deal_count: 67, icon: '🧸', color: 'from-pink-400 to-rose-400' }
    ]
  })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <nav className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300 ${
      isScrolled ? 'shadow-lg' : 'shadow-sm'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative py-4">
          {/* Scroll buttons */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Categories scroll container */}
          <div 
            ref={scrollContainerRef}
            className="flex space-x-3 overflow-x-auto scrollbar-hide px-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Deals */}
            <Link
              to="/deals"
              className="group flex-shrink-0 relative"
              onMouseEnter={() => setActiveCategory('all')}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div className={`relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-4 min-w-[140px] text-center text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                activeCategory === 'all' ? 'scale-105 shadow-xl' : ''
              }`}>
                <div className="text-3xl mb-2 animate-bounce">🔥</div>
                <div className="font-bold text-sm mb-1">All Deals</div>
                <div className="text-xs opacity-80">
                  {categories.reduce((sum, cat) => sum + (cat.deal_count || 0), 0)} deals
                </div>
                
                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
              </div>
            </Link>

            {/* Category items */}
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group flex-shrink-0 relative"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <div className={`relative bg-gradient-to-br ${category.color} rounded-2xl p-4 min-w-[140px] text-center text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                  activeCategory === category.id ? 'scale-105 shadow-xl' : ''
                }`}>
                  {/* Category icon */}
                  <div className="text-3xl mb-2 group-hover:animate-bounce">
                    {category.icon}
                  </div>
                  
                  {/* Category name */}
                  <div className="font-bold text-sm mb-1 leading-tight">
                    {category.name}
                  </div>
                  
                  {/* Deal count */}
                  <div className="text-xs opacity-80">
                    {category.deal_count || 0} deals
                  </div>
                  
                  {/* Hot indicator for categories with many deals */}
                  {(category.deal_count || 0) > 100 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      HOT
                    </div>
                  )}
                  
                  {/* New indicator for recently added categories */}
                  {category.is_new && (
                    <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      NEW
                    </div>
                  )}
                  
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </div>
              </Link>
            ))}

            {/* Browse All Categories */}
            <Link
              to="/categories"
              className="group flex-shrink-0 relative"
              onMouseEnter={() => setActiveCategory('browse')}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div className={`relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 min-w-[140px] text-center text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-dashed border-white/30 ${
                activeCategory === 'browse' ? 'scale-105 shadow-xl' : ''
              }`}>
                <div className="text-3xl mb-2 group-hover:animate-spin">⭐</div>
                <div className="font-bold text-sm mb-1">Browse All</div>
                <div className="text-xs opacity-80">Categories</div>
                
                {/* Plus icon overlay */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Active category preview (appears on hover) */}
      {activeCategory && activeCategory !== 'all' && activeCategory !== 'browse' && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Quick preview of category deals */}
              <div className="text-center">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-semibold text-sm">Hot Deals</div>
                <div className="text-xs text-gray-500">Trending now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold text-sm">Best Value</div>
                <div className="text-xs text-gray-500">Top savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-semibold text-sm">Limited Time</div>
                <div className="text-xs text-gray-500">Ending soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">⭐</div>
                <div className="font-semibold text-sm">Top Rated</div>
                <div className="text-xs text-gray-500">Community favorites</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
