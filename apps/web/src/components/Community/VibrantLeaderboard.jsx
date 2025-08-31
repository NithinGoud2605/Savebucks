import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'
import { clsx } from 'clsx'

export function VibrantLeaderboard({ compact = false, showViewMore = true, className }) {
  const [timeframe, setTimeframe] = useState('weekly')
  
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', timeframe],
    queryFn: () => apiRequest(`/api/leaderboard?period=${timeframe}&limit=${compact ? 5 : 10}`),
    refetchInterval: 60000,
    initialData: [
      { id: 1, handle: 'dealmaster', karma: 2450, total_posts: 156, rank: 1, avatar_url: null, role: 'user' },
      { id: 2, handle: 'bargainhunter', karma: 2180, total_posts: 142, rank: 2, avatar_url: null, role: 'user' },
      { id: 3, handle: 'savingsqueen', karma: 1890, total_posts: 98, rank: 3, avatar_url: null, role: 'user' },
      { id: 4, handle: 'techdeals', karma: 1650, total_posts: 89, rank: 4, avatar_url: null, role: 'user' },
      { id: 5, handle: 'couponking', karma: 1420, total_posts: 76, rank: 5, avatar_url: null, role: 'admin' }
    ]
  })

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈' 
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-amber-600 to-yellow-700'
      default: return 'from-blue-400 to-indigo-500'
    }
  }

  const getKarmaColor = (karma) => {
    if (karma >= 2000) return 'text-red-600'
    if (karma >= 1500) return 'text-orange-600'
    if (karma >= 1000) return 'text-yellow-600'
    if (karma >= 500) return 'text-green-600'
    return 'text-blue-600'
  }

  if (isLoading) {
    return (
      <div className={clsx('bg-white rounded-3xl shadow-xl p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(
      'bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏆</div>
            <div>
              <h3 className="text-xl font-bold">Community Leaders</h3>
              <p className="text-purple-100 text-sm">Top deal hunters this {timeframe.slice(0, -2)}</p>
            </div>
          </div>
          
          {!compact && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
              <div className="flex space-x-1">
                {['weekly', 'monthly', 'all_time'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                      timeframe === period
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {period === 'all_time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{leaderboard.length}</div>
            <div className="text-xs text-purple-100">Active Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {leaderboard.reduce((sum, user) => sum + (user.total_posts || 0), 0)}
            </div>
            <div className="text-xs text-purple-100">Total Posts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {leaderboard.reduce((sum, user) => sum + (user.karma || 0), 0)}
            </div>
            <div className="text-xs text-purple-100">Total Karma</div>
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="p-6">
        <div className="space-y-4">
          {leaderboard.map((user, index) => (
            <div
              key={user.id}
              className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              <div className="flex items-center space-x-4">
                {/* Rank badge */}
                <div className={clsx(
                  'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg',
                  'bg-gradient-to-br', getRankColor(user.rank)
                )}>
                  <span className="text-lg">
                    {typeof getRankIcon(user.rank) === 'string' && getRankIcon(user.rank).includes('#') 
                      ? getRankIcon(user.rank)
                      : <span className="text-xl">{getRankIcon(user.rank)}</span>
                    }
                  </span>
                </div>

                {/* User avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.handle}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.handle.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* Role badges */}
                  {user.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">👑</span>
                    </div>
                  )}
                  {user.role === 'mod' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">⭐</span>
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link
                      to={`/user/${user.handle}`}
                      className="font-bold text-gray-900 hover:text-purple-600 transition-colors truncate"
                    >
                      @{user.handle}
                    </Link>
                    
                    {/* Achievement badges */}
                    {user.karma >= 2000 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        🔥 Legend
                      </span>
                    )}
                    {user.karma >= 1000 && user.karma < 2000 && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        ⭐ Expert
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span className="text-red-500">❤️</span>
                      <span className={clsx('font-semibold', getKarmaColor(user.karma))}>
                        {user.karma?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-500">📝</span>
                      <span>{user.total_posts || 0} posts</span>
                    </div>
                    {user.total_comments && (
                      <div className="flex items-center space-x-1">
                        <span className="text-green-500">💬</span>
                        <span>{user.total_comments} comments</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trending indicator */}
                {index < 3 && (
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                      🔥 Hot
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar for karma */}
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={clsx(
                      'h-full bg-gradient-to-r transition-all duration-500',
                      getRankColor(user.rank)
                    )}
                    style={{
                      width: `${Math.min(100, (user.karma / Math.max(...leaderboard.map(u => u.karma))) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View more button */}
        {showViewMore && (
          <div className="text-center mt-6">
            <Link
              to="/leaderboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>View Full Leaderboard</span>
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Join community CTA */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-bold text-gray-900 mb-2">Join the Competition!</h4>
            <p className="text-sm text-gray-600 mb-3">Share great deals and climb the leaderboard</p>
            <Link
              to="/post-deal"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl text-sm hover:shadow-lg transition-all duration-300"
            >
              Post Your First Deal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
