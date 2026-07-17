import React, { useState } from 'react'
import { invitations } from '../../../data/jockeyMockData'
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
              <div className="inv-horse-sub">{inv.owner} · {inv.horseAge} tuổi</div>
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
  const [data, setData] = useState(invitations)
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null)

  function handleAccept(id) {
    setData((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'accepted' } : inv))
  }

  function handleDecline(id) {
    setData((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'declined' } : inv))
  }

  const tabs = [
    { key: 'all', label: `Tất cả (${data.length})` },
    { key: 'pending', label: `Chờ phản hồi (${data.filter((i) => i.status === 'pending').length})` },
    { key: 'accepted', label: 'Đã chấp nhận' },
    { key: 'declined', label: 'Đã từ chối' },
  ]

  const filtered = tab === 'all' ? data : data.filter((i) => i.status === tab)

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
