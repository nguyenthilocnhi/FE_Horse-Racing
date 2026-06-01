import React from 'react'
import { NavLink } from 'react-router-dom'
import { adminNavItems } from '../../data/adminMockData'

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink to="/admin" className="admin-sidebar-brand">
        <span>♞</span>
        <div>
          <strong>HORSIE</strong>
          <small>ADMIN PANEL</small>
        </div>
      </NavLink>

      <nav className="admin-sidebar-nav">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' is-active' : ''}`
            }
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        © 2026 HORSIE Admin
      </div>
    </aside>
  )
}
