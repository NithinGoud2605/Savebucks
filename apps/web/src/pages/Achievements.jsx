import React from 'react'
import { Container } from '../components/Layout/Container'
import { useAuth } from '../hooks/useAuth'
import Achievements from '../components/Gamification/Achievements'
import { Navigate } from 'react-router-dom'

export default function AchievementsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
          <p className="text-gray-600">
            Unlock achievements by contributing to the community and sharing great deals.
          </p>
        </div>
        <Achievements userId={user.id} />
      </div>
    </Container>
  )
}
