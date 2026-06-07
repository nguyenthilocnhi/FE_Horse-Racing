import React, { useState } from 'react'
import { tournaments as initialTournaments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './TournamentManagement.css'

export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState(initialTournaments)
  const [showForm, setShowForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    startDate: '',
    endDate: '',
    prize: '',
    status: 'upcoming'
  })

  // Handlers
  const handleOpenAdd = () => {
    setEditingTournament(null)
    setFormData({
      name: '',
      venue: '',
      startDate: '',
      endDate: '',
      prize: '',
      status: 'upcoming'
    })
    setShowForm(true)
  }

  const handleOpenEdit = (t) => {
    setEditingTournament(t)
    setFormData({
      name: t.name,
      venue: t.venue,
      startDate: t.startDate,
      endDate: t.endDate,
      prize: t.prize,
      status: t.status
    })
    setShowForm(true)
  }

  const handleCancelTournament = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy giải đấu này?')) {
      setTournaments(tournaments.map(t => 
        t.id === id ? { ...t, status: 'cancelled' } : t
      ))
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.venue || !formData.startDate || !formData.endDate) {
      alert('Vui lòng điền đầy đủ thông tin giải đấu!')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!')
      return
    }

    if (editingTournament) {
      // Edit
      setTournaments(tournaments.map(t => 
        t.id === editingTournament.id 
          ? { ...t, ...formData } 
          : t
      ))
    } else {
      // Create
      const newT = {
        id: `T-00${tournaments.length + 1}`,
        ...formData,
        races: 0
      }
      setTournaments([newT, ...tournaments])
    }

    setShowForm(false)
  }

  return (
    <div className="tournament-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Giải đấu</h1>
          <p className="admin-page-sub">Tạo, chỉnh sửa và theo dõi trạng thái các giải đấu đua ngựa</p>
        </div>
        <button 
          type="button" 
          className="admin-btn admin-btn--gold" 
          onClick={handleOpenAdd}
        >
          + Tạo giải đấu
        </button>
      </div>

      {showForm && (
        <div className="admin-card tournament-form-card" style={{ marginBottom: '24px', border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="admin-card-head">
            <h3>{editingTournament ? `Sửa giải đấu: ${editingTournament.name}` : 'Tạo giải đấu mới'}</h3>
            <button 
              type="button" 
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSave} className="admin-card-body tournament-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên giải đấu</label>
              <input 
                required
                className="admin-input" 
                placeholder="Ví dụ: Cúp Hoàng Gia 2026..." 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Địa điểm tổ chức</label>
              <input 
                required
                className="admin-input" 
                placeholder="Địa điểm..." 
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giải thưởng</label>
              <input 
                required
                className="admin-input" 
                placeholder="Ví dụ: 1.2M USD hoặc 5 tỷ VND..." 
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày bắt đầu</label>
              <input 
                required
                className="admin-input" 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày kết thúc</label>
              <input 
                required
                className="admin-input" 
                type="date" 
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái giải đấu</label>
              <select 
                className="admin-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="upcoming">Sắp diễn ra (Upcoming)</option>
                <option value="ongoing">Đang diễn ra (Ongoing)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
                <option value="cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', gridColumn: 'span 2', marginTop: '12px' }}>
              <button 
                type="button" 
                className="admin-btn admin-btn--ghost" 
                onClick={() => setShowForm(false)}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="admin-btn admin-btn--gold"
              >
                Lưu giải đấu
              </button>
            </div>
          </form>
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
                  <td><strong className="tournament-name" style={{ color: '#fff' }}>{t.name}</strong></td>
                  <td>{t.venue}</td>
                  <td>{t.startDate} → {t.endDate}</td>
                  <td>{t.races} races</td>
                  <td>{t.prize}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div className="admin-table-actions">
                      <button 
                        type="button" 
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        onClick={() => handleOpenEdit(t)}
                      >
                        Sửa
                      </button>
                      {t.status !== 'cancelled' && (
                        <button 
                          type="button" 
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          onClick={() => handleCancelTournament(t.id)}
                        >
                          Hủy
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
    </div>
  )
}
