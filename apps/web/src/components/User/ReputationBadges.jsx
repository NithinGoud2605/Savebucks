import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { dateAgo, formatCompactNumber } from '../../lib/format'
import { clsx } from 'clsx'

export function ReputationBadges({ userId, variant = 'full', className = '', limit = null }) {
  const [showAll, setShowAll] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState(null)

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['user-badges', userId],
    queryFn: () => api.getUserBadges(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: reputation } = useQuery({
    queryKey: ['user-reputation', userId],
    queryFn: () => api.getUserReputation(userId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className={clsx('space-y-3', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="flex space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const earnedBadges = badges.filter(badge => badge.earned_at)
  const displayBadges = limit ? earnedBadges.slice(0, limit) : earnedBadges
  const visibleBadges = showAll ? earnedBadges : displayBadges

  const getBadgeRarity = (badge) => {
    if (!badge.total_holders) return 'common'
    if (badge.total_holders < 10) return 'legendary'
    if (badge.total_holders < 50) return 'epic'
    if (badge.total_holders < 200) return 'rare'
    if (badge.total_holders < 1000) return 'uncommon'
    return 'common'
  }

  const getBadgeRarityColor = (rarity) => {
    const colors = {
      legendary: 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-100',
      epic: 'border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100',
      rare: 'border-blue-400 bg-gradient-to-br from-blue-100 to-indigo-100',
      uncommon: 'border-green-400 bg-gradient-to-br from-green-100 to-emerald-100',
      common: 'border-gray-300 bg-gray-50'
    }
    return colors[rarity] || colors.common
  }

  const getReputationLevel = (points) => {
    if (points >= 10000) return { level: 'Legendary', icon: '👑', color: 'text-yellow-600' }
    if (points >= 5000) return { level: 'Expert', icon: '🏆', color: 'text-purple-600' }
    if (points >= 2000) return { level: 'Veteran', icon: 'VET', color: 'text-blue-600' }
    if (points >= 500) return { level: 'Regular', icon: 'REG', color: 'text-green-600' }
    if (points >= 100) return { level: 'Member', icon: '📈', color: 'text-orange-600' }
    return { level: 'Newcomer', icon: '🌟', color: 'text-gray-600' }
  }

  if (variant === 'compact') {
    return (
      <div className={clsx('flex items-center space-x-2', className)}>
        {reputation && (
          <div className="flex items-center space-x-1">
            <span className={clsx('text-sm', getReputationLevel(reputation.points).color)}>
              {getReputationLevel(reputation.points).icon}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {getReputationLevel(reputation.points).level}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-1">
          {visibleBadges.slice(0, 3).map(badge => (
            <div
              key={badge.id}
              className="w-6 h-6 flex items-center justify-center text-sm bg-gray-50 rounded-full"
              title={badge.name}
            >
              {badge.icon}
            </div>
          ))}
          {earnedBadges.length > 3 && (
            <span className="text-xs text-gray-500">
              +{earnedBadges.length - 3}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Reputation Level */}
      {reputation && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Reputation Level
            </h3>
            <div className={clsx('text-2xl', getReputationLevel(reputation.points).color)}>
              {getReputationLevel(reputation.points).icon}
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className={clsx('text-lg font-bold', getReputationLevel(reputation.points).color)}>
              {getReputationLevel(reputation.points).level}
            </span>
            <span className="text-sm text-gray-600">
              {formatCompactNumber(reputation.points)} points
            </span>
          </div>

          {/* Progress to next level */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress to next level</span>
              <span>{reputation.progress_to_next}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={clsx('h-2 rounded-full transition-all duration-500',
                  getReputationLevel(reputation.points).color.replace('text-', 'bg-')
                )}
                style={{ width: `${reputation.progress_to_next}%` }}
              />
            </div>
          </div>

          {/* Recent reputation changes */}
          {reputation.recent_changes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Recent changes</div>
              <div className="flex items-center space-x-4 text-xs">
                {reputation.recent_changes.today !== 0 && (
                  <span className={clsx(
                    reputation.recent_changes.today > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    Today: {reputation.recent_changes.today > 0 ? '+' : ''}{reputation.recent_changes.today}
                  </span>
                )}
                {reputation.recent_changes.week !== 0 && (
                  <span className={clsx(
                    reputation.recent_changes.week > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    Week: {reputation.recent_changes.week > 0 ? '+' : ''}{reputation.recent_changes.week}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Badges ({earnedBadges.length})
            </h3>
            {limit && earnedBadges.length > limit && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAll ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleBadges.map(badge => {
              const rarity = getBadgeRarity(badge)
              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={clsx(
                    'card p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-2',
                    getBadgeRarityColor(rarity)
                  )}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {badge.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {dateAgo(badge.earned_at)}
                    </div>

                    {/* Rarity indicator */}
                    <div className="mt-2">
                      <span className={clsx(
                        'inline-block px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider',
                        rarity === 'legendary' && 'bg-yellow-100 text-yellow-800',
                        rarity === 'epic' && 'bg-purple-100 text-purple-800',
                        rarity === 'rare' && 'bg-blue-100 text-blue-800',
                        rarity === 'uncommon' && 'bg-green-100 text-green-800',
                        rarity === 'common' && 'bg-gray-50 text-gray-800'
                      )}>
                        {rarity}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Badge Details Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
              onClick={() => setSelectedBadge(null)}
            />

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedBadge.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedBadge.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedBadge.description}
                </p>

                {/* Badge stats */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Earned:</span>
                    <span className="font-medium">{dateAgo(selectedBadge.earned_at)}</span>
                  </div>

                  {selectedBadge.total_holders && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Holders:</span>
                      <span className="font-medium">{formatCompactNumber(selectedBadge.total_holders)}</span>
                    </div>
                  )}

                  {selectedBadge.points_awarded && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Awarded:</span>
                      <span className="font-medium text-green-600">+{selectedBadge.points_awarded}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Rarity:</span>
                    <span className={clsx(
                      'font-medium capitalize',
                      getBadgeRarity(selectedBadge) === 'legendary' && 'text-yellow-600',
                      getBadgeRarity(selectedBadge) === 'epic' && 'text-purple-600',
                      getBadgeRarity(selectedBadge) === 'rare' && 'text-blue-600',
                      getBadgeRarity(selectedBadge) === 'uncommon' && 'text-green-600',
                      getBadgeRarity(selectedBadge) === 'common' && 'text-gray-600'
                    )}>
                      {getBadgeRarity(selectedBadge)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="mt-6 w-full btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {earnedBadges.length === 0 && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Badges Yet
          </h3>
          <p className="text-gray-500">
            Keep participating in the community to earn your first badge!
          </p>
        </div>
      )}
    </div>
  )
}
