import React from 'react'
import { Container } from '../components/Layout/Container'
import EnhancedLeaderboard from '../components/Gamification/EnhancedLeaderboard'

export default function EnhancedLeaderboardPage() {
  return (
    <Container>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Leaderboard</h1>
          <p className="text-gray-600">
            See who's contributing the most to our deals community and earn your place among the top contributors.
          </p>
        </div>
        <EnhancedLeaderboard />
      </div>
    </Container>
  )
}
