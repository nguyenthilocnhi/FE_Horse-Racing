import React, { useState } from 'react'
import { races } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RaceManagement.css'

export default function RaceManagement() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="race-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Cuộc đua</h1>
          <p className="admin-page-sub">Lập lịch race và theo dõi số ngựa tham gia</p>
        </div>
        <button type="button" className="admin-btn admin-btn--gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng' : '+ Tạo race'}
        </button>
      </div>

      {showForm && (
        <div className="admin-card race-form-card">
          <div className="admin-card-head"><h3>Tạo cuộc đua mới</h3></div>
          <div className="admin-card-body race-form">
            <input className="admin-input" placeholder="Tên race" />
            <select className="admin-select"><option>Chọn giải đấu</option></select>
            <input className="admin-input" type="date" />
            <input className="admin-input" placeholder="Cự ly (m)" />
            <button type="button" className="admin-btn admin-btn--gold">Lưu race</button>
          </div>
        </div>
      )}

      <div className="race-cards-grid">
        {races.map((race) => (
          <div key={race.id} className="admin-card race-card-item">
            <div className="race-card-top">
              <span className="race-card-id">{race.id}</span>
              <StatusBadge status={race.status} />
            </div>
            <h3>{race.name}</h3>
            <p className="race-card-tournament">{race.tournament}</p>
            <div className="race-card-meta">
              <span>{race.date} · {race.time}</span>
              <span>{race.distance}</span>
            </div>
            <div className="race-card-horses">
              <strong>{race.horses}</strong>
              <span>ngựa tham gia</span>
            </div>
            <div className="admin-table-actions">
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm">Sửa</button>
              {race.status === 'scheduled' && (
                <button type="button" className="admin-btn admin-btn--danger admin-btn--sm">Hủy</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
