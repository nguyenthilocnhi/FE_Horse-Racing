import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { jockeyBreadcrumbLabels, jockeyNotifications } from '../../data/jockeyMockData'
import * as horseService from '../../services/horseService'

function useClickOutside(ref, handler) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function JockeyHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)
  const searchRef = useRef(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))
  useClickOutside(searchRef, () => setSearchResults(null))

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      if (!query.trim()) {
        setSearchResults(null)
        return
      }
      setIsSearching(true)
      try {
        const response = await horseService.searchHorses(query.trim())
        setSearchResults(response.data || [])
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
        setNotifOpen(false)
        setUserOpen(false)
      }
    }
  }

  const pageLabel = jockeyBreadcrumbLabels[location.pathname] || 'Jockey'

  return (
    <header className="jockey-header">
      <nav className="jockey-breadcrumb" aria-label="Breadcrumb">
        <Link to="/jockey">Jockey</Link>
        <span className="jockey-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      <div className="jockey-search" ref={searchRef} style={{ position: 'relative' }}>
        <span className="jockey-search-icon">⌕</span>
        <input
          className="jockey-search-input"
          placeholder="Tìm kiếm ngựa theo tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        {searchResults !== null && (
          <div className="jockey-dropdown-menu jockey-dropdown-menu--wide" style={{ top: '100%', left: 0, marginTop: '8px', right: 'auto', minWidth: '300px', display: 'block' }}>
            <div className="jockey-dropdown-head">Kết quả tìm kiếm ({searchResults.length})</div>
            {isSearching ? (
              <div className="jockey-dropdown-item" style={{ color: '#aaa' }}>Đang tìm kiếm...</div>
            ) : searchResults.length === 0 ? (
              <div className="jockey-dropdown-item" style={{ color: '#aaa' }}>Không tìm thấy kết quả.</div>
            ) : (
              searchResults.map(horse => (
                <div key={horse.id} className="jockey-notif-item" style={{ cursor: 'pointer' }} onClick={() => setSearchResults(null)}>
                  <strong>{horse.name}</strong>
                  <div style={{ fontSize: '11px', color: '#ccc' }}>Tuổi: {horse.age} | Giống: {horse.breed}</div>
                  <div style={{ fontSize: '11px', color: '#d4af37' }}>Chủ: {horse.ownerName}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="jockey-header-actions">
        {/* notifications */}
        <div className="jockey-dropdown" ref={notifRef}>
          <button
            type="button"
            className="jockey-icon-btn"
            aria-label="Thông báo"
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false) }}
          >
            🔔
            <span className="jockey-notif-badge" />
          </button>
          {notifOpen && (
            <div className="jockey-dropdown-menu jockey-dropdown-menu--wide">
              <div className="jockey-dropdown-head">Thông báo</div>
              {jockeyNotifications.map((n) => (
                <div key={n.id} className="jockey-notif-item">
                  <span className="jockey-notif-dot" />
                  <div>
                    <strong>{n.title}</strong>
                    <span>{n.time}</span>
                  </div>
                </div>
              ))}
              <Link to="/jockey/invitations" className="jockey-dropdown-item">
                Xem tất cả thông báo →
              </Link>
            </div>
          )}
        </div>

        {/* user menu */}
        <div className="jockey-dropdown" ref={userRef}>
          <button
            type="button"
            className="jockey-user-btn"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false) }}
          >
            <span className="jockey-user-avatar">
              {(user?.name || 'J').charAt(0).toUpperCase()}
            </span>
            <div className="jockey-user-info">
              <strong>{user?.name || 'Jockey'}</strong>
              <span>{user?.role || 'JOCKEY'}</span>
            </div>
          </button>
          {userOpen && (
            <div className="jockey-dropdown-menu">
              <div className="jockey-dropdown-head">Tài khoản</div>
              <Link to="/jockey/profile" className="jockey-dropdown-item">Hồ sơ cá nhân</Link>
              <Link to="/" className="jockey-dropdown-item">Về trang chủ</Link>
              <button type="button" className="jockey-dropdown-item" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
