import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { dateAgo, formatPrice, pluralize } from '../../lib/format'
import { Skeleton } from '../ui/Skeleton'
import { clsx } from 'clsx'

export function ActivityFeed({ userId, filter = 'all', limit = 20, showControls = true }) {
  const [activeFilter, setActiveFilter] = useState(filter)
  const [showReactions, setShowReactions] = useState(false)

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['user-activity', userId, activeFilter, limit],
    queryFn: () => api.getUserActivity(userId, {
      type: activeFilter !== 'all' ? activeFilter : undefined,
      limit
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  const activityTypes = [
    { key: 'all', label: 'All Activity', icon: '📊' },
    { key: 'deals', label: 'Deals Posted', icon: 'DEAL' },
    { key: 'comments', label: 'Comments', icon: 'CHAT' },
    { key: 'votes', label: 'Votes Cast', icon: '👍' },
    { key: 'follows', label: 'Follows', icon: '👥' },
    { key: 'badges', label: 'Badges Earned', icon: '🏆' },
  ]

  const getActivityIcon = (activity) => {
    const icons = {
      deal_posted: 'DEAL',
      deal_voted: '👍',
      deal_commented: 'CHAT',
      deal_bookmarked: '📌',
      deal_shared: '📤',
      user_followed: '👥',
      user_mentioned: '📢',
      badge_earned: '🏆',
      forum_posted: 'POST',
      forum_replied: 'REPLY',
      price_alert_created: '🔔',
      deal_expired_reported: 'WARN',
    }
    return icons[activity.type] || '📊'
  }

  const getActivityColor = (activity) => {
    const colors = {
      deal_posted: 'text-blue-600',
      deal_voted: 'text-green-600',
      deal_commented: 'text-purple-600',
      deal_bookmarked: 'text-yellow-600',
      deal_shared: 'text-pink-600',
      user_followed: 'text-indigo-600',
      badge_earned: 'text-orange-600',
      forum_posted: 'text-teal-600',
      price_alert_created: 'text-red-600',
    }
    return colors[activity.type] || 'text-gray-600'
  }

  const renderActivity = (activity) => {
    const baseClass = "flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"

    return (
      <div key={`${activity.type}-${activity.id}`} className={baseClass}>
        <div className={clsx("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg",
          getActivityColor(activity).replace('text-', 'bg-').replace('-600', '-100'),
          getActivityColor(activity).replace('-600', '-800')
        )}>
          {getActivityIcon(activity)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {renderActivityContent(activity)}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span title={new Date(activity.created_at).toLocaleString()}>
                  {dateAgo(activity.created_at)}
                </span>
                {activity.location && (
                  <>
                    <span>•</span>
                    <span>{activity.location}</span>
                  </>
                )}
                {activity.points && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      +{activity.points} karma
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Activity Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {activity.can_react && (
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                  title="React"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}

              <button
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                title="Share activity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Reaction Panel */}
          {showReactions && activity.can_react && (
            <div className="mt-3 flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              {['Like', 'Love', 'Great', 'Hot', 'Perfect', 'Funny'].map(reaction => (
                <button
                  key={reaction}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-sm font-medium"
                  onClick={() => {
                    // Handle reaction
                    setShowReactions(false)
                  }}
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderActivityContent = (activity) => {
    switch (activity.type) {
      case 'deal_posted':
        return (
          <div>
            <span className="font-medium">Posted a new deal</span>
            <Link
              to={`/deal/${activity.deal.id}`}
              className="block mt-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {activity.deal.title}
            </Link>
            {activity.deal.price !== undefined && (
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(activity.deal.price)}
                </span>
                {activity.deal.list_price > activity.deal.price && (
                  <span className="text-gray-500 line-through text-sm">
                    {formatPrice(activity.deal.list_price)}
                  </span>
                )}
              </div>
            )}
          </div>
        )

      case 'deal_voted':
        return (
          <div>
            <span className="font-medium">
              {activity.vote_type === 'up' ? 'Upvoted' : 'Downvoted'} a deal
            </span>
            <Link
              to={`/deal/${activity.deal.id}`}
              className="block mt-1 text-blue-600 hover:text-blue-700"
            >
              {activity.deal.title}
            </Link>
          </div>
        )

      case 'deal_commented':
        return (
          <div>
            <span className="font-medium">Commented on</span>
            <Link
              to={`/deal/${activity.deal.id}#comment-${activity.comment.id}`}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {activity.deal.title}
            </Link>
            {activity.comment.content && (
              <blockquote className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500 italic">
                "{activity.comment.content.substring(0, 150)}{activity.comment.content.length > 150 ? '...' : ''}"
              </blockquote>
            )}
          </div>
        )

      case 'user_followed':
        return (
          <div>
            <span className="font-medium">Started following</span>
            <Link
              to={`/u/${activity.target_user.handle}`}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              @{activity.target_user.handle}
            </Link>
          </div>
        )

      case 'badge_earned':
        return (
          <div className="flex items-center space-x-3">
            <span className="font-medium">Earned a badge</span>
            <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              <span className="text-lg">{activity.badge.icon}</span>
              <span className="font-semibold">{activity.badge.name}</span>
            </div>
          </div>
        )

      case 'forum_posted':
        return (
          <div>
            <span className="font-medium">Created a forum post</span>
            <Link
              to={`/forums/${activity.forum.category}/${activity.post.id}`}
              className="block mt-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {activity.post.title}
            </Link>
          </div>
        )

      case 'price_alert_created':
        return (
          <div>
            <span className="font-medium">Set up price alert for</span>
            <Link
              to={`/deal/${activity.deal.id}`}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {activity.deal.title}
            </Link>
            <div className="mt-1 text-sm text-gray-600">
              Alert when price drops below {formatPrice(activity.target_price)}
            </div>
          </div>
        )

      default:
        return (
          <div>
            <span className="font-medium capitalize">
              {activity.type.replace(/_/g, ' ')}
            </span>
            {activity.description && (
              <div className="mt-1 text-gray-600">
                {activity.description}
              </div>
            )}
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Activity Filters */}
      {showControls && (
        <div className="flex flex-wrap gap-2">
          {activityTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setActiveFilter(type.key)}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                activeFilter === type.key
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Activity Stream */}
      <div className="divide-y divide-gray-200">
        {activities.length > 0 ? (
          activities.map(renderActivity)
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Activity Yet
            </h3>
            <p className="text-gray-500">
              {activeFilter === 'all'
                ? "This user hasn't been active recently."
                : `No ${activeFilter} activity found.`}
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {activities.length >= limit && (
        <div className="text-center">
          <button className="btn-secondary">
            Load More Activity
          </button>
        </div>
      )}
    </div>
  )
}
