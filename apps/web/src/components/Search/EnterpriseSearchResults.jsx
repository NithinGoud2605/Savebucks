/**
 * Enterprise Search Results Component
 * Advanced search results display with comprehensive features
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Users, 
  Tag, 
  Building2, 
  Grid3X3, 
  List,
  Filter,
  X,
  User,
  Star,
  MapPin,
  Globe,
  Calendar,
  TrendingUp,
  Clock,
  Eye,
  MousePointer,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { NewDealCard } from '../Deal/NewDealCard'
import { Skeleton } from '../Loader/Skeleton'
import { formatPrice, dateAgo } from '../../lib/format'

const EnterpriseSearchResults = ({ 
  searchResults, 
  isLoading, 
  error, 
  query,
  onInteraction,
  onFilterChange 
}) => {
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('relevance')

  // Extract data from search results
  const {
    deals = [],
    coupons = [],
    users = [],
    companies = [],
    categories = [],
    total_deals = 0,
    total_coupons = 0,
    total_users = 0,
    total_companies = 0,
    total_categories = 0,
    total_results = 0,
    search_time = 0,
    suggestions = []
  } = searchResults || {}

  // Record interaction when user clicks on a result
  const handleResultClick = (resultType, resultId, result) => {
    if (onInteraction) {
      onInteraction({
        query,
        resultType,
        resultId,
        interactionType: 'click',
        metadata: {
          title: result.title || result.name || result.handle,
          position: 0 // Would be calculated based on position in results
        }
      })
    }
  }

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (onFilterChange) {
      onFilterChange({ type: tab })
    }
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
        <p className="text-gray-600 mb-4">
          {error.message || 'Unable to load search results. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex space-x-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Search Results
            {query && (
              <span className="text-gray-600 font-normal"> for "{query}"</span>
            )}
          </h1>
          {total_results > 0 && (
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>
                Found {total_results.toLocaleString()} result{total_results !== 1 ? 's' : ''}
              </span>
              {search_time > 0 && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {search_time}ms
                </span>
              )}
              <span className="flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Enhanced
              </span>
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="relevance">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Search Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => handleTabChange('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            All ({total_results.toLocaleString()})
          </button>

          {total_deals > 0 && (
            <button
              onClick={() => handleTabChange('deals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'deals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Deals ({total_deals.toLocaleString()})
            </button>
          )}

          {total_coupons > 0 && (
            <button
              onClick={() => handleTabChange('coupons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'coupons'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Coupons ({total_coupons.toLocaleString()})
            </button>
          )}

          {total_users > 0 && (
            <button
              onClick={() => handleTabChange('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users ({total_users.toLocaleString()})
            </button>
          )}

          {total_companies > 0 && (
            <button
              onClick={() => handleTabChange('companies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'companies'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Companies ({total_companies.toLocaleString()})
            </button>
          )}
        </nav>
      </div>

      {/* Search Results */}
      {total_results > 0 ? (
        <div className="space-y-8">
          {/* Users Results */}
          {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Users ({users.length})
              </h3>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/user/${user.handle}`}
                    onClick={() => handleResultClick('user', user.id, user)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.handle}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {user.display_name || user.handle}
                        </h4>
                        <p className="text-sm text-gray-500">@{user.handle}</p>
                        {user.bio && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
                        )}
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {user.karma || 0} karma
                          </span>
                          {user.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {user.location}
                            </span>
                          )}
                          {user.stats && (
                            <span className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {user.stats.total_contributions} posts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Companies Results */}
          {(activeTab === 'all' || activeTab === 'companies') && companies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Companies ({companies.length})
              </h3>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/company/${company.slug}`}
                    onClick={() => handleResultClick('company', company.id, company)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate flex items-center">
                          {company.name}
                          {company.is_verified && (
                            <CheckCircle className="w-4 h-4 ml-1 text-blue-500" />
                          )}
                        </h4>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {company.stats?.total_offers || 0} offers
                          </span>
                          {company.website_url && (
                            <span className="flex items-center">
                              <Globe className="w-3 h-3 mr-1" />
                              Website
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deals Results */}
          {(activeTab === 'all' || activeTab === 'deals') && deals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Deals ({deals.length})
              </h3>
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
                {deals.map((deal, index) => (
                  <div
                    key={deal.id}
                    onClick={() => handleResultClick('deal', deal.id, deal)}
                  >
                    <NewDealCard deal={deal} index={index} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupons Results */}
          {(activeTab === 'all' || activeTab === 'coupons') && coupons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Coupons ({coupons.length})
              </h3>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    onClick={() => handleResultClick('coupon', coupon.id, coupon)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                        {coupon.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-2">
                        {coupon.is_featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Featured
                          </span>
                        )}
                        {coupon.is_exclusive && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Exclusive
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {coupon.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{coupon.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {coupon.companies?.logo_url && (
                          <img
                            src={coupon.companies.logo_url}
                            alt={coupon.companies.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span className="text-xs text-gray-500">{coupon.companies?.name}</span>
                        {coupon.companies?.is_verified && (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-green-600">
                          {coupon.discount_value}% off
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Eye className="w-3 h-3" />
                          <span>{coupon.views_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {coupon.tags && coupon.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {coupon.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${tag.color}20`, 
                              color: tag.color 
                            }}
                          >
                            <Tag className="w-2 h-2 mr-1" />
                            {tag.name}
                          </span>
                        ))}
                        {coupon.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{coupon.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {coupon.coupon_code && (
                      <div className="mt-3 p-2 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {coupon.coupon_code}
                          </span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-6">
            {query ? (
              <>Try different keywords or check your spelling. You can also browse our categories below.</>
            ) : (
              <>Start typing to search for deals, coupons, users, and companies.</>
            )}
          </p>
          
          {suggestions.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Did you mean:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => window.location.href = `/search?q=${encodeURIComponent(suggestion.text)}`}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Browse All Content
          </Link>
        </div>
      )}
    </div>
  )
}

export default EnterpriseSearchResults
