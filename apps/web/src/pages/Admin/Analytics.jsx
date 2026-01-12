import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  ChartBarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const Analytics = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.getAdminAnalytics(),
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Error Loading Analytics
        </h3>
        <p className="text-secondary-600">
          Unable to load analytics data. Please try again.
        </p>
      </div>
    )
  }

  const topContributors = analytics?.topContributors || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Analytics Dashboard</h2>
        <p className="text-secondary-600 mt-1">
          Detailed insights into user engagement and platform performance
        </p>
      </div>

      {/* Top Contributors */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-secondary-900">Top Contributors</h3>
          </div>
        </div>
        <div className="p-6">
          {topContributors.length > 0 ? (
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div key={contributor.handle} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-50 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-secondary-100 text-secondary-600'
                      }`}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {contributor.avatar_url ? (
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.handle}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {contributor.handle?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900">{contributor.handle}</p>
                    <div className="flex items-center space-x-4 text-sm text-secondary-500">
                      <span>{contributor.karma} karma</span>
                      <span>{contributor.total_posts} posts</span>
                      <span>{contributor.total_comments} comments</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {contributor.karma}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">No contributor data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Voting Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Votes */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h3 className="text-lg font-semibold text-secondary-900">Deal Voting Activity</h3>
          </div>
          <div className="p-6">
            {analytics?.votes?.deals?.length > 0 ? (
              <div className="space-y-3">
                {analytics.votes.deals.slice(0, 5).map((vote, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Deal #{vote.deal_id}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-green-600">↑ {vote.upvotes}</span>
                      <span className="text-sm text-red-600">↓ {vote.downvotes}</span>
                      <span className="text-sm font-medium text-secondary-900">
                        Score: {vote.upvotes - vote.downvotes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-8">No voting data available</p>
            )}
          </div>
        </div>

        {/* Coupon Votes */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h3 className="text-lg font-semibold text-secondary-900">Coupon Voting Activity</h3>
          </div>
          <div className="p-6">
            {analytics?.votes?.coupons?.length > 0 ? (
              <div className="space-y-3">
                {analytics.votes.coupons.slice(0, 5).map((vote, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Coupon #{vote.coupon_id}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-green-600">↑ {vote.upvotes}</span>
                      <span className="text-sm text-red-600">↓ {vote.downvotes}</span>
                      <span className="text-sm font-medium text-secondary-900">
                        Score: {vote.upvotes - vote.downvotes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-8">No voting data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900">Platform Engagement</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {topContributors.reduce((sum, user) => sum + (user.total_posts || 0), 0)}
              </div>
              <div className="text-sm text-secondary-600">Total Posts</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {topContributors.reduce((sum, user) => sum + (user.total_comments || 0), 0)}
              </div>
              <div className="text-sm text-secondary-600">Total Comments</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {topContributors.reduce((sum, user) => sum + (user.karma || 0), 0)}
              </div>
              <div className="text-sm text-secondary-600">Total Karma</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
