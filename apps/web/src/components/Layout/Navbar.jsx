import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { PlusIcon, FireIcon, ChatBubbleLeftRightIcon, TagIcon } from '@heroicons/react/24/solid'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const categoriesRef = useRef(null)
  const userMenuRef = useRef(null)

  // Get categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setIsCategoriesOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const featuredCategories = categories?.filter(cat => cat.is_featured).slice(0, 8) || []
  const allCategories = categories || []

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-secondary-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
              <span className="text-xl font-bold text-secondary-900">SaveBucks</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Categories Dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                <span>Categories</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 py-4 z-50">
                  <div className="px-4 pb-3 border-b border-secondary-100">
                    <h3 className="text-sm font-semibold text-secondary-900 mb-2">Featured Categories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {featuredCategories.map((category) => (
                        <Link
                          key={category.id}
                          to={`/category/${category.slug}`}
                          onClick={() => setIsCategoriesOpen(false)}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-50 transition-colors"
                        >
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-secondary-700">{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 pt-3">
                    <Link
                      to="/categories"
                      onClick={() => setIsCategoriesOpen(false)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All Categories →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <Link
              to="/coupons"
              className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 font-medium transition-colors"
            >
              <TagIcon className="w-4 h-4" />
              <span>Coupons</span>
            </Link>

            <Link
              to="/trending"
              className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 font-medium transition-colors"
            >
              <FireIcon className="w-4 h-4" />
              <span>Trending</span>
            </Link>

            <Link
              to="/forums"
              className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 font-medium transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Community</span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Post Deal Button */}
            <Link
              to="/post"
              className="hidden md:flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Post Deal</span>
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-secondary-100 transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.handle || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary-300 rounded-full flex items-center justify-center">
                      <span className="text-secondary-600 text-sm font-medium">
                        {user.user_metadata?.handle?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <ChevronDownIcon className={`w-4 h-4 text-secondary-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-secondary-100">
                      <p className="text-sm font-medium text-secondary-900">
                        {user.user_metadata?.handle || user.email}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to={`/u/${user.handle || user.user_metadata?.handle}`}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/achievements"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        🏆 Achievements
                      </Link>
                      <Link
                        to="/saved-searches"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        🔍 Saved Searches
                      </Link>
                      <Link
                        to="/price-alerts"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        🔔 Price Alerts
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        Settings
                      </Link>
                      <Link
                        to="/leaderboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        Leaderboard
                      </Link>
                      {(user.role || user.user_metadata?.role) === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-secondary-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/signin"
                  className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-secondary-200 py-4">
            <div className="space-y-4">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-2">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {featuredCategories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-50 transition-colors"
                    >
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-secondary-700">{category.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/coupons"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 text-secondary-700 hover:bg-secondary-50 rounded-md transition-colors"
                >
                  <TagIcon className="w-4 h-4" />
                  <span>Coupons</span>
                </Link>

                <Link
                  to="/trending"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 text-secondary-700 hover:bg-secondary-50 rounded-md transition-colors"
                >
                  <FireIcon className="w-4 h-4" />
                  <span>Trending</span>
                </Link>

                <Link
                  to="/forums"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 text-secondary-700 hover:bg-secondary-50 rounded-md transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>Community</span>
                </Link>

                <Link
                  to="/leaderboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 text-secondary-700 hover:bg-secondary-50 rounded-md transition-colors"
                >
                  <span>Leaderboard</span>
                </Link>
              </div>

              {/* Post Deal Button (Mobile) */}
              <Link
                to="/post"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Post Deal</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
