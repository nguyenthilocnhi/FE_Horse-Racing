import React from 'react'
import { NavLink } from 'react-router-dom'

const refereeNavItems = [
  { path: '/referee', label: 'Kiểm Tra Trước Đua', icon: '📋' },
  { path: '/referee/tracking', label: 'Giám Sát & Kết Quả', icon: '⏱' },
  { path: '/referee/violations', label: 'Ghi Nhận Vi Phạm', icon: '⚠️' },
  { path: '/referee/profile', label: 'Hồ sơ', icon: '◎' },
]

export default function RefereeSidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink to="/referee" className="admin-sidebar-brand">
        <span>⚖</span>
        <div>
          <strong>HORSIE</strong>
          <small>REFEREE PANEL</small>
        </div>
      </NavLink>

      <nav className="admin-sidebar-nav">
        {refereeNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/referee'}
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
