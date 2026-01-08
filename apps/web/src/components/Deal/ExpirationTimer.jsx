import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'

export function ExpirationTimer({ expiresAt, className }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgency, setUrgency] = useState('normal')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setTimeLeft('Expired')
        setUrgency('expired')
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

      // Set urgency level
      if (difference < 1000 * 60 * 60) { // Less than 1 hour
        setUrgency('critical')
      } else if (difference < 1000 * 60 * 60 * 24) { // Less than 1 day
        setUrgency('urgent')
      } else if (difference < 1000 * 60 * 60 * 24 * 3) { // Less than 3 days
        setUrgency('moderate')
      } else {
        setUrgency('normal')
      }

      // Format time display
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt || timeLeft === '') return null

  const getUrgencyStyles = () => {
    switch (urgency) {
      case 'expired':
        return 'text-red-700 bg-red-100'
      case 'critical':
        return 'text-red-600 bg-red-50 animate-pulse'
      case 'urgent':
        return 'text-orange-600 bg-orange-50'
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getIcon = () => {
    switch (urgency) {
      case 'expired':
        return 'EXPIRED'
      case 'critical':
        return 'CRITICAL'
      case 'urgent':
        return 'URGENT'
      case 'moderate':
        return 'MODERATE'
      default:
        return 'ACTIVE'
    }
  }

  return (
    <div className={clsx(
      'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
      getUrgencyStyles(),
      className
    )}>
      <span>{getIcon()}</span>
      <span>{timeLeft === 'Expired' ? 'Expired' : `${timeLeft} left`}</span>
    </div>
  )
}
