import React, { useState } from 'react'
import { myRaces } from '../../../data/jockeyMockData'
import './MyRaces.css'

const STATUS_MAP = {
  upcoming: { label: 'Sắp diễn ra', cls: 'jockey-badge--blue' },
  ongoing: { label: 'Đang diễn ra', cls: 'jockey-badge--teal' },
  completed: { label: 'Đã hoàn thành', cls: 'jockey-badge--green' },
  cancelled: { label: 'Đã huỷ', cls: 'jockey-badge--red' },
}

const POS_LABEL = ['', '🥇 Nhất', '🥈 Nhì', '🥉 Ba']

function RaceDetailModal({ race, onClose }) {
  if (!race) return null
  const s = STATUS_MAP[race.status] || STATUS_MAP.upcoming

  return (
    <div className="jockey-modal-overlay" onClick={onClose}>
      <div className="jockey-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jockey-modal-head">
          <h2>{race.name} — {race.id}</h2>
          <button type="button" className="jockey-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="jockey-modal-body">
          <div className="race-detail-status-row">
            <span className={`jockey-badge ${s.cls}`}>{s.label}</span>
            {race.result && (
              <span className="race-detail-pos">
                {POS_LABEL[race.result.position] || `Hạng ${race.result.position}`}
              </span>
            )}
          </div>

          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Giải đấu</span>
            <span className="jockey-detail-value">{race.tournament}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Địa điểm</span>
            <span className="jockey-detail-value">📍 {race.venue}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Thời gian</span>
            <span className="jockey-detail-value">📅 {race.date} · {race.time}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Cự ly</span>
            <span className="jockey-detail-value">{race.distance}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Ngựa thi đấu</span>
            <span className="jockey-detail-value">🐴 {race.horse}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Chủ ngựa</span>
            <span className="jockey-detail-value">{race.owner}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Cổng xuất phát</span>
            <span className="jockey-detail-value">#{race.startGate}</span>
          </div>
          <div className="jockey-detail-row">
            <span className="jockey-detail-label">Cân nặng ghi nhận</span>
            <span className="jockey-detail-value">{race.weight} kg</span>
          </div>
          {race.result && (
            <>
              <div className="jockey-detail-row">
                <span className="jockey-detail-label">Thời gian hoàn thành</span>
                <span className="jockey-detail-value" style={{ color: '#00d4aa' }}>{race.result.time}</span>
              </div>
              <div className="jockey-detail-row">
                <span className="jockey-detail-label">Điểm nhận được</span>
                <span className="jockey-detail-value" style={{ color: '#d4af37' }}>+{race.result.points} pts</span>
              </div>
            </>
          )}
        </div>
        <div className="jockey-modal-footer">
          <button type="button" className="jockey-btn jockey-btn--ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

export default function MyRaces() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = myRaces.filter((r) => {
    const matchTab = tab === 'all' || r.status === tab
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.horse.toLowerCase().includes(search.toLowerCase()) ||
      r.venue.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: '📅 Sắp tới' },
    { key: 'completed', label: '✓ Đã xong' },
  ]

  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Cuộc đua của tôi</h1>
          <p className="jockey-page-sub">Danh sách và lịch thi đấu được phân công</p>
        </div>
      </div>

      {/* Schedule timeline for upcoming */}
      {myRaces.filter((r) => r.status === 'upcoming').length > 0 && (
        <div className="jockey-card" style={{ marginBottom: 24 }}>
          <div className="jockey-card-head">
            <h3>📅 Lịch thi đấu sắp tới</h3>
          </div>
          <div className="jockey-card-body">
            <div className="schedule-timeline">
              {myRaces.filter((r) => r.status === 'upcoming').map((r) => (
                <div key={r.id} className="schedule-item">
                  <div className="schedule-date-col">
                    <div className="schedule-day">{new Date(r.date).getDate()}</div>
                    <div className="schedule-month">
                      Th{new Date(r.date).getMonth() + 1}
                    </div>
                  </div>
                  <div className="schedule-dot" />
                  <div className="schedule-info">
                    <strong>{r.name}</strong>
                    <span>{r.tournament}</span>
                    <div className="schedule-meta">
                      <span>⏰ {r.time}</span>
                      <span>📍 {r.venue}</span>
                      <span>🐴 {r.horse}</span>
                      <span>📏 {r.distance}</span>
                      <span>🚦 Cổng #{r.startGate}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="jockey-btn jockey-btn--outline jockey-btn--sm"
                    onClick={() => setSelected(r)}
                  >
                    Chi tiết
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All races table */}
      <div className="jockey-card">
        <div className="jockey-card-head">
          <h3>Tất cả cuộc đua</h3>
        </div>
        <div className="jockey-card-body">
          <div className="jockey-filter-bar">
            <input
              className="jockey-input"
              placeholder="Tìm cuộc đua, ngựa, địa điểm…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="jockey-tabs" style={{ marginBottom: 0 }}>
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
          </div>

          <div className="jockey-table-wrap">
            <table className="jockey-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cuộc đua</th>
                  <th>Giải đấu</th>
                  <th>Ngày · Giờ</th>
                  <th>Cự ly</th>
                  <th>Ngựa</th>
                  <th>Cổng</th>
                  <th>Kết quả</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const s = STATUS_MAP[r.status] || STATUS_MAP.upcoming
                  return (
                    <tr key={r.id}>
                      <td style={{ color: '#555', fontSize: 11 }}>{r.id}</td>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: '#888' }}>{r.tournament}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{r.date}</div>
                        <div style={{ fontSize: 11, color: '#555' }}>{r.time}</div>
                      </td>
                      <td>{r.distance}</td>
                      <td>
                        <span style={{ color: '#00d4aa' }}>🐴 {r.horse}</span>
                        <div style={{ fontSize: 11, color: '#555' }}>{r.owner}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="race-gate-badge">#{r.startGate}</span>
                      </td>
                      <td>
                        {r.result ? (
                          <div>
                            <div style={{ fontWeight: 700, color: r.result.position <= 3 ? '#d4af37' : '#ccc' }}>
                              {POS_LABEL[r.result.position] || `#${r.result.position}`}
                            </div>
                            <div style={{ fontSize: 11, color: '#00d4aa' }}>+{r.result.points} pts</div>
                          </div>
                        ) : (
                          <span style={{ color: '#444' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`jockey-badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="jockey-btn jockey-btn--ghost jockey-btn--sm"
                          onClick={() => setSelected(r)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="jockey-empty">
              <span className="jockey-empty-icon">🏁</span>
              <span className="jockey-empty-text">Không tìm thấy cuộc đua nào.</span>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <RaceDetailModal race={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
