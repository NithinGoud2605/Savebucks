import React from 'react'
import { clsx } from 'clsx'

export function DealScore({ score, comments, views, temperature, className }) {
  const getScoreColor = () => {
    if (score >= 50) return 'text-green-600'
    if (score >= 10) return 'text-blue-600'
    if (score >= 0) return 'text-gray-600'
    return 'text-red-600'
  }
  
  const getEngagementLevel = () => {
    const totalEngagement = score + comments * 2 + Math.floor(views / 10)
    if (totalEngagement >= 100) return 'High'
    if (totalEngagement >= 50) return 'Medium'
    return 'Low'
  }
  
  return (
    <div className={clsx('mt-4 pt-3 border-t border-gray-200', className)}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span>Score:</span>
            <span className={clsx('font-semibold', getScoreColor())}>
              {score > 0 ? `+${score}` : score}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>Engagement:</span>
            <span className={clsx(
              'font-semibold',
              getEngagementLevel() === 'High' ? 'text-green-600' :
              getEngagementLevel() === 'Medium' ? 'text-yellow-600' :
              'text-gray-600'
            )}>
              {getEngagementLevel()}
            </span>
          </div>
          
          {temperature > 0 && (
            <div className="flex items-center space-x-1">
              <span>Temp:</span>
              <span className={clsx(
                'font-semibold',
                temperature >= 100 ? 'text-red-600' :
                temperature >= 50 ? 'text-orange-600' :
                temperature >= 20 ? 'text-yellow-600' :
                'text-blue-600'
              )}>
                {temperature}°
              </span>
            </div>
          )}
        </div>
        
        <div className="text-gray-400">
          Algorithm v2.1
        </div>
      </div>
    </div>
  )
}
