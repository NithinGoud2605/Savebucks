import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

const XPProgressBar = ({ currentXP, nextLevelXP, level, compact = false }) => {
  const progress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 100

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">{level}</span>
          </div>
          <span className="text-xs font-medium text-gray-700">{currentXP} XP</span>
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[60px]">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-white">{level}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Level {level}</h3>
            <p className="text-sm text-gray-600">{currentXP} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Next Level</p>
          <p className="font-medium">{nextLevelXP - currentXP} XP to go</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress to Level {level + 1}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

const XPBadge = ({ xp, level, size = 'sm' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
      {level}
    </div>
  )
}

const RecentXPGains = ({ userId }) => {
  const { data: xpHistory, isLoading } = useQuery({
    queryKey: ['user-xp-history', userId],
    queryFn: () => api.gamification.getUserXP(userId),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 bg-gray-200 h-4 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!xpHistory?.recent_gains || xpHistory.recent_gains.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">No recent XP gains</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Recent XP Gains</h4>
      <div className="space-y-2">
        {xpHistory.recent_gains.map((gain, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">+{gain.xp_awarded}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{gain.event_type}</p>
                <p className="text-xs text-gray-600">
                  {new Date(gain.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {gain.description && (
              <p className="text-xs text-gray-500 max-w-xs truncate">
                {gain.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function XPDisplay({ userId, compact = false }) {
  const { data: userLevel, isLoading, error } = useQuery({
    queryKey: ['user-level', userId],
    queryFn: () => api.gamification.getUserLevel(userId),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        {compact ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-2 bg-gray-200 rounded-full"></div>
          </div>
        ) : (
          <div className="bg-gray-200 h-24 rounded-lg"></div>
        )}
      </div>
    )
  }

  if (error || !userLevel) {
    return compact ? null : (
      <div className="text-red-500 text-sm">
        Failed to load XP data
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <XPProgressBar
        currentXP={userLevel.current_xp}
        nextLevelXP={userLevel.next_level_xp}
        level={userLevel.level}
        compact={compact}
      />

      {!compact && (
        <RecentXPGains userId={userId} />
      )}
    </div>
  )
}

export { XPProgressBar, XPBadge, RecentXPGains }
