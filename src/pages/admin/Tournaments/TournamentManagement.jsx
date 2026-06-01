import React, { useState } from 'react'
import { tournaments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './TournamentManagement.css'

export default function TournamentManagement() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="tournament-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Giải đấu</h1>
          <p className="admin-page-sub">Tạo, chỉnh sửa và theo dõi trạng thái giải đấu</p>
        </div>
        <button type="button" className="admin-btn admin-btn--gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng form' : '+ Tạo giải đấu'}
        </button>
      </div>

      {showForm && (
        <div className="admin-card tournament-form-card">
          <div className="admin-card-head"><h3>Tạo giải đấu mới</h3></div>
          <div className="admin-card-body tournament-form">
            <input className="admin-input" placeholder="Tên giải đấu" />
            <input className="admin-input" placeholder="Địa điểm" />
            <input className="admin-input" type="date" />
            <input className="admin-input" placeholder="Giải thưởng" />
            <button type="button" className="admin-btn admin-btn--gold">Lưu giải đấu</button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên giải đấu</th>
                <th>Địa điểm</th>
                <th>Thời gian</th>
                <th>Races</th>
                <th>Giải thưởng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td><strong className="tournament-name">{t.name}</strong></td>
                  <td>{t.venue}</td>
                  <td>{t.startDate} → {t.endDate}</td>
                  <td>{t.races}</td>
                  <td>{t.prize}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm">Sửa</button>
                      {t.status !== 'cancelled' && (
                        <button type="button" className="admin-btn admin-btn--danger admin-btn--sm">Hủy</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
