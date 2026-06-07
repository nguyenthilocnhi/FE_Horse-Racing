import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const REFEREE_NOTIFICATIONS = [
  { id: 1, title: '📣 Phân công mới: Bạn được gán giám sát cuộc đua "Derby Một Dặm"', time: '10 phút trước' },
  { id: 2, title: '⚖️ Cảnh báo: Trùng lịch biểu cuộc đua "Cúp Nhà Vô Địch"', time: '2 giờ trước' }
]

const breadcrumbLabels = {
  '/referee': 'Kiểm Tra Trước Đua',
  '/referee/tracking': 'Giám Sát & Kết Quả',
  '/referee/violations': 'Ghi Nhận Vi Phạm',
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

export default function RefereeHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))

  const pageLabel = breadcrumbLabels[location.pathname] || 'Referee Portal'

  return (
    <header className="admin-header">
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link to="/referee">Referee</Link>
        <span className="admin-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      <div style={{ flex: 1 }} />

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
            <span className="admin-notif-badge" style={{ background: '#f59e0b' }} />
          </button>
          {notifOpen && (
            <div className="admin-dropdown-menu admin-dropdown-menu--wide">
              <div className="admin-dropdown-head">Thông báo Trọng tài</div>
              {REFEREE_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="admin-notif-item">
                  <strong>{n.title}</strong>
                  <span>{n.time}</span>
                </div>
              ))}
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
            <span className="admin-user-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              {(user?.name || 'R').charAt(0).toUpperCase()}
            </span>
            <div className="admin-user-info">
              <strong>{user?.name || 'Referee User'}</strong>
              <span>REFEREE</span>
            </div>
          </button>
          {userOpen && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-head">Tài khoản</div>
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
