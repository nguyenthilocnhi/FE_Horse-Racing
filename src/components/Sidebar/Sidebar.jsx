import React from 'react'
import { NavLink } from 'react-router-dom'

const clientNavItems = [
  { path: '/horses', label: 'Horse', icon: '♞' },
  { path: '/admin/races', label: 'Race', icon: '▶' },
  { path: '/admin/rankings', label: 'Standings', icon: '▲' },
  { path: '/admin/users', label: 'User Management', icon: '◎' },
  { path: '#', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink to="/horses" className="admin-sidebar-brand">
        <span>♞</span>
        <div>
          <strong>Horse Racing</strong>
          <small>HORSE PANEL</small>
        </div>
      </NavLink>

      <nav className="admin-sidebar-nav">
        {clientNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
        © 2026 Horse Racing App
      </div>
    </aside>
  )
}
