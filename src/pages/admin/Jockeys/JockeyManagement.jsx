import React, { useState } from 'react'
import { mockJockeys as initialJockeys } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './JockeyManagement.css'

export default function JockeyManagement() {
  const [jockeys, setJockeys] = useState(initialJockeys)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedJockey, setSelectedJockey] = useState(null)
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJockey, setEditingJockey] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    license: '',
    experience: '',
    points: '',
    wins: '',
    races: '',
    status: 'active'
  })

  // Filters
  const filtered = jockeys.filter(j => {
    const matchSearch = j.name.toLowerCase().includes(search.toLowerCase()) || 
                        j.license.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  // Handlers
  const handleOpenAdd = () => {
    setEditingJockey(null)
    setFormData({
      name: '',
      license: '',
      experience: '1',
      points: '0',
      wins: '0',
      races: '0',
      status: 'active'
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (j) => {
    setEditingJockey(j)
    setFormData({
      name: j.name,
      license: j.license,
      experience: j.experience.toString(),
      points: j.points.toString(),
      wins: j.wins.toString(),
      races: j.races.toString(),
      status: j.status
    })
    setModalOpen(true)
  }

  const handleDeleteJockey = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Jockey này?')) {
      const updated = jockeys.filter(j => j.id !== id)
      setJockeys(updated)
      if (selectedJockey && selectedJockey.id === id) {
        setSelectedJockey(null)
      }
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.license) {
      alert('Vui lòng điền tên và số giấy phép!')
      return
    }

    const nextJ = {
      name: formData.name,
      license: formData.license,
      experience: parseInt(formData.experience) || 0,
      points: parseInt(formData.points) || 0,
      wins: parseInt(formData.wins) || 0,
      races: parseInt(formData.races) || 0,
      status: formData.status
    }

    if (editingJockey) {
      // Edit
      setJockeys(jockeys.map(j => 
        j.id === editingJockey.id ? { ...j, ...nextJ } : j
      ))
      if (selectedJockey && selectedJockey.id === editingJockey.id) {
        setSelectedJockey({ ...selectedJockey, ...nextJ })
      }
    } else {
      // Add
      const newJ = {
        id: Date.now(),
        ...nextJ
      }
      setJockeys([newJ, ...jockeys])
    }

    setModalOpen(false)
  }

  return (
    <div className="jockey-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Jockey (Nài ngựa)</h1>
          <p className="admin-page-sub">Danh sách nài ngựa đua chuyên nghiệp, kinh nghiệm và thống kê phong độ</p>
        </div>
        <button 
          type="button" 
          className="admin-btn admin-btn--gold"
          onClick={handleOpenAdd}
        >
          + Add New Jockey
        </button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="admin-input"
          placeholder="Tìm theo tên hoặc mã giấy phép..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động (Active)</option>
          <option value="injured">Chấn thương (Injured)</option>
          <option value="suspended">Tạm đình chỉ (Suspended)</option>
        </select>
      </div>

      <div className="user-mgmt-layout" style={{ display: 'grid', gridTemplateColumns: selectedJockey ? '1fr 340px' : '1fr', gap: '20px' }}>
        <div className="admin-card user-mgmt-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ tên Jockey</th>
                  <th>Giấy phép</th>
                  <th>Kinh nghiệm</th>
                  <th>Trận thắng</th>
                  <th>Tổng số trận</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((j) => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{j.name}</td>
                      <td><code>{j.license}</code></td>
                      <td>{j.experience} năm</td>
                      <td style={{ color: '#4ade80' }}>{j.wins} thắng</td>
                      <td>{j.races} trận</td>
                      <td>
                        <StatusBadge status={j.status} />
                      </td>
                      <td>
                        <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--sm"
                            onClick={() => setSelectedJockey(j)}
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--outline admin-btn--sm"
                            onClick={() => handleOpenEdit(j)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleDeleteJockey(j.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Không tìm thấy kết quả phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedJockey && (
          <div className="admin-card user-detail-panel">
            <div className="admin-card-head">
              <h3>Hồ sơ Jockey</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setSelectedJockey(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-card-body user-detail-body">
              <div className="user-detail-avatar" style={{ fontSize: '24px', background: 'linear-gradient(135deg, #d4af37, #8b7355)', color: '#0d0d0d' }}>
                🏇
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{selectedJockey.name}</h4>
              <p style={{ margin: '0 0 20px', color: '#d4af37', fontSize: '13px', letterSpacing: '0.05em' }}>{selectedJockey.license}</p>
              
              <dl className="user-detail-dl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                <dt>Kinh nghiệm</dt>
                <dd>{selectedJockey.experience} năm hoạt động</dd>
                
                <dt>Trạng thái</dt>
                <dd>
                  <StatusBadge status={selectedJockey.status} />
                </dd>
                
                <dt>Điểm phong độ</dt>
                <dd style={{ color: '#d4af37', fontWeight: '700' }}>{selectedJockey.points} PTS</dd>
                
                <dt>Tỷ lệ thắng (Wins/Races)</dt>
                <dd style={{ color: '#4ade80', fontWeight: '500' }}>
                  {selectedJockey.wins} thắng / {selectedJockey.races} trận ({selectedJockey.races ? ((selectedJockey.wins / selectedJockey.races) * 100).toFixed(1) : 0}%)
                </dd>
              </dl>
              
              <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => handleOpenEdit(selectedJockey)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => handleDeleteJockey(selectedJockey.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Jockey Modal */}
      {modalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)'
            }}
          >
            <div className="admin-card-head">
              <h3>{editingJockey ? `Sửa Jockey: ${editingJockey.name}` : 'Thêm Jockey mới'}</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên Jockey</label>
                <input
                  required
                  className="admin-input"
                  placeholder="Nhập tên Jockey..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giấy phép</label>
                  <input
                    required
                    className="admin-input"
                    placeholder="Mã giấy phép..."
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Kinh nghiệm (năm)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="admin-input"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thắng</label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    value={formData.wins}
                    onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tổng trận</label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    value={formData.races}
                    onChange={(e) => setFormData({ ...formData, races: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Điểm</label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
                <select
                  className="admin-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="active">Đang hoạt động (Active)</option>
                  <option value="injured">Chấn thương (Injured)</option>
                  <option value="suspended">Tạm đình chỉ (Suspended)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--gold"
                >
                  {editingJockey ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
