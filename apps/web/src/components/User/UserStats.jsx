import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatCompactNumber, formatPercentage, dateAgo } from '../../lib/format'
import { Skeleton } from '../ui/Skeleton'
import { clsx } from 'clsx'

export function UserStats({ userId, variant = 'full', className = '' }) {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => api.getUserStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => api.getUserAchievements(userId),
    enabled: variant === 'full',
  })

  if (isLoading) {
    return (
      <div className={clsx('space-y-6', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      label: 'Total Karma',
      value: formatCompactNumber(stats.karma),
      change: stats.karma_change_30d,
      icon: 'KARMA',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'Deals Posted',
      value: formatCompactNumber(stats.deals_posted),
      change: stats.deals_posted_change_30d,
      icon: 'DEALS',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Comments Made',
      value: formatCompactNumber(stats.comments_made),
      change: stats.comments_change_30d,
      icon: 'CHAT',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Success Rate',
      value: formatPercentage(stats.successful_deals, stats.deals_posted),
      icon: 'TREND',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  if (variant === 'compact') {
    return (
      <div className={clsx('grid grid-cols-2 gap-3', className)}>
        {statCards.slice(0, 4).map((stat, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className={clsx('card p-6', stat.bgColor)}>
            <div className="flex items-center justify-between mb-3">
              <div className={clsx('text-2xl', stat.color)}>
                {stat.icon}
              </div>
              {stat.change !== undefined && (
                <div className={clsx(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  stat.change > 0
                    ? 'bg-green-100 text-green-800'
                    : stat.change < 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-50 text-gray-800'
                )}>
                  {stat.change > 0 ? '+' : ''}{stat.change}
                </div>
              )}
            </div>
            <div className={clsx('text-2xl font-bold mb-1', stat.color)}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Statistics Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: 'INFO' },
              { key: 'activity', label: 'Activity', icon: 'ACT' },
              { key: 'achievements', label: 'Achievements', icon: 'AWARD' },
              { key: 'engagement', label: 'Engagement', icon: '👥' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Activity Heatmap */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Over Time
                </h3>
                <div className="grid grid-cols-12 gap-1">
                  {stats.activity_heatmap?.map((week, weekIndex) => (
                    <div key={weekIndex} className="space-y-1">
                      {week.map((day, dayIndex) => (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={clsx(
                            'w-3 h-3 rounded-sm',
                            day === 0 && 'bg-gray-50',
                            day > 0 && day <= 2 && 'bg-green-200',
                            day > 2 && day <= 5 && 'bg-green-400',
                            day > 5 && 'bg-green-600'
                          )}
                          title={`${day} activities`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Less</span>
                  <span>More</span>
                </div>
              </div>

              {/* Best Performing Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Best Performing Content
                </h3>
                <div className="space-y-3">
                  {stats.best_deals?.slice(0, 3).map((deal, index) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {deal.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dateAgo(deal.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +{deal.karma}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deal.views} views
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats.monthly_stats || {}).map(([month, data]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-gray-600">{month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-blue-600">{data.deals} deals</span>
                        <span className="text-sm text-green-600">{data.karma} karma</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Category Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.category_breakdown || {}).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-600">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(count / stats.deals_posted) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && achievements && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Badges & Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="card p-4 text-center">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="font-semibold text-gray-900">
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {achievement.description}
                    </div>
                    {achievement.earned_at && (
                      <div className="text-xs text-gray-500 mt-2">
                        Earned {dateAgo(achievement.earned_at)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCompactNumber(stats.total_followers || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCompactNumber(stats.total_following || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(stats.engagement_rate || 0, 1)}
                  </div>
                  <div className="text-sm text-gray-600">Engagement Rate</div>
                </div>
              </div>

              {/* Top Interactions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Most Engaged With
                </h3>
                <div className="space-y-3">
                  {stats.top_interactions?.map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {interaction.user.handle[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{interaction.user.handle}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {interaction.count} interactions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
