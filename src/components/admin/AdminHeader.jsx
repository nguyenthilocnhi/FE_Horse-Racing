import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { breadcrumbLabels } from '../../data/adminMockData'

const NOTIFICATIONS = [
  { id: 1, title: '5 đăng ký chờ duyệt', time: '10 phút trước' },
  { id: 2, title: 'Kết quả race R-1042 cần duyệt', time: '30 phút trước' },
  { id: 3, title: '2 khiếu nại mới', time: '1 giờ trước' },
]

function useClickOutside(ref, handler) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [query, setQuery] = useState('')
  const notifRef = useRef(null)
  const userRef = useRef(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))

  const pageLabel = breadcrumbLabels[location.pathname] || 'Admin'

  return (
    <header className="admin-header">
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin">Admin</Link>
        <span className="admin-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      <div className="admin-search">
        <span className="admin-search-icon">⌕</span>
        <input
          className="admin-search-input"
          placeholder="Tìm nhanh: user, giải đấu, race…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
            <span className="admin-notif-badge" />
          </button>
          {notifOpen && (
            <div className="admin-dropdown-menu admin-dropdown-menu--wide">
              <div className="admin-dropdown-head">Thông báo</div>
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className="admin-notif-item">
                  <strong>{n.title}</strong>
                  <span>{n.time}</span>
                </div>
              ))}
              <Link to="/admin/notifications" className="admin-dropdown-item">
                Xem tất cả thông báo →
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
            <span className="admin-user-avatar">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <div className="admin-user-info">
              <strong>{user?.name || 'Admin User'}</strong>
              <span>{user?.role || 'ADMIN'}</span>
            </div>
          </button>
          {userOpen && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-head">Tài khoản</div>
              <Link to="/" className="admin-dropdown-item">
                Về trang chủ
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
