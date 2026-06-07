import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function useClickOutside(ref, handler) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function Navbar({ searchQuery, setSearchQuery, onAddClick }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef(null)

  useClickOutside(userRef, () => setUserOpen(false))

  let pageLabel = 'Horse Management'
  if (location.pathname === '/horses/new') {
    pageLabel = 'Add New Horse'
  } else if (location.pathname.startsWith('/horses/') && location.pathname !== '/horses') {
    pageLabel = 'Horse Details'
  }

  return (
    <header className="admin-header">
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link to="/horses" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px', color: '#d4af37' }}>♞</span>
          <strong style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#d4af37' }}>HORSIE</strong>
        </Link>
        <span className="admin-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      {location.pathname === '/horses' && (
        <div className="admin-search">
          <span className="admin-search-icon">⌕</span>
          <input
            className="admin-search-input"
            placeholder="Search horse by name, breed, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="admin-header-actions">


        <div className="admin-dropdown" ref={userRef}>
          <button
            type="button"
            className="admin-user-btn"
            onClick={() => setUserOpen((v) => !v)}
          >
            <span className="admin-user-avatar">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <div className="admin-user-info">
              <strong>{user?.name || 'Admin Demo'}</strong>
              <span>{user?.role || 'ADMIN'}</span>
            </div>
          </button>
          {userOpen && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-head">Tài khoản</div>
              <Link to="/" className="admin-dropdown-item">
                Về trang chủ
              </Link>
              <Link to="/admin" className="admin-dropdown-item">
                Admin Panel
              </Link>
              <button type="button" className="admin-dropdown-item" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
