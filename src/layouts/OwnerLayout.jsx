import React from 'react'
import { Outlet } from 'react-router-dom'
import OwnerSidebar from '../components/owner/OwnerSidebar'
import OwnerHeader from '../components/owner/OwnerHeader'
import { ownerRaces } from '../data/ownerMockData'
import '../styles/owner-layout.css'
import '../styles/owner-common.css'

export default function OwnerLayout() {
  const pendingCount = ownerRaces.filter((r) => r.status === 'pending_confirmation').length

  return (
    <div className="owner-shell">
      <OwnerSidebar pendingConfirmations={pendingCount} />
      <div className="owner-main">
        <OwnerHeader />
        <div className="owner-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
