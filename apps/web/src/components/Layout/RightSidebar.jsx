import React from 'react'
import Leaderboard from '../Community/Leaderboard'
import { AdSlot } from '../AdSlot'

export function RightSidebar({ className = '' }) {
  return (
    <aside className={className}>
      <div className="space-y-4">
        <div className="card p-0 overflow-hidden">
          <Leaderboard compact={true} showViewMore={true} />
        </div>
        <AdSlot size="rectangle" className="card p-0" />
        <AdSlot size="rectangle" className="card p-0" />
      </div>
    </aside>
  )
}

