import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as tournamentService from '../../../services/tournamentService'
import './TournamentManagement.css'

export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(false)
  const { searchQuery = '' } = useOutletContext() || {}

  const fetchTournaments = async () => {
    setLoading(true)
    try {
      const data = await tournamentService.getTournaments()
      const list = data || []
      const mapped = list.map(t => ({
        id: t.id,
        name: t.name || '',
        venue: t.location || '',
        startDate: t.startDate || '',
        endDate: t.endDate || '',
        status: t.status ? t.status.toLowerCase() : 'draft',
        races: t.races || 0
      }))
      setTournaments(mapped)
    } catch (err) {
      console.error("Failed to load tournaments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [])

  const filteredTournaments = tournaments.filter(t => {
    const q = searchQuery.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.venue.toLowerCase().includes(q)
  })

  const [showForm, setShowForm] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    startDate: '',
    endDate: '',
    status: 'draft'
  })

  // Handlers
  const handleOpenAdd = () => {
    setSelectedTournament(null)
    setFormData({
      name: '',
      venue: '',
      startDate: '',
      endDate: '',
      status: 'draft'
    })
    setShowForm(true)
  }

  const handleOpenEdit = (t) => {
    setShowForm(false)
    setSelectedTournament(t)
    setFormData({
      name: t.name,
      venue: t.venue,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status
    })
  }

  const handleCancelTournament = async (id) => {
    const reason = window.prompt('Nhập lý do hủy giải đấu:')
    if (reason === null) return
    if (!reason.trim()) {
      alert('Lý do hủy không được để trống!')
      return
    }

    try {
      await tournamentService.cancelTournament(id, {
        forceCancel: true,
        reason: reason
      })
      alert('Hủy giải đấu thành công!')
      fetchTournaments()
      if (selectedTournament && selectedTournament.id === id) {
        setSelectedTournament(null)
      }
    } catch (err) {
      alert('Không thể hủy giải đấu: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.venue || !formData.startDate || !formData.endDate) {
      alert('Vui lòng điền đầy đủ thông tin giải đấu!')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!')
      return
    }

    const payload = {
      name: formData.name,
      location: formData.venue,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status?.toUpperCase() || 'DRAFT'
    }

    try {
      if (selectedTournament) {
        // Edit
        await tournamentService.updateTournament(selectedTournament.id, payload)
        alert('Cập nhật giải đấu thành công!')
        setSelectedTournament(null)
      } else {
        // Create
        await tournamentService.createTournament(payload)
        alert('Tạo giải đấu thành công!')
        setShowForm(false)
      }
      fetchTournaments()
    } catch (err) {
      alert('Thao tác thất bại: ' + (err.response?.data?.message || err.message))
    }
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
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <h3>Tạo giải đấu mới</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--gold">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tournament-mgmt-layout">
        <div className="admin-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Đang tải danh sách giải đấu...</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên giải đấu</th>
                    <th>Địa điểm</th>
                    <th>Thời gian</th>
                    <th>Races</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTournaments.map((t) => (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td><strong className="tournament-name" style={{ color: '#fff' }}>{t.name}</strong></td>
                      <td>{t.venue}</td>
                      <td>{t.startDate} → {t.endDate}</td>
                      <td>{t.races} races</td>
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
                  {filteredTournaments.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Không tìm thấy giải đấu phù hợp</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedTournament && (
          <div className="admin-card tournament-detail-panel" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <h3>Chi tiết Giải Đấu</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedTournament(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên giải đấu</label>
                <input
                  required
                  className="admin-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Địa điểm tổ chức</label>
                <input
                  required
                  className="admin-input"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày bắt đầu</label>
                <input
                  required
                  className="admin-input"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày kết thúc</label>
                <input
                  required
                  className="admin-input"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
                <select
                  className="admin-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                >
                  <option value="draft">Nháp (Draft)</option>
                  <option value="active">Đang kích hoạt (Active)</option>
                  <option value="ongoing">Đang diễn ra (Ongoing)</option>
                  <option value="completed">Đã hoàn thành (Completed)</option>
                  <option value="cancelled">Đã hủy (Cancelled)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="admin-btn admin-btn--gold" style={{ width: '100%', padding: '8px' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
