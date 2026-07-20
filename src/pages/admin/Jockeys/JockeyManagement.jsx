import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { mockJockeys as initialJockeys } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllAdminJockeys, createAdminJockey, updateAdminJockey, deleteAdminJockey } from '../../../services/adminService'
import './JockeyManagement.css'

export default function JockeyManagement() {
  const [jockeys, setJockeys] = useState([])
  const [loading, setLoading] = useState(true)
  const { searchQuery: search = '', setSearchQuery: setSearch = () => {} } = useOutletContext() || {}
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedJockey, setSelectedJockey] = useState(null)
  
  useEffect(() => {
    fetchJockeys()
  }, [])

  const mapBackendStatusToFrontend = (backendStatus) => {
    if (!backendStatus) return 'active'
    if (backendStatus === 'ACTIVE') return 'active'
    if (backendStatus === 'INACTIVE') return 'suspended'
    if (backendStatus === 'BANNED') return 'suspended' // adjust based on actual enum if needed
    return 'active'
  }

  const mapFrontendStatusToBackend = (frontendStatus) => {
    if (frontendStatus === 'active') return 'ACTIVE'
    if (frontendStatus === 'suspended') return 'INACTIVE'
    if (frontendStatus === 'injured') return 'INACTIVE' // adjust if needed
    return 'ACTIVE'
  }

  const fetchJockeys = async () => {
    try {
      setLoading(true)
      const data = await getAllAdminJockeys()
      if (data && data.length > 0) {
        const formatted = data.map(j => ({
          id: j.id,
          userName: j.userName,
          name: j.fullName,
          email: j.email,
          phone: j.phone,
          birthDate: j.birthDate,
          license: j.licenseNumber || 'N/A',
          experience: j.experienceYears || 0,
          status: mapBackendStatusToFrontend(j.accountStatus)
        }))
        setJockeys(formatted)
      } else {
        setJockeys(initialJockeys)
      }
    } catch (err) {
      console.error('Failed to load jockeys', err)
      setJockeys(initialJockeys)
    } finally {
      setLoading(false)
    }
  }
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJockey, setEditingJockey] = useState(null)
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    licenseNumber: '',
    experienceYears: '0',
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
      userName: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      birthDate: '',
      licenseNumber: '',
      experienceYears: '0',
      status: 'active'
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (j) => {
    setEditingJockey(j)
    setFormData({
      userName: j.userName,
      password: '', // Don't show existing password, leave blank unless changing
      fullName: j.name,
      email: j.email,
      phone: j.phone,
      birthDate: j.birthDate,
      licenseNumber: j.license,
      experienceYears: j.experience.toString(),
      status: j.status
    })
    setModalOpen(true)
  }

  const handleDeleteJockey = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Jockey này?')) {
      try {
        await deleteAdminJockey(id)
        alert('Xóa Jockey thành công!')
        fetchJockeys()
        if (selectedJockey && selectedJockey.id === id) {
          setSelectedJockey(null)
        }
      } catch (err) {
        const msg = err.response?.data || err.message
        alert('Lỗi khi xóa: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)))
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.userName || !formData.fullName || !formData.licenseNumber) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!')
      return
    }

    const payload = {
      userName: formData.userName,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate,
      licenseNumber: formData.licenseNumber,
      experienceYears: parseInt(formData.experienceYears) || 0,
      accountStatus: mapFrontendStatusToBackend(formData.status)
    }

    if (formData.password) {
      payload.password = formData.password
    }

    try {
      if (editingJockey) {
        await updateAdminJockey(editingJockey.id, payload)
        alert('Cập nhật Jockey thành công!')
      } else {
        await createAdminJockey(payload)
        alert('Thêm Jockey thành công!')
      }
      setModalOpen(false)
      fetchJockeys()
    } catch (err) {
      const msg = err.response?.data || err.message
      alert('Lỗi lưu Jockey: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)))
    }
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
                  <th>Tên đăng nhập</th>
                  <th>Họ tên Jockey</th>
                  <th>Giấy phép (Certificate)</th>
                  <th>Kinh nghiệm</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((j) => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: '500', color: '#d4af37' }}>@{j.userName}</td>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{j.name}</td>
                      <td><code>{j.license}</code></td>
                      <td>{j.experience} năm</td>
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
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
              <p style={{ margin: '0 0 20px', color: '#d4af37', fontSize: '13px', letterSpacing: '0.05em' }}>@{selectedJockey.userName}</p>
              
              <dl className="user-detail-dl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                <dt>Email</dt>
                <dd>{selectedJockey.email}</dd>
                
                <dt>Số điện thoại</dt>
                <dd>{selectedJockey.phone}</dd>

                <dt>Ngày sinh</dt>
                <dd>{selectedJockey.birthDate}</dd>

                <dt>Giấy phép (Certificate)</dt>
                <dd><code>{selectedJockey.license}</code></dd>

                <dt>Kinh nghiệm</dt>
                <dd>{selectedJockey.experience} năm hoạt động</dd>
                
                <dt>Trạng thái</dt>
                <dd>
                  <StatusBadge status={selectedJockey.status} />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên đăng nhập</label>
                  <input
                    required
                    className="admin-input"
                    placeholder="VD: banglcb..."
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Mật khẩu {!editingJockey && '(Bắt buộc)'}</label>
                  <input
                    required={!editingJockey}
                    type="text"
                    className="admin-input"
                    placeholder={editingJockey ? "Bỏ trống nếu không đổi..." : "Nhập mật khẩu..."}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Họ tên Jockey</label>
                  <input
                    required
                    className="admin-input"
                    placeholder="Nhập họ tên Jockey..."
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Email</label>
                  <input
                    required
                    type="email"
                    className="admin-input"
                    placeholder="example@gmail.com..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Số điện thoại</label>
                  <input
                    required
                    className="admin-input"
                    placeholder="0123456789..."
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Kinh nghiệm (năm)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="admin-input"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giấy phép / Chứng chỉ (Certificate Level)</label>
                <input
                  required
                  className="admin-input"
                  placeholder="Mã giấy phép hoặc cấp bậc chứng chỉ..."
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>

              {editingJockey && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
                  <select
                    className="admin-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="active">Đã duyệt / Hoạt động (Approved)</option>
                    <option value="suspended">Tạm đình chỉ (Suspended/Locked)</option>
                  </select>
                </div>
              )}

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
