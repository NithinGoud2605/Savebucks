import React from 'react'
import Leaderboard from '../Community/Leaderboard'
import AdSlot from '../AdSlot'

export function RightSidebar({ className = '' }) {
  return (
    <aside className={className}>
      <div className="space-y-4">
        <div className="card p-0 overflow-hidden">
          <Leaderboard compact={true} showViewMore={true} />
        </div>
        <AdSlot id="sidebar-top" sizes={[300, 250]} className="card p-0" />
        <AdSlot id="sidebar-mid" sizes={[300, 600]} className="card p-0" />
      </div>
    </aside>
  )
}

