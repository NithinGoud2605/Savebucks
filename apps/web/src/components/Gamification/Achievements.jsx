import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

const AchievementBadge = ({ achievement, isUnlocked = false, progress = 0, compact = false }) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  }

  const rarityBorders = {
    common: 'border-gray-300',
    uncommon: 'border-green-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-yellow-300'
  }

  if (compact) {
    return (
      <div className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${isUnlocked ? rarityBorders[achievement.rarity] : 'border-gray-200'
        } ${isUnlocked ? 'opacity-100' : 'opacity-50'}`}>
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${isUnlocked ? rarityColors[achievement.rarity] : 'from-gray-300 to-gray-400'
          } flex items-center justify-center`}>
          <span className="text-white text-xs">
            {achievement.badge_icon || '🏆'}
          </span>
        </div>
        {!isUnlocked && progress > 0 && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative p-4 rounded-xl border-2 ${isUnlocked ? rarityBorders[achievement.rarity] : 'border-gray-200'
      } ${isUnlocked ? 'bg-white' : 'bg-gray-50'} transition-all duration-300 hover:shadow-lg`}>
      {/* Rarity indicator */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${isUnlocked
        ? `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`
        : 'bg-gray-200 text-gray-600'
        }`}>
        {achievement.rarity}
      </div>

      <div className="flex items-start space-x-3">
        <div className={`w-12 h-12 rounded-full border-2 ${isUnlocked ? rarityBorders[achievement.rarity] : 'border-gray-200'
          } ${isUnlocked ? 'opacity-100' : 'opacity-50'}`}>
          <div className={`w-full h-full rounded-full bg-gradient-to-br ${isUnlocked ? rarityColors[achievement.rarity] : 'from-gray-300 to-gray-400'
            } flex items-center justify-center`}>
            <span className="text-white text-lg">
              {achievement.badge_icon || '🏆'}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
            {achievement.name}
          </h3>
          <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>

          {achievement.xp_reward > 0 && (
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                +{achievement.xp_reward} XP
              </span>
            </div>
          )}

          {!isUnlocked && progress > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {isUnlocked && achievement.completed_at && (
            <p className="text-xs text-gray-500 mt-2">
              Unlocked on {new Date(achievement.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const AchievementCategory = ({ category, achievements, userAchievements = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const categoryAchievements = achievements.filter(a => a.category === category)
  const unlockedCount = categoryAchievements.filter(a =>
    userAchievements.some(ua => ua.achievement_id === a.id)
  ).length

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-sm rounded-full">
            {unlockedCount}/{categoryAchievements.length}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryAchievements.map(achievement => {
            const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
            const isUnlocked = !!userAchievement
            const progress = userAchievement?.progress || 0

            return (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isUnlocked}
                progress={progress}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

const AchievementStats = ({ userAchievements, totalAchievements }) => {
  const unlockedCount = userAchievements?.length || 0
  const completionRate = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0

  const rarityStats = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  }

  userAchievements?.forEach(ua => {
    if (ua.achievement?.rarity && rarityStats.hasOwnProperty(ua.achievement.rarity)) {
      rarityStats[ua.achievement.rarity]++
    }
  })

  return (
    <div className="bg-white rounded-lg p-6 border">
      <h3 className="font-semibold text-gray-900 mb-4">Achievement Stats</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{unlockedCount}</div>
          <div className="text-sm text-gray-600">Unlocked</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{Math.round(completionRate)}%</div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">By Rarity</h4>
        {Object.entries(rarityStats).map(([rarity, count]) => (
          <div key={rarity} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 capitalize">{rarity}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Achievements({ userId, compact = false }) {
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.gamification.getAchievements(),
  })

  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => api.gamification.getUserAchievements(userId),
    enabled: !!userId,
  })

  const isLoading = achievementsLoading || userAchievementsLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No achievements available</p>
      </div>
    )
  }

  if (compact) {
    const recentAchievements = userAchievements?.slice(0, 5) || []
    return (
      <div className="flex items-center space-x-2">
        {recentAchievements.map(ua => {
          const achievement = achievements.find(a => a.id === ua.achievement_id)
          if (!achievement) return null

          return (
            <AchievementBadge
              key={ua.id}
              achievement={achievement}
              isUnlocked={true}
              compact={true}
            />
          )
        })}
        {recentAchievements.length < 5 && (
          <div className="text-sm text-gray-500">
            +{Math.max(0, (userAchievements?.length || 0) - 5)} more
          </div>
        )}
      </div>
    )
  }

  const categories = [...new Set(achievements.map(a => a.category))]

  return (
    <div className="space-y-6">
      <AchievementStats
        userAchievements={userAchievements}
        totalAchievements={achievements.length}
      />

      <div className="space-y-4">
        {categories.map(category => (
          <AchievementCategory
            key={category}
            category={category}
            achievements={achievements}
            userAchievements={userAchievements}
          />
        ))}
      </div>
    </div>
  )
}

export { AchievementBadge, AchievementStats }
