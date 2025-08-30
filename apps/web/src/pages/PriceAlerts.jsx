import React from 'react'
import { Container } from '../components/Layout/Container'
import { useAuth } from '../hooks/useAuth'
import { UserPriceAlerts } from '../components/PriceTracking/PriceAlert'
import { Navigate } from 'react-router-dom'

export default function PriceAlerts() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Price Alerts</h1>
          <p className="text-gray-600">
            Manage your price alerts and get notified when deals hit your target prices.
          </p>
        </div>
        <UserPriceAlerts />
      </div>
    </Container>
  )
}
