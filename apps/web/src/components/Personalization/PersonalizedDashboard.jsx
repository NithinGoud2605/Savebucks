import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  StarIcon,
  HeartIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  SparklesIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../../lib/toast'
import { formatPrice, dateAgo } from '../../lib/format'
import ImageWithFallback from '../ui/ImageWithFallback'

const PersonalizedDashboard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('recommendations')

  // Fetch personalized dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['personalized-dashboard'],
    queryFn: api.getPersonalizedDashboard,
    enabled: !!user
  })

  // Generate new recommendations mutation
  const generateRecommendationsMutation = useMutation({
    mutationFn: api.generateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries(['personalized-dashboard'])
      toast.success('Recommendations updated!')
    },
    onError: (error) => {
      toast.error('Failed to generate recommendations')
    }
  })

  const handleGenerateRecommendations = () => {
    generateRecommendationsMutation.mutate()
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Personalized Dashboard</h1>
          <p className="text-gray-600">Please log in to view your personalized dashboard.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { preferences, recommendations, interests, recentActivity, savedSearches } = dashboardData || {}

  const tabs = [
    { id: 'recommendations', name: 'Recommendations', icon: SparklesIcon },
    { id: 'interests', name: 'Interests', icon: HeartIcon },
    { id: 'activity', name: 'Activity', icon: ChartBarIcon },
    { id: 'searches', name: 'Saved Searches', icon: MagnifyingGlassIcon }
  ]

  const renderRecommendations = () => {
    if (!recommendations || recommendations.length === 0) {
      return (
        <div className="text-center py-12">
          <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600 mb-4">
            We're learning about your preferences. Browse some deals to get personalized recommendations!
          </p>
          <button
            onClick={handleGenerateRecommendations}
            disabled={generateRecommendationsMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generateRecommendationsMutation.isPending ? 'Generating...' : 'Generate Recommendations'}
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
          <button
            onClick={handleGenerateRecommendations}
            disabled={generateRecommendationsMutation.isPending}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {rec.recommendation_type}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <StarIcon className="w-3 h-3 mr-1" />
                  {rec.score.toFixed(1)}
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {rec.metadata?.title || `Recommendation ${rec.id}`}
              </h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {rec.reason}
              </p>
              <Link
                to={`/deal/${rec.target_id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Deal →
              </Link>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderInterests = () => {
    if (!interests || interests.length === 0) {
      return (
        <div className="text-center py-12">
          <HeartIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interests yet</h3>
          <p className="text-gray-600">Start browsing deals to build your interest profile!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Interests</h3>
        <div className="space-y-3">
          {interests.map((interest) => (
            <div key={interest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 capitalize">
                  {interest.interest_type.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600">{interest.interest_value}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {interest.activity_count} activities
                </div>
                <div className="text-xs text-gray-500">
                  Weight: {interest.interest_weight.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderActivity = () => {
    if (!recentActivity || recentActivity.length === 0) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
          <p className="text-gray-600">Start browsing to see your activity here!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {activity.activity_type === 'deal_view' && <EyeIcon className="w-4 h-4 text-blue-600" />}
                {activity.activity_type === 'deal_click' && <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />}
                {activity.activity_type === 'deal_save' && <BookmarkIcon className="w-4 h-4 text-yellow-600" />}
                {activity.activity_type === 'search' && <MagnifyingGlassIcon className="w-4 h-4 text-purple-600" />}
                {activity.activity_type === 'review_submit' && <StarIcon className="w-4 h-4 text-orange-600" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {activity.activity_type.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  {dateAgo(activity.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSavedSearches = () => {
    if (!savedSearches || savedSearches.length === 0) {
      return (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches</h3>
          <p className="text-gray-600">Save your favorite searches to get notified of new results!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Saved Searches</h3>
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <div key={search.id} className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{search.search_name}</h4>
                {search.notify_on_new_results && (
                  <BellIcon className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{search.search_query}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{search.search_count} searches</span>
                <span>{dateAgo(search.last_searched)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Dashboard</h1>
        <p className="text-gray-600">Personalized content based on your preferences and activity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {recommendations?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Recommendations</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <HeartIcon className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {interests?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Interests</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {recentActivity?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Recent Activities</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {savedSearches?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Saved Searches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'recommendations' && renderRecommendations()}
        {activeTab === 'interests' && renderInterests()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'searches' && renderSavedSearches()}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/new"
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            <div className="ml-3">
              <div className="font-medium text-blue-900">Browse New Deals</div>
              <div className="text-sm text-blue-700">Discover the latest deals</div>
            </div>
          </div>
        </Link>
        <Link
          to="/saved-items"
          className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center">
            <BookmarkIcon className="w-6 h-6 text-green-600" />
            <div className="ml-3">
              <div className="font-medium text-green-900">Saved Items</div>
              <div className="text-sm text-green-700">View your saved deals</div>
            </div>
          </div>
        </Link>
        <Link
          to="/profile"
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center">
            <Cog6ToothIcon className="w-6 h-6 text-purple-600" />
            <div className="ml-3">
              <div className="font-medium text-purple-900">Preferences</div>
              <div className="text-sm text-purple-700">Customize your experience</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default PersonalizedDashboard
