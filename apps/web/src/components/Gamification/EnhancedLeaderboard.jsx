import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { XPBadge } from './XPDisplay'
import { AchievementBadge } from './Achievements'

const LeaderboardEntry = ({ user, rank, showDetails = false }) => {
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600'
    if (rank === 2) return 'text-gray-500'
    if (rank === 3) return 'text-orange-600'
    return 'text-gray-700'
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
      rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Rank */}
          <div className={`text-2xl font-bold ${getRankColor(rank)} min-w-[3rem] text-center`}>
            {getRankIcon(rank)}
          </div>

          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.handle}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.handle?.charAt(0).toUpperCase()
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{user.handle}</h3>
              {user.level && (
                <XPBadge level={user.level} size="xs" />
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{user.total_points || 0} points</span>
              {user.total_xp && <span>{user.total_xp} XP</span>}
              {user.deals_count && <span>{user.deals_count} deals</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          {showDetails && (
            <div className="space-y-1 text-sm text-gray-600">
              {user.weekly_points && <div>This week: {user.weekly_points} pts</div>}
              {user.monthly_points && <div>This month: {user.monthly_points} pts</div>}
              {user.achievements_count && <div>{user.achievements_count} achievements</div>}
            </div>
          )}
        </div>
      </div>

      {/* Recent Achievements */}
      {showDetails && user.recent_achievements && user.recent_achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Recent:</span>
            <div className="flex space-x-1">
              {user.recent_achievements.slice(0, 3).map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  achievement={achievement}
                  isUnlocked={true}
                  compact={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LeaderboardFilters = ({ filters, onFiltersChange }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Time Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Period
        </label>
        <select
          value={filters.period}
          onChange={(e) => onFiltersChange({ ...filters, period: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all_time">All Time</option>
          <option value="monthly">This Month</option>
          <option value="weekly">This Week</option>
          <option value="daily">Today</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="overall">Overall</option>
          <option value="deals">Deal Posters</option>
          <option value="comments">Commenters</option>
          <option value="votes">Voters</option>
          <option value="achievements">Achievement Hunters</option>
        </select>
      </div>

      {/* Limit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Show
        </label>
        <select
          value={filters.limit}
          onChange={(e) => onFiltersChange({ ...filters, limit: parseInt(e.target.value) })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">Top 10</option>
          <option value="25">Top 25</option>
          <option value="50">Top 50</option>
          <option value="100">Top 100</option>
        </select>
      </div>

      {/* Include Achievements */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="include-achievements"
          checked={filters.include_achievements}
          onChange={(e) => onFiltersChange({ ...filters, include_achievements: e.target.checked })}
          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="include-achievements" className="text-sm text-gray-700">
          Show achievements
        </label>
      </div>
    </div>
  )
}

const LeaderboardStats = ({ stats }) => {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg p-4 border text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
        <div className="text-sm text-gray-600">Total Users</div>
      </div>
      <div className="bg-white rounded-lg p-4 border text-center">
        <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
        <div className="text-sm text-gray-600">Active This Week</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.total_points}</div>
        <div className="text-sm text-gray-600">Total Points</div>
      </div>
      <div className="bg-white rounded-lg p-4 border text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.achievements_unlocked}</div>
        <div className="text-sm text-gray-600">Achievements Unlocked</div>
      </div>
    </div>
  )
}

export default function EnhancedLeaderboard({ compact = false, showFilters = true }) {
  const [filters, setFilters] = useState({
    period: 'all_time',
    category: 'overall',
    limit: compact ? 5 : 25,
    include_achievements: true,
  })

  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['enhanced-leaderboard', filters],
    queryFn: () => api.gamification.getLeaderboard(filters),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(compact ? 3 : 10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        <p>Failed to load leaderboard</p>
      </div>
    )
  }

  const { users = [], stats } = leaderboardData || {}

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No users found for the selected criteria</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!compact && showFilters && (
        <LeaderboardFilters filters={filters} onFiltersChange={setFilters} />
      )}
      
      {!compact && <LeaderboardStats stats={stats} />}

      <div className="space-y-3">
        {compact && (
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Top Contributors</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </button>
          </div>
        )}
        
        {users.map((user, index) => (
          <LeaderboardEntry
            key={user.id}
            user={user}
            rank={user.rank || index + 1}
            showDetails={!compact && filters.include_achievements}
          />
        ))}
      </div>

      {compact && users.length >= filters.limit && (
        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Full Leaderboard →
          </button>
        </div>
      )}
    </div>
  )
}

export { LeaderboardEntry, LeaderboardFilters }
