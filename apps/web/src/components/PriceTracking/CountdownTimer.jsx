import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

const CountdownTimer = ({ dealId, expirationDate, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  // Get countdown data from API if not provided
  const { data: countdownData } = useQuery({
    queryKey: ['deal-countdown', dealId],
    queryFn: () => api.priceTracking.getDealCountdown(dealId),
    enabled: !!dealId && !expirationDate,
    refetchInterval: 60000, // Refresh every minute
  })

  const targetDate = expirationDate || countdownData?.expires_at

  useEffect(() => {
    if (!targetDate) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft(null)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      setIsExpired(false)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (!targetDate) return null

  if (isExpired) {
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-500 font-medium">
          {compact ? 'Expired' : 'Deal Expired'}
        </span>
      </div>
    )
  }

  if (!timeLeft) return null

  const getUrgencyColor = () => {
    const totalHours = timeLeft.days * 24 + timeLeft.hours
    if (totalHours <= 2) return 'text-red-500'
    if (totalHours <= 24) return 'text-orange-500'
    if (totalHours <= 72) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getUrgencyBg = () => {
    const totalHours = timeLeft.days * 24 + timeLeft.hours
    if (totalHours <= 2) return 'bg-red-50 border-red-200'
    if (totalHours <= 24) return 'bg-orange-50 border-orange-200'
    if (totalHours <= 72) return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border ${getUrgencyBg()}`}>
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
        <span className={`text-xs font-medium ${getUrgencyColor()}`}>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours > 0 && `${timeLeft.hours}h `}
          {timeLeft.days === 0 && `${timeLeft.minutes}m`}
        </span>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${getUrgencyBg()}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold ${getUrgencyColor()}`}>
          Deal Expires In
        </h3>
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          getUrgencyColor().replace('text-', 'bg-')
        }`}></div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        {timeLeft.days > 0 && (
          <div className="bg-white rounded-md p-2 border">
            <div className={`text-2xl font-bold ${getUrgencyColor()}`}>
              {timeLeft.days}
            </div>
            <div className="text-xs text-gray-500 uppercase">Days</div>
          </div>
        )}
        
        <div className="bg-white rounded-md p-2 border">
          <div className={`text-2xl font-bold ${getUrgencyColor()}`}>
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Hours</div>
        </div>
        
        <div className="bg-white rounded-md p-2 border">
          <div className={`text-2xl font-bold ${getUrgencyColor()}`}>
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Minutes</div>
        </div>
        
        <div className="bg-white rounded-md p-2 border">
          <div className={`text-2xl font-bold ${getUrgencyColor()}`}>
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Seconds</div>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600">
          Expires on {new Date(targetDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  )
}

export default CountdownTimer
