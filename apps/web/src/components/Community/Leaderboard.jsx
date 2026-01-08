import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Skeleton } from '../ui/Skeleton'
import { TrophyIcon, FireIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

const Leaderboard = ({ compact = false, showViewMore = true }) => {
  const [period, setPeriod] = useState('all_time')
  const limit = compact ? 10 : 50

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', period, limit],
    queryFn: () => api.getLeaderboard(period, limit),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  })

  const periods = [
    { key: 'weekly', label: 'This Week', icon: CalendarIcon },
    { key: 'monthly', label: 'This Month', icon: ClockIcon },
    { key: 'all_time', label: 'All Time', icon: TrophyIcon }
  ]

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="w-5 h-5 text-yellow-500" />
      case 2:
        return <TrophyIcon className="w-5 h-5 text-gray-400" />
      case 3:
        return <TrophyIcon className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-secondary-600">#{rank}</span>
    }
  }

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
      default:
        return 'bg-secondary-100 text-secondary-700'
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-600">Failed to load leaderboard</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-secondary-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrophyIcon className="w-6 h-6 text-primary-600" />
          <h2 className={`font-bold text-secondary-900 ${compact ? 'text-lg' : 'text-xl'}`}>
            Top Contributors
          </h2>
        </div>
        
        {showViewMore && compact && (
          <Link
            to="/leaderboard"
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>View More</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Period Selector */}
      {!compact && (
        <div className="flex space-x-1 mb-6 bg-secondary-100 p-1 rounded-lg">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === p.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              <p.icon className="w-4 h-4" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Compact Period Indicator */}
      {compact && (
        <div className="flex items-center space-x-2 mb-4 text-sm text-secondary-600">
          <FireIcon className="w-4 h-4" />
          <span>All Time Leaders</span>
        </div>
      )}

      {/* Leaderboard List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(compact ? 5 : 10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : leaderboard && leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((user, index) => (
            <div
              key={user.user_id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-secondary-50 ${
                index < 3 ? 'bg-gradient-to-r from-secondary-50 to-transparent' : ''
              }`}
            >
              {/* Rank */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadge(user.rank)}`}>
                {user.rank <= 3 ? getRankIcon(user.rank) : user.rank}
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.handle}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-secondary-300 rounded-full flex items-center justify-center">
                    <span className="text-secondary-600 font-medium">
                      {user.handle?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/u/${user.handle}`}
                    className="font-medium text-secondary-900 hover:text-primary-600 transition-colors truncate block"
                  >
                    {user.handle}
                  </Link>
                  <div className="flex items-center space-x-4 text-xs text-secondary-500">
                    <span>{user.total_posts} deals</span>
                    <span>{user.karma} karma</span>
                    {!compact && <span>{user.total_comments} comments</span>}
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-lg text-primary-600">
                  {user.points.toLocaleString()}
                </div>
                <div className="text-xs text-secondary-500">
                  points
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrophyIcon className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-600">No contributors yet</p>
          <p className="text-sm text-secondary-500 mt-1">
            Be the first to post a deal or coupon and climb the leaderboard!
          </p>
        </div>
      )}

      {/* Footer for compact view */}
      {compact && leaderboard && leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-secondary-100">
          <div className="flex items-center justify-between text-sm text-secondary-600">
            <span>Showing top {Math.min(10, leaderboard.length)} contributors</span>
            <Link
              to="/leaderboard"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View Full Rankings →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
