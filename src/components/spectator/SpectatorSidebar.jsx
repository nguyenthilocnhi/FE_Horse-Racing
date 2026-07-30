import React from 'react'
import { NavLink } from 'react-router-dom'

const spectatorNavItems = [
  { path: '/spectator', label: 'Giải Đấu & Lịch Đua', icon: '◈' },
  { path: '/spectator/predictions', label: 'Mua Vé & Dự Đoán', icon: '🎟️' },
  { path: '/spectator/rankings', label: 'Bảng Xếp Hạng', icon: '▲' },
  { path: '/spectator/profile', label: 'Tài Khoản Cá Nhân', icon: '👤' },
]

export default function SpectatorSidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink to="/spectator" className="admin-sidebar-brand">
        <span>♞</span>
        <div>
          <strong>Horse Racing</strong>
          <small>SPECTATOR PANEL</small>
        </div>
      </NavLink>

      <nav className="admin-sidebar-nav">
        {spectatorNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/spectator'}
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' is-active' : ''}`
            }
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
