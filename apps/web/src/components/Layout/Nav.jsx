import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from './Container'
import { api } from '../../lib/api'
import { getSiteName } from '../../lib/affFlags'
import { clsx } from 'clsx'
import { useAuth } from '../../hooks/useAuth.js'
import { AdvancedSearch } from '../Search/AdvancedSearch.jsx'

export function Nav() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const { user, isAuthenticated, signOut } = useAuth()
  
  const { data: adminCheck } = useQuery({
    queryKey: ['admin', 'whoami'],
    queryFn: api.checkAdmin,
    enabled: isAuthenticated,
    retry: false,
  })

  useEffect(() => {
    function handleKeydown(e) {
      if (e.key === '/' && !isSearchFocused) {
        e.preventDefault()
        document.getElementById('search')?.focus()
      }
    }
    
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isSearchFocused])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const tabs = [
    { name: 'Hot', path: '/', current: location.pathname === '/' },
    { name: 'New', path: '/new', current: location.pathname === '/new' },
    { name: 'Trending', path: '/trending', current: location.pathname === '/trending' },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-secondary-200 shadow-soft">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 font-bold text-xl text-primary-600 focus-ring rounded-lg"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7L12 2zm0 2.18L18.18 7 12 10.82 5.82 7 12 4.18zm6 10.82c0 4.25-2.53 7.1-6 7.1s-6-2.85-6-7.1V8.82l6 3.63 6-3.63V15z"/>
            </svg>
            <span>{getSiteName()}</span>
          </Link>

          {/* Navigation Tabs */}
          <div className="hidden sm:block">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={clsx(
                    'px-4 py-2 rounded-lg font-medium focus-ring transition-colors',
                    tab.current
                      ? 'bg-primary-100 text-primary-800'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                  )}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        window.location.href = `/search?search=${encodeURIComponent(searchQuery.trim())}`
                      }
                    }}
                    className="input w-64 pl-10 pr-4 bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {!isSearchFocused && (
                    <kbd className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-secondary-400">
                      /
                    </kbd>
                  )}
                </div>
                
                {/* Advanced Search Button */}
                <button
                  onClick={() => setShowAdvancedSearch(true)}
                  className="btn btn-secondary text-sm px-3 py-2 flex items-center"
                  title="Advanced Search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>



            {/* Auth */}
            <div className="relative">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="flex items-center space-x-2">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.handle || user.email}
                        className="w-8 h-8 rounded-full border-2 border-primary-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                        <span className="text-primary-600 font-semibold text-sm">
                          {(user.handle || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="hidden sm:block">
                      <span className="text-sm text-gray-600">
                        Signed in as{' '}
                        <span className="font-medium text-gray-900">
                          {user.handle || user.email.split('@')[0]}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {/* User Menu */}
                  <div className="relative group">
                    <button className="text-gray-600 hover:text-gray-900 focus-ring rounded p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft border border-secondary-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <Link
                        to={`/u/${user.handle || user.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        View Profile
                      </Link>
                      <Link
                        to="/post"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        Post Deal
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/signin"
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary text-sm px-4 py-2"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Link */}
            {adminCheck?.isAdmin && (
              <Link
                to="/admin"
                className="text-sm text-warning-600 hover:text-warning-700 focus-ring rounded font-medium"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-secondary-200">
        <Container>
          <div className="flex space-x-1 py-2">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.path}
                className={clsx(
                  'flex-1 py-2 px-3 text-center text-sm font-medium rounded-lg focus-ring',
                  tab.current
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                )}
                aria-current={tab.current ? 'page' : undefined}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </Container>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearch 
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
      />
    </nav>
  )
}
