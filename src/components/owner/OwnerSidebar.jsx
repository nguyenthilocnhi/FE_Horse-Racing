import React from 'react'
import { NavLink } from 'react-router-dom'
import { ownerNavItems } from '../../data/ownerMockData'

export default function OwnerSidebar({ pendingConfirmations = 0 }) {
  return (
    <aside className="owner-sidebar">
      <NavLink to="/owner" className="owner-sidebar-brand">
        <span>👑</span>
        <div>
          <strong>Horse Racing</strong>
          <small>OWNER PORTAL</small>
        </div>
      </NavLink>

      <nav className="owner-sidebar-nav">
        {ownerNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/owner'}
            className={({ isActive }) =>
              `owner-nav-link${isActive ? ' is-active' : ''}`
            }
          >
            <span className="owner-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/owner/races' && pendingConfirmations > 0 && (
              <span className="owner-nav-badge">{pendingConfirmations}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="owner-sidebar-footer">© 2026 Horse Racing Owner</div>
    </aside>
  )
}
