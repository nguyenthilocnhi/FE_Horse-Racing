import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as adminAccountService from '../../../services/adminAccountService'
import './JockeyManagement.css'

export default function JockeyManagement() {
  const [jockeys, setJockeys] = useState([])
  const [loading, setLoading] = useState(false)
  const { searchQuery: search = '', setSearchQuery: setSearch = () => {} } = useOutletContext() || {}
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedJockey, setSelectedJockey] = useState(null)
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJockey, setEditingJockey] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    license: '',
    experience: '',
    points: '0',
    wins: '0',
    races: '0',
    status: 'active',
    userName: '',
    email: '',
    phone: '',
    password: '',
    birthDate: ''
  })

  const fetchJockeys = async () => {
    setLoading(true)
    try {
      const data = await adminAccountService.getAllAccounts()
      const list = data || []
      const jockeyList = list
        .filter(u => u.role === 'JOCKEY')
        .map(u => {
          let statusVal = 'active'
          if (u.status?.toUpperCase() === 'PENDING') {
            statusVal = 'pending'
          } else if (u.status?.toUpperCase() === 'REJECTED' || u.status?.toUpperCase() === 'LOCKED') {
            statusVal = 'suspended'
          }
          return {
            id: u.id,
            name: u.fullName || u.name,
            license: u.licenseNumber || '—',
            experience: u.experienceYears || 0,
            points: 0,
            wins: 0,
            races: 0,
            status: statusVal,
            email: u.email || '',
            phone: u.phone || '',
            dob: u.dob || u.birthDate || '',
            userName: u.userName || '',
            rawUser: u
          }
        })
      setJockeys(jockeyList)
    } catch (err) {
      console.error("Failed to fetch jockeys:", err)
      setJockeys([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJockeys()
  }, [])

  // Filters
  const filtered = jockeys.filter(j => {
    const nameVal = j.name || ''
    const licenseVal = j.license || ''
    const matchSearch = nameVal.toLowerCase().includes(search.toLowerCase()) || 
                        licenseVal.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || j.status === statusFilter
    return matchSearch && matchStatus
  })


  const handleOpenEdit = (j) => {
    setEditingJockey(j)
    setFormData({
      name: j.name,
      license: j.license,
      experience: j.experience.toString(),
      points: (j.points || 0).toString(),
      wins: (j.wins || 0).toString(),
      races: (j.races || 0).toString(),
      status: j.status,
      userName: j.userName || '',
      email: j.email || '',
      phone: j.phone || '',
      password: '',
      birthDate: j.dob || ''
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.license) {
      alert('Vui lòng điền tên và số giấy phép!')
      return
    }

    try {
      if (editingJockey) {
        // Edit flow
        const updated = await adminAccountService.updateAccount('JOCKEY', editingJockey.id, {
          ...editingJockey.rawUser,
          fullName: formData.name,
          phone: formData.phone,
          licenseNumber: formData.license,
          experienceYears: parseInt(formData.experience) || 0,
          status: formData.status === 'active' ? 'APPROVED' : (formData.status === 'suspended' ? 'REJECTED' : 'PENDING'),
          birthDate: formData.birthDate || editingJockey.dob
        })
        
        let statusVal = 'active'
        if (updated.status?.toUpperCase() === 'PENDING') {
          statusVal = 'pending'
        } else if (updated.status?.toUpperCase() === 'REJECTED' || updated.status?.toUpperCase() === 'LOCKED') {
          statusVal = 'suspended'
        }

        const nextJ = {
          ...editingJockey,
          name: updated.fullName || updated.name || formData.name,
          license: updated.licenseNumber || formData.license,
          experience: updated.experienceYears || parseInt(formData.experience) || 0,
          status: statusVal,
          phone: updated.phone || formData.phone,
          dob: updated.dob || updated.birthDate || formData.birthDate,
          rawUser: updated
        }

        setJockeys(jockeys.map(j => j.id === editingJockey.id ? nextJ : j))
        if (selectedJockey && selectedJockey.id === editingJockey.id) {
          setSelectedJockey(nextJ)
        }
        alert('Cập nhật Jockey thành công!')
      }
      setModalOpen(false)
    } catch (err) {
      alert('Thao tác thất bại: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <div className="jockey-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Jockey (Nài ngựa)</h1>
          <p className="admin-page-sub">Danh sách nài ngựa đua chuyên nghiệp, kinh nghiệm và thống kê phong độ từ API</p>
        </div>
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
          <option value="pending">Chờ phê duyệt (Pending)</option>
          <option value="suspended">Tạm đình chỉ (Suspended)</option>
        </select>
      </div>

      <div className="user-mgmt-layout" style={{ display: 'grid', gridTemplateColumns: selectedJockey ? '1fr 340px' : '1fr', gap: '20px' }}>
        <div className="admin-card user-mgmt-table-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Đang tải dữ liệu Jockey...</div>
          ) : (
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
          )}
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

                <dt>Tên đăng nhập</dt>
                <dd>{selectedJockey.userName || '—'}</dd>

                <dt>Email</dt>
                <dd>{selectedJockey.email || '—'}</dd>

                <dt>Số điện thoại</dt>
                <dd>{selectedJockey.phone || '—'}</dd>

                <dt>Ngày sinh</dt>
                <dd>
                  {selectedJockey.dob
                    ? (() => {
                      try {
                        const d = new Date(selectedJockey.dob);
                        return isNaN(d.getTime()) ? selectedJockey.dob : d.toLocaleDateString('vi-VN');
                      } catch (e) {
                        return selectedJockey.dob;
                      }
                    })()
                    : '—'}
                </dd>
                
                <dt>Điểm phong độ</dt>
                <dd style={{ color: '#d4af37', fontWeight: '700' }}>{selectedJockey.points} PTS</dd>
                
                <dt>Tỷ lệ thắng (Wins/Races)</dt>
                <dd style={{ color: '#4ade80', fontWeight: '500' }}>
                  {selectedJockey.wins} thắng / {selectedJockey.races} trận ({selectedJockey.races ? ((selectedJockey.wins / selectedJockey.races) * 100).toFixed(1) : 0}%)
                </dd>
              </dl>
              
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  style={{ width: '100%' }}
                  onClick={() => handleOpenEdit(selectedJockey)}
                >
                  Sửa hồ sơ
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
              <h3>Sửa Jockey: {editingJockey?.name}</h3>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Số điện thoại</label>
                <input
                  required
                  type="tel"
                  className="admin-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày sinh</label>
                <input
                  required
                  type="date"
                  className="admin-input"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
                <select
                  className="admin-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="active">Đang hoạt động (Active)</option>
                  <option value="pending">Chờ phê duyệt (Pending)</option>
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
