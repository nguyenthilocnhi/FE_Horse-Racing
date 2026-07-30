import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { jockeyNavItems } from '../../data/jockeyMockData'

export default function JockeySidebar({ inviteCount = 0 }) {
  return (
    <aside className="jockey-sidebar">
      <NavLink to="/jockey" className="jockey-sidebar-brand">
        <span>🏇</span>
        <div>
          <strong>Horse Racing</strong>
          <small>JOCKEY PORTAL</small>
        </div>
      </NavLink>

      <nav className="jockey-sidebar-nav">
        {jockeyNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/jockey'}
            className={({ isActive }) =>
              `jockey-nav-link${isActive ? ' is-active' : ''}`
            }
          >
            <span className="jockey-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/jockey/invitations' && inviteCount > 0 && (
              <span className="jockey-nav-badge">{inviteCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="jockey-sidebar-footer">© 2026 Horse Racing Jockey</div>
    </aside>
  )
}
