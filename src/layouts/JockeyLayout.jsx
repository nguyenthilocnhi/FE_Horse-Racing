import React from 'react'
import { Outlet } from 'react-router-dom'
import JockeySidebar from '../components/jockey/JockeySidebar'
import JockeyHeader from '../components/jockey/JockeyHeader'
import { invitations } from '../data/jockeyMockData'
import '../styles/jockey-layout.css'
import '../styles/jockey-common.css'

export default function JockeyLayout() {
  const pendingCount = invitations.filter((inv) => inv.status === 'pending').length

  return (
    <div className="jockey-shell">
      <JockeySidebar inviteCount={pendingCount} />
      <div className="jockey-main">
        <JockeyHeader />
        <div className="jockey-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
