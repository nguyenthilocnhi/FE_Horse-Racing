import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
