import React from 'react'
import { motion } from 'framer-motion'
import {
  StarIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline'

export default function KarmaDisplay({
  karma = 0,
  level = 1,
  className = '',
  showLevel = true,
  size = 'md'
}) {
  const getKarmaLevel = () => {
    if (karma < 50) return { level: 'Newcomer', color: 'text-gray-600', bg: 'bg-gray-50', icon: StarIcon }
    if (karma < 200) return { level: 'Contributor', color: 'text-blue-600', bg: 'bg-blue-100', icon: SparklesIcon }
    if (karma < 500) return { level: 'Expert', color: 'text-green-600', bg: 'bg-green-100', icon: TrophyIcon }
    if (karma < 1000) return { level: 'Master', color: 'text-purple-600', bg: 'bg-purple-100', icon: TrophyIcon }
    return { level: 'Legend', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: FireIcon }
  }

  const karmaLevel = getKarmaLevel()
  const Icon = karmaLevel.icon

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <motion.div
      className={`bg-white rounded-lg border border-gray-200 ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${karmaLevel.bg}`}>
          <Icon className={`${iconSizes[size]} ${karmaLevel.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${textSizes[size]} text-gray-900`}>
              {karma.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">karma</span>
          </div>
          {showLevel && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${karmaLevel.color}`}>
                {karmaLevel.level}
              </span>
              <span className="text-xs text-gray-500">Level {level}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}














