import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import * as horseService from '../../services/horseService'

const SPECTATOR_NOTIFICATIONS = [
  { id: 1, title: '🎁 Nhận thưởng: +12,500,000 VND dự đoán Derby Một Dặm', time: '5 phút trước' },
  { id: 2, title: '📣 Báo cáo kết quả: Cuộc đua Sprint Classic đã công bố kết quả', time: '1 giờ trước' },
  { id: 3, title: '⚖ Đã khóa cổng cược: Cuộc đua Đua nước rút đã đóng cược', time: '2 giờ trước' }
]

const breadcrumbLabels = {
  '/spectator': 'Giải Đấu & Lịch Đua',
  '/spectator/rankings': 'Bảng Xếp Hạng',
  '/spectator/predictions': 'Dự Đoán & Thưởng',
  '/spectator/profile': 'Tài Khoản Cá Nhân',
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function SpectatorHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)
  const searchRef = useRef(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

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

  const pageLabel = breadcrumbLabels[location.pathname] || 'Spectator Portal'

  return (
    <header className="admin-header">
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link to="/spectator">Spectator</Link>
        <span className="admin-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      <div className="admin-search" ref={searchRef} style={{ position: 'relative' }}>
        <span className="admin-search-icon">⌕</span>
        <input
          className="admin-search-input"
          placeholder="Tìm ngựa theo tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        {searchResults !== null && (
          <div className="admin-dropdown-menu admin-dropdown-menu--wide" style={{ top: '100%', left: 0, marginTop: '8px', right: 'auto', minWidth: '300px', display: 'block' }}>
            <div className="admin-dropdown-head">Kết quả tìm kiếm ({searchResults.length})</div>
            {isSearching ? (
              <div className="admin-dropdown-item text-muted">Đang tìm kiếm...</div>
            ) : searchResults.length === 0 ? (
              <div className="admin-dropdown-item text-muted">Không tìm thấy kết quả.</div>
            ) : (
              searchResults.map(horse => (
                <div key={horse.id} className="admin-notif-item" style={{ cursor: 'pointer' }} onClick={() => setSearchResults(null)}>
                  <strong>{horse.name}</strong>
                  <span style={{ fontSize: '11px' }}>Tuổi: {horse.age} | Giống: {horse.breed}</span>
                  <span style={{ fontSize: '11px', color: '#d4af37' }}>Chủ: {horse.ownerName}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="admin-header-actions">
        <div className="admin-dropdown" ref={notifRef}>
          <button
            type="button"
            className="admin-icon-btn"
            aria-label="Thông báo"
            onClick={() => {
              setNotifOpen((v) => !v)
              setUserOpen(false)
            }}
          >
            ◔
            <span className="admin-notif-badge" style={{ background: '#4ade80' }} />
          </button>
          {notifOpen && (
            <div className="admin-dropdown-menu admin-dropdown-menu--wide">
              <div className="admin-dropdown-head">Thông báo phần thưởng & Sự kiện</div>
              {SPECTATOR_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="admin-notif-item">
                  <strong>{n.title}</strong>
                  <span>{n.time}</span>
                </div>
              ))}
              <Link to="/spectator/predictions" className="admin-dropdown-item" onClick={() => setNotifOpen(false)}>
                Xem tất cả lịch sử dự đoán →
              </Link>
            </div>
          )}
        </div>

        <div className="admin-dropdown" ref={userRef}>
          <button
            type="button"
            className="admin-user-btn"
            onClick={() => {
              setUserOpen((v) => !v)
              setNotifOpen(false)
            }}
          >
            <span className="admin-user-avatar" style={{ background: 'linear-gradient(135deg, #e6c564, #d4af37)' }}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </span>
            <div className="admin-user-info">
              <strong>{user?.name || 'Spectator User'}</strong>
              <span>SPECTATOR</span>
            </div>
          </button>
          {userOpen && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-head">Tài khoản</div>
              <Link to="/spectator/profile" className="admin-dropdown-item" onClick={() => setUserOpen(false)}>
                Trang cá nhân
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
