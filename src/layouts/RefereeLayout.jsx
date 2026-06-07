import React from 'react'
import { Outlet } from 'react-router-dom'
import RefereeSidebar from '../components/referee/RefereeSidebar'
import RefereeHeader from '../components/referee/RefereeHeader'
import '../styles/admin-layout.css'
import '../styles/admin-common.css'

export default function RefereeLayout() {
  return (
    <div className="admin-shell">
      <RefereeSidebar />
      <div className="admin-main">
        <RefereeHeader />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
