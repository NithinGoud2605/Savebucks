import React, { useState } from 'react'
import { Container } from '../components/Layout/Container'
import { setPageMeta } from '../lib/head'
import { clsx } from 'clsx'

// Mock leaderboard data
const mockLeaderboardData = {
  weekly: [
    { rank: 1, user: 'DealsHunter23', karma: 1250, deals: 15, avatar: 'DH' },
    { rank: 2, user: 'BargainFinder', karma: 980, deals: 12, avatar: 'BF' },
    { rank: 3, user: 'SaveMaster', karma: 875, deals: 18, avatar: 'SM' },
    { rank: 4, user: 'CouponKing', karma: 720, deals: 9, avatar: 'CK' },
    { rank: 5, user: 'ThriftyOne', karma: 650, deals: 14, avatar: 'TO' },
  ],
  monthly: [
    { rank: 1, user: 'SaveMaster', karma: 3420, deals: 45, avatar: 'SM' },
    { rank: 2, user: 'DealsHunter23', karma: 2980, deals: 38, avatar: 'DH' },
    { rank: 3, user: 'BargainFinder', karma: 2750, deals: 32, avatar: 'BF' },
    { rank: 4, user: 'CouponKing', karma: 2100, deals: 25, avatar: 'CK' },
    { rank: 5, user: 'ThriftyOne', karma: 1890, deals: 41, avatar: 'TO' },
  ],
  allTime: [
    { rank: 1, user: 'SaveMaster', karma: 15420, deals: 180, avatar: 'SM' },
    { rank: 2, user: 'DealsHunter23', karma: 12980, deals: 145, avatar: 'DH' },
    { rank: 3, user: 'BargainFinder', karma: 11750, deals: 123, avatar: 'BF' },
    { rank: 4, user: 'CouponKing', karma: 9100, deals: 95, avatar: 'CK' },
    { rank: 5, user: 'ThriftyOne', karma: 8890, deals: 156, avatar: 'TO' },
  ],
}

export default function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')

  React.useEffect(() => {
    setPageMeta({
      title: 'Leaderboard',
      description: 'Top contributors in the SaveBucks community.',
    })
  }, [])

  const periods = [
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'allTime', label: 'All Time' },
  ]

  const currentData = mockLeaderboardData[selectedPeriod] || []

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-600">
            Top contributors in our deals community
          </p>
        </div>

        {/* Period Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-ring',
                  selectedPeriod === period.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {period.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Leaderboard */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {periods.find(p => p.key === selectedPeriod)?.label} Leaders
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {currentData.map((user, index) => (
              <div key={user.user} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className={clsx(
                      'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                      index === 0 && 'bg-yellow-100 text-yellow-800',
                      index === 1 && 'bg-gray-100 text-gray-800',
                      index === 2 && 'bg-orange-100 text-orange-800',
                      index > 2 && 'bg-blue-100 text-blue-800'
                    )}>
                      {user.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.avatar}
                    </div>

                    {/* User Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.user}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{user.deals} deals posted</span>
                      </div>
                    </div>
                  </div>

                  {/* Karma */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {user.karma.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      karma points
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Karma Info */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How Karma Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Earn Karma By:</h4>
              <ul className="space-y-1">
                <li>• Posting quality deals (+10 base)</li>
                <li>• Getting upvotes on deals (+5 each)</li>
                <li>• Helpful comments (+2 each upvote)</li>
                <li>• Community engagement (+1 each)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Lose Karma By:</h4>
              <ul className="space-y-1">
                <li>• Getting downvotes (-3 each)</li>
                <li>• Rejected deals (-5)</li>
                <li>• Spam or low-quality posts (-10)</li>
                <li>• Community violations (varies)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
