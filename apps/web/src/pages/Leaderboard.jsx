import React from 'react'
import { Container } from '../components/Layout/Container'
import Leaderboard from '../components/Community/Leaderboard'

const LeaderboardPage = () => {
  return (
    <Container>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Leaderboard</h1>
          <p className="text-secondary-600">
            See who's contributing the most to our community
          </p>
        </div>
        
        <Leaderboard compact={false} showViewMore={false} />
      </div>
    </Container>
  )
}

export default LeaderboardPage
