import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { jockeyBreadcrumbLabels } from '../../data/jockeyMockData'
import * as tournamentService from '../../services/tournamentService'

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
  const [notifications, setNotifications] = useState([])
  const notifRef = useRef(null)
  const userRef = useRef(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))

  useEffect(() => {
    let cancelled = false
    async function loadNotifications() {
      if (!user?.id) return
      try {
        const tournaments = await tournamentService.getTournaments()
        if (cancelled || !Array.isArray(tournaments)) return
        
        const list = []
        const promises = tournaments.map(async (t) => {
          try {
            const schedule = await tournamentService.getTournamentSchedule(t.id)
            if (Array.isArray(schedule)) {
              schedule.forEach(race => {
                const participations = race.participations || race.raceParticipations || [];
                participations.forEach(p => {
                  const jockeyId = p.jockeyId || p.jockey?.id;
                  const status = (p.status || '').toUpperCase();
                  if (jockeyId === user.id && (status === 'PENDING' || status === 'PENDING_CONFIRMATION')) {
                    list.push({
                      id: p.id,
                      title: `Lời mời đua ngựa ${p.horseName || p.horse?.name || 'mới'} từ ${p.ownerName || 'Chủ ngựa'}`,
                      time: race.raceDate ? new Date(race.raceDate).toLocaleDateString() : 'Sắp tới'
                    });
                  }
                });
              });
            }
          } catch (_) {}
        })
        
        await Promise.all(promises)
        if (!cancelled) {
          setNotifications(list.slice(0, 5))
        }
      } catch (err) {
        console.warn("Failed to load header notifications:", err)
      }
    }
    loadNotifications()
    return () => { cancelled = true }
  }, [user?.id])

  const pageLabel = jockeyBreadcrumbLabels[location.pathname] || 'Jockey'

  return (
    <header className="jockey-header">
      <nav className="jockey-breadcrumb" aria-label="Breadcrumb">
        <Link to="/jockey">Jockey</Link>
        <span className="jockey-breadcrumb-sep">›</span>
        <span>{pageLabel}</span>
      </nav>

      <div className="jockey-search">
        <span className="jockey-search-icon">⌕</span>
        <input
          className="jockey-search-input"
          placeholder="Tìm cuộc đua, lời mời, ngựa…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
            {notifications.length > 0 && <span className="jockey-notif-badge" />}
          </button>
          {notifOpen && (
            <div className="jockey-dropdown-menu jockey-dropdown-menu--wide">
              <div className="jockey-dropdown-head">Thông báo ({notifications.length})</div>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="jockey-notif-item">
                    <span className="jockey-notif-dot" />
                    <div>
                      <strong>{n.title}</strong>
                      <span>{n.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '15px', color: '#666', textAlign: 'center', fontSize: 13 }}>
                  Không có thông báo mới
                </div>
              )}
              <Link to="/jockey/invitations" className="jockey-dropdown-item" onClick={() => setNotifOpen(false)}>
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
              <Link to="/jockey/profile" className="jockey-dropdown-item" onClick={() => setUserOpen(false)}>Hồ sơ cá nhân</Link>
              <Link to="/" className="jockey-dropdown-item" onClick={() => setUserOpen(false)}>Về trang chủ</Link>
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

