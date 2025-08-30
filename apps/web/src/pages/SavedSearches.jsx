import React from 'react'
import { Container } from '../components/Layout/Container'
import { useAuth } from '../hooks/useAuth'
import SavedSearchManager from '../components/SavedSearches/SavedSearchManager'
import { Navigate } from 'react-router-dom'

export default function SavedSearches() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
      <div className="max-w-4xl mx-auto py-8">
        <SavedSearchManager />
      </div>
    </Container>
  )
}
