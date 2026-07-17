import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import * as tournamentService from '../../../services/tournamentService'
import './Invitations.css'

const STATUS_LABELS = {
  pending: { label: 'Chờ phản hồi', cls: 'jockey-badge--orange' },
  accepted: { label: 'Đã chấp nhận', cls: 'jockey-badge--green' },
  declined: { label: 'Đã từ chối', cls: 'jockey-badge--red' },
}

function InvitationDetailModal({ inv, onClose, onAccept, onDecline }) {
  if (!inv) return null

  return (
    <div className="jockey-modal-overlay" onClick={onClose}>
      <div className="jockey-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jockey-modal-head">
          <h2>Chi tiết lời mời — {inv.raceId}</h2>
          <button type="button" className="jockey-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="jockey-modal-body">
          <div className="inv-modal-horse-banner">
            <span className="inv-horse-icon">🐴</span>
            <div>
              <div className="inv-horse-name">{inv.horseName}</div>
              <div className="inv-horse-sub">{inv.owner}</div>
            </div>
            <span className={`jockey-badge ${STATUS_LABELS[inv.status].cls}`}>
              {STATUS_LABELS[inv.status].label}
            </span>
          </div>

          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Cuộc đua</span>
            <span className="jockey-detail-value">{inv.raceName}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Giải đấu</span>
            <span className="jockey-detail-value">{inv.tournamentName}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Địa điểm</span>
            <span className="jockey-detail-value">📍 {inv.venue}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Thời gian</span>
            <span className="jockey-detail-value">📅 {inv.raceDate} · {inv.raceTime}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Cự ly</span>
            <span className="jockey-detail-value">{inv.distance}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Giải thưởng</span>
            <span className="jockey-detail-value" style={{ color: '#d4af37' }}>🏆 {inv.prizePool}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Thù lao jockey</span>
            <span className="jockey-detail-value" style={{ color: '#d4af37' }}>{inv.fee}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Hạn phản hồi</span>
            <span className="jockey-detail-value">⏰ {inv.deadline}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Liên hệ chủ ngựa</span>
            <span className="jockey-detail-value">{inv.ownerContact}</span>
          </div>
          {inv.notes && (
            <div className="inv-notes">
              <span className="jockey-label">Ghi chú từ chủ ngựa</span>
              <p>{inv.notes}</p>
            </div>
          )}
        </div>
        {inv.status === 'pending' && (
          <div className="jockey-modal-footer">
            <button
              type="button"
              className="jockey-btn jockey-btn--danger"
              onClick={() => { onDecline(inv.id); onClose() }}
            >
              ✕ Từ chối
            </button>
            <button
              type="button"
              className="jockey-btn jockey-btn--teal"
              onClick={() => { onAccept(inv.id); onClose() }}
            >
              ✓ Chấp nhận tham gia
            </button>
          </div>
        )}
        {inv.status !== 'pending' && (
          <div className="jockey-modal-footer">
            <button type="button" className="jockey-btn jockey-btn--ghost" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Invitations() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadInvitations() {
      try {
        setLoading(true)
        if (!user?.id) return
        
        const tournaments = await tournamentService.getTournaments()
        if (cancelled || !Array.isArray(tournaments)) {
          setLoading(false)
          return
        }
        
        const list = []
        const promises = tournaments.map(async (t) => {
          try {
            const schedule = await tournamentService.getTournamentSchedule(t.id)
            if (Array.isArray(schedule)) {
              schedule.forEach(race => {
                const participations = race.participations || race.raceParticipations || [];
                participations.forEach(p => {
                  const jockeyId = p.jockeyId || p.jockey?.id;
                  if (jockeyId === user?.id) {
                    const status = (p.status || '').toLowerCase();
                    const storedStatus = localStorage.getItem(`jockey_invitation_accept_${p.id}`);
                    
                    let mappedStatus = 'pending';
                    if (storedStatus) {
                      mappedStatus = storedStatus;
                    } else if (status === 'accepted' || status === 'confirmed' || status === 'approved') {
                      mappedStatus = 'accepted';
                    } else if (status === 'declined' || status === 'rejected') {
                      mappedStatus = 'declined';
                    }
                    
                    list.push({
                      id: p.id,
                      raceId: `R-${race.id}`,
                      raceName: race.raceName || race.name || 'Cuộc đua',
                      tournamentName: t.name || 'Giải đấu',
                      horseName: p.horseName || p.horse?.name || 'Ngựa thi đấu',
                      owner: p.ownerName || p.horse?.owner?.fullName || p.horse?.owner?.name || 'Chủ ngựa',
                      ownerContact: p.ownerPhone || p.horse?.owner?.phone || 'Chưa rõ',
                      raceDate: race.raceDate ? new Date(race.raceDate).toLocaleDateString() : 'Chưa rõ',
                      raceTime: race.startTime ? new Date(race.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Chưa rõ',
                      venue: t.location || t.venue || 'Trường đua',
                      distance: race.distance || '1000m',
                      prizePool: t.prizePool || t.prize || 'Chưa rõ',
                      fee: p.jockeyFee || p.fee || '1,000,000đ',
                      deadline: race.registrationDeadline ? new Date(race.registrationDeadline).toLocaleDateString() : 'Chưa rõ',
                      status: mappedStatus,
                      notes: p.notes || ''
                    });
                  }
                });
              });
            }
          } catch (_) {}
        })
        
        await Promise.all(promises)
        if (!cancelled) {
          setData(list)
        }
      } catch (err) {
        console.warn("Failed to load invitations:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadInvitations()
    return () => { cancelled = true }
  }, [user?.id])

  function handleAccept(id) {
    setData((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'accepted' } : inv))
    localStorage.setItem(`jockey_invitation_accept_${id}`, 'accepted')
  }

  function handleDecline(id) {
    setData((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'declined' } : inv))
    localStorage.setItem(`jockey_invitation_accept_${id}`, 'declined')
  }

  const tabs = [
    { key: 'all', label: `Tất cả (${data.length})` },
    { key: 'pending', label: `Chờ phản hồi (${data.filter((i) => i.status === 'pending').length})` },
    { key: 'accepted', label: 'Đã chấp nhận' },
    { key: 'declined', label: 'Đã từ chối' },
  ]

  const filtered = tab === 'all' ? data : data.filter((i) => i.status === tab)

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải lời mời thi đấu...
      </div>
    )
  }

  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Lời mời thi đấu</h1>
          <p className="jockey-page-sub">Lời mời điều khiển ngựa từ Horse Owner</p>
        </div>
      </div>

      <div className="jockey-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`jockey-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="jockey-card">
        {filtered.length === 0 ? (
          <div className="jockey-empty">
            <span className="jockey-empty-icon">✉</span>
            <span className="jockey-empty-text">Không có lời mời nào trong mục này.</span>
          </div>
        ) : (
          <div className="inv-grid">
            {filtered.map((inv) => (
              <div key={inv.id} className={`inv-card inv-card--${inv.status}`}>
                <div className="inv-card-header">
                  <span className="inv-race-id">{inv.raceId}</span>
                  <span className={`jockey-badge ${STATUS_LABELS[inv.status].cls}`}>
                    {STATUS_LABELS[inv.status].label}
                  </span>
                </div>

                <div className="inv-race-name">{inv.raceName}</div>
                <div className="inv-tournament">{inv.tournamentName}</div>

                <div className="inv-horse-row">
                  <span className="inv-horse-chip">🐴 {inv.horseName}</span>
                  <span style={{ color: '#666', fontSize: 12 }}>{inv.owner}</span>
                </div>

                <div className="inv-meta-grid">
                  <div className="inv-meta-item">
                    <span>📅 Ngày đua</span>
                    <strong>{inv.raceDate}</strong>
                  </div>
                  <div className="inv-meta-item">
                    <span>📍 Địa điểm</span>
                    <strong>{inv.venue}</strong>
                  </div>
                  <div className="inv-meta-item">
                    <span>📏 Cự ly</span>
                    <strong>{inv.distance}</strong>
                  </div>
                  <div className="inv-meta-item">
                    <span>💰 Thù lao</span>
                    <strong style={{ color: '#d4af37' }}>{inv.fee}</strong>
                  </div>
                </div>

                {inv.status === 'pending' && (
                  <div className="inv-deadline">
                    ⏰ Hạn phản hồi: <strong>{inv.deadline}</strong>
                  </div>
                )}

                <div className="inv-actions">
                  <button
                    type="button"
                    className="jockey-btn jockey-btn--ghost jockey-btn--sm"
                    onClick={() => setSelected(inv)}
                  >
                    Chi tiết
                  </button>
                  {inv.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="jockey-btn jockey-btn--danger jockey-btn--sm"
                        onClick={() => handleDecline(inv.id)}
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        className="jockey-btn jockey-btn--success jockey-btn--sm"
                        onClick={() => handleAccept(inv.id)}
                      >
                        Chấp nhận
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <InvitationDetailModal
          inv={selected}
          onClose={() => setSelected(null)}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </div>
  )
}

