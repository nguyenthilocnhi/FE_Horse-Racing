import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ownerBreadcrumbLabels, ownerRaces } from '../../data/ownerMockData'

function useClickOutside(ref, handler) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function OwnerHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [query, setQuery] = useState('')
  const notifRef = useRef(null)
  const userRef = useRef(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))

  const pageLabel = ownerBreadcrumbLabels[location.pathname] || 'Chủ ngựa'
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const loadNotifs = () => {
      const stored = localStorage.getItem('owner_notifications')
      const systemNotifs = stored ? JSON.parse(stored) : []

      const storedRaces = localStorage.getItem('owner_races')
      const currentRaces = storedRaces ? JSON.parse(storedRaces) : ownerRaces
      const pendingRaces = currentRaces.filter(r => r.status === 'pending_confirmation')
      
      const raceNotifs = pendingRaces.map(r => ({
        id: `RACE-CONF-${r.id}`,
        title: 'Xác nhận thi đấu 🏁',
        message: `Ngựa "${r.registeredHorse}" cần xác nhận tham gia "${r.name}".`,
        type: 'warning',
        timestamp: r.date
      }))

      setNotifications([...systemNotifs, ...raceNotifs])
    }

    loadNotifs()
    window.addEventListener('storage', loadNotifs)
    window.addEventListener('owner_notifs_update', loadNotifs)

    return () => {
      window.removeEventListener('storage', loadNotifs)
      window.removeEventListener('owner_notifs_update', loadNotifs)
    }
  }, [])

  const handleClearNotifs = (e) => {
    e.stopPropagation()
    localStorage.setItem('owner_notifications', '[]')
    setNotifications([])
    window.dispatchEvent(new Event('owner_notifs_update'))
  }

  const hasUnread = notifications.length > 0

  return (
    <header className="owner-header">
      <nav className="owner-breadcrumb" aria-label="Breadcrumb">
        <Link to="/owner">Chủ ngựa</Link>
        <span className="owner-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      <div className="owner-search">
        <span className="owner-search-icon">⌕</span>
        <input
          className="owner-search-input"
          placeholder="Tìm kiếm ngựa, jockey, giải đấu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="owner-header-actions">
        {/* notifications */}
        <div className="owner-dropdown" ref={notifRef}>
          <button
            type="button"
            className="owner-icon-btn"
            aria-label="Thông báo"
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false) }}
          >
            🔔
            {hasUnread && <span className="owner-notif-badge" />}
          </button>
          {notifOpen && (
            <div className="owner-dropdown-menu owner-dropdown-menu--wide">
              <div className="owner-dropdown-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Thông báo mới ({notifications.length})</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearNotifs} 
                    style={{ background: 'none', border: 'none', color: '#d4af37', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="owner-notif-item">
                    <span className="owner-notif-dot" style={{ 
                      backgroundColor: n.type === 'danger' || n.type === 'error' ? '#f87171' : n.type === 'success' ? '#4ade80' : '#fbbf24' 
                    }} />
                    <div>
                      <strong>{n.title}</strong>
                      <span style={{ color: '#ccc' }}>{n.message}</span>
                      {n.timestamp && <span style={{ display: 'block', color: '#666', fontSize: '10px', marginTop: '2px' }}>{n.timestamp}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px 20px', color: '#666', fontSize: 13, textAlign: 'center' }}>
                  Không có thông báo mới
                </div>
              )}
              <Link to="/owner/races" className="owner-dropdown-item" onClick={() => setNotifOpen(false)}>
                Xem tất cả lịch thi đấu →
              </Link>
            </div>
          )}
        </div>

        {/* user menu */}
        <div className="owner-dropdown" ref={userRef}>
          <button
            type="button"
            className="owner-user-btn"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false) }}
          >
            <span className="owner-user-avatar">
              {(user?.name || 'V').charAt(0).toUpperCase()}
            </span>
            <div className="owner-user-info">
              <strong>{user?.name || 'Trần Thế Vinh'}</strong>
              <span>{user?.role || 'OWNER'}</span>
            </div>
          </button>
          {userOpen && (
            <div className="owner-dropdown-menu">
              <div className="owner-dropdown-head">Tài khoản</div>
              <Link to="/owner/profile" className="owner-dropdown-item" onClick={() => setUserOpen(false)}>Hồ sơ Trang trại</Link>
              <Link to="/" className="owner-dropdown-item" onClick={() => setUserOpen(false)}>Về trang chủ</Link>
              <button type="button" className="owner-dropdown-item" onClick={() => { setUserOpen(false); logout(); }}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
