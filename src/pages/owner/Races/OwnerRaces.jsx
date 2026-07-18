import React, { useState, useEffect } from 'react'
import { ownerRaces as initialRaces } from '../../../data/ownerMockData'

export default function OwnerRaces() {
  const [races, setRaces] = useState(() => {
    const stored = localStorage.getItem('owner_races')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return initialRaces
  })

  const [selectedRace, setSelectedRace] = useState(null)
  const [detailsModal, setDetailsModal] = useState(false)

  useEffect(() => {
    localStorage.setItem('owner_races', JSON.stringify(races))
  }, [races])

  const handleConfirmReady = (raceId) => {
    setRaces(races.map(r => {
      if (r.id === raceId) {
        return { ...r, status: 'registered' } // transitions status to confirmed registered
      }
      return r
    }))
    alert('Đã xác nhận chiến mã sẵn sàng thi đấu!')
  }

  const openDetails = (race) => {
    setSelectedRace(race)
    setDetailsModal(true)
  }

  return (
    <div className="own-races">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Lịch thi đấu & Xác nhận ngựa 🏁</h1>
          <p className="owner-page-sub">Theo dõi các giải đấu đang diễn ra và xác nhận ngựa của stable sẵn sàng thi đấu.</p>
        </div>
      </div>

      {/* Grid of races grouped by status */}
      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Các trận đấu đang chuẩn bị hành trình</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Giải đấu</th>
                <th>Thông tin đua</th>
                <th>Chiến mã</th>
                <th>Jockey đảm nhiệm</th>
                <th>Thưởng giải</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {races.filter(r => r.status !== 'completed').map((race) => (
                <tr key={race.id}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>
                    <div>{race.name}</div>
                    <span style={{ fontSize: 11, color: '#666' }}>{race.tournamentName}</span>
                  </td>
                  <td>
                    📅 {race.date} · {race.time}<br />
                    📍 {race.venue} · 📏 {race.distance}
                  </td>
                  <td style={{ color: '#d4af37', fontWeight: 500 }}>
                    {race.registeredHorse || 'Chưa đăng ký'}
                  </td>
                  <td>{race.assignedJockey || 'Chưa chỉ định'}</td>
                  <td style={{ color: '#4ade80' }}>{race.prizePool}</td>
                  <td>
                    <span className={`owner-badge owner-badge--${
                      race.status === 'pending_confirmation' ? 'red' : race.status === 'registered' ? 'green' : 'gray'
                    }`}>
                      {race.status === 'pending_confirmation' ? 'Cần xác nhận' : race.status === 'registered' ? 'Đã xếp lịch' : 'Mở đăng ký'}
                    </span>
                  </td>
                  <td>
                    <div className="owner-table-actions">
                      <button className="owner-btn owner-btn--ghost owner-btn--sm" onClick={() => openDetails(race)}>
                        Chi tiết
                      </button>
                      {race.status === 'pending_confirmation' && (
                        <button className="owner-btn owner-btn--gold owner-btn--sm" onClick={() => handleConfirmReady(race.id)}>
                          Xác nhận Sẵn sàng
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History of Completed Races */}
      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Kết quả giải đấu đã qua</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Giải đấu</th>
                <th>Ngày đua</th>
                <th>Chiến mã</th>
                <th>Jockey</th>
                <th>Kết quả chung cuộc</th>
                <th>Tiền thưởng nhận</th>
              </tr>
            </thead>
            <tbody>
              {races.filter(r => r.status === 'completed').map((race) => (
                <tr key={race.id}>
                  <td style={{ color: '#fff' }}>{race.name}</td>
                  <td>{race.date}</td>
                  <td>{race.registeredHorse}</td>
                  <td>{race.assignedJockey}</td>
                  <td>
                    <span className={`owner-badge owner-badge--${race.result.position === 1 ? 'gold' : 'gray'}`} style={{ marginRight: 6 }}>
                      Hạng {race.result.position}
                    </span>
                    <span>T/g: {race.result.time}</span>
                  </td>
                  <td style={{ color: '#4ade80', fontWeight: 600 }}>+{race.result.prizeWon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModal && selectedRace && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Chi tiết cuộc đua: {selectedRace.name}</h2>
              <button className="owner-modal-close" onClick={() => setDetailsModal(false)}>×</button>
            </div>
            <div className="owner-modal-body">
              <div className="owner-detail-row">
                <span className="owner-detail-label">Giải đấu gốc</span>
                <span className="owner-detail-value">{selectedRace.tournamentName}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Địa điểm tổ chức</span>
                <span className="owner-detail-value">{selectedRace.venue}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Cự ly chạy</span>
                <span className="owner-detail-value">{selectedRace.distance}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Thời gian bắt đầu</span>
                <span className="owner-detail-value">{selectedRace.date} lúc {selectedRace.time}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Cơ cấu giải thưởng</span>
                <span className="owner-detail-value" style={{ color: '#4ade80' }}>{selectedRace.prizePool}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Chiến mã tham chiến</span>
                <span className="owner-detail-value">{selectedRace.registeredHorse || 'Chưa chỉ định'}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Jockey được cử</span>
                <span className="owner-detail-value">{selectedRace.assignedJockey || 'Chưa cử'}</span>
              </div>
              {selectedRace.result && (
                <>
                  <div style={{ margin: '16px 0 8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
                    <strong style={{ color: '#fff' }}>Báo cáo Kết Quả:</strong>
                  </div>
                  <div className="owner-detail-row">
                    <span className="owner-detail-label">Xếp hạng</span>
                    <span className="owner-detail-value" style={{ color: '#d4af37' }}>Hạng {selectedRace.result.position}</span>
                  </div>
                  <div className="owner-detail-row">
                    <span className="owner-detail-label">Tổng thời gian đua</span>
                    <span className="owner-detail-value">{selectedRace.result.time}</span>
                  </div>
                  <div className="owner-detail-row">
                    <span className="owner-detail-label">Thưởng thực nhận</span>
                    <span className="owner-detail-value" style={{ color: '#4ade80' }}>{selectedRace.result.prizeWon}</span>
                  </div>
                </>
              )}
            </div>
            <div className="owner-modal-footer">
              <button type="button" className="owner-btn owner-btn--gold" onClick={() => setDetailsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
