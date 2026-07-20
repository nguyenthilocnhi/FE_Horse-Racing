import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { admin } from '../../../services'
import * as horseService from '../../../services/horseService'
import { StatusBadge } from '../../../utils/adminHelpers'
import './HorseManagement.css'

export default function HorseManagement() {
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHorses()
  }, [])

  const loadHorses = async () => {
    try {
      setLoading(true)
      const data = await admin.getAllAdminHorses()
      
      // Map data to match frontend structure
      const formatted = data.map(h => ({
        id: h.id,
        name: h.name,
        age: h.age,
        breed: h.breed,
        owner: h.horseOwner?.fullName || h.horseOwner?.userName || 'N/A',
        status: (h.healthStatus === 'ELIGIBLE' || !h.healthStatus) ? 'active' : 'injured', // Simple mock status based on health
        healthStatus: h.healthStatus || 'ELIGIBLE',
        health: h.healthStatus === 'ELIGIBLE' ? 'Khỏe mạnh' : 
               h.healthStatus === 'SUSPENDED' ? 'Bị đình chỉ' : 
               h.healthStatus === 'INJURED' ? 'Bị chấn thương' : 
               h.healthStatus === 'SICK' ? 'Bị ốm' : (h.healthStatus || 'N/A'),
        wins: 0,
        races: 0,
        points: 0,
        image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80' // default
      }))
      
      setHorses(formatted)
    } catch (err) {
      console.error('Failed to load horses:', err)
    } finally {
      setLoading(false)
    }
  }

  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedHorse, setSelectedHorse] = useState(null)
  const [horseHistory, setHorseHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (selectedHorse) {
      loadHorseHistory(selectedHorse.id)
    } else {
      setHorseHistory([])
    }
  }, [selectedHorse])

  const loadHorseHistory = async (horseId) => {
    try {
      setLoadingHistory(true)
      const history = await horseService.getHorseHistory(horseId)
      setHorseHistory(history || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      setHorseHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHorse, setEditingHorse] = useState(null)
  const [formData, setFormData] = useState({ name: '', age: '', breed: '', owner: '', healthStatus: 'ELIGIBLE', image: '' })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Currently disabling edit/add/delete logic as it was pure mock
  // To fully implement these, we need to connect to backend POST/PUT/DELETE
  const saveHorses = (updatedList) => {
    setHorses(updatedList)
  }

  // Filter list by search query & status
  const filtered = horses.filter((horse) => {
    const query = localSearch.toLowerCase()
    const matchSearch =
      horse.name.toLowerCase().includes(query) ||
      horse.breed.toLowerCase().includes(query) ||
      horse.owner.toLowerCase().includes(query)
    const matchStatus = statusFilter === 'ALL' || horse.status === statusFilter
    return matchSearch && matchStatus
  })

  // Calculate pages
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedHorses = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Actions
  const handleOpenAdd = () => {
    setEditingHorse(null)
    setFormData({ name: '', age: '', breed: '', owner: '', healthStatus: 'ELIGIBLE', image: '' })
    setModalOpen(true)
  }

  const handleEdit = (horse) => {
    setEditingHorse(horse)
    setFormData({
      name: horse.name,
      age: horse.age,
      breed: horse.breed,
      owner: horse.owner,
      healthStatus: horse.healthStatus || 'ELIGIBLE',
      image: horse.image || ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngựa đua này không?')) {
      try {
        await admin.deleteAdminHorse(id)
        alert('Xóa ngựa đua thành công!')
        loadHorses()
        if (selectedHorse && selectedHorse.id === id) {
          setSelectedHorse(null)
        }
      } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.response?.data || err.message))
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        name: formData.name,
        age: parseInt(formData.age) || 0,
        breed: formData.breed,
        healthStatus: formData.healthStatus,
        horseOwner: formData.owner ? { fullName: formData.owner.trim() } : null
      }

      if (editingHorse) {
        // Edit mode
        await admin.updateAdminHorse(editingHorse.id, payload)
        alert('Cập nhật ngựa thành công!')
      } else {
        // Add mode
        await admin.createAdminHorse(payload)
        alert('Thêm ngựa đua thành công!')
      }
      
      setModalOpen(false)
      loadHorses()
      if (selectedHorse && editingHorse && selectedHorse.id === editingHorse.id) {
        setSelectedHorse(null)
      }
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.response?.data || err.message))
    }
  }

  return (
    <div className="horse-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Ngựa đua</h1>
          <p className="admin-page-sub">Quản lý danh sách ngựa đua, thông số chiến tích và trạng thái hoạt động</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--gold"
          onClick={handleOpenAdd}
        >
          + Thêm ngựa mới
        </button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="admin-input"
          placeholder="Tìm theo tên ngựa, giống loài hoặc chủ sở hữu..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
        <select 
          className="admin-select" 
          value={statusFilter} 
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động (Active)</option>
          <option value="injured">Chấn thương (Injured)</option>
          <option value="retired">Giải nghệ (Retired)</option>
        </select>
      </div>

      <div className="user-mgmt-layout" style={{ display: 'grid', gridTemplateColumns: selectedHorse ? '1fr 340px' : '1fr', gap: '20px' }}>
        <div className="admin-card user-mgmt-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên ngựa</th>
                  <th>Tuổi</th>
                  <th>Giống</th>
                  <th>Chủ sở hữu</th>
                  <th>Sức khỏe</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Đang tải dữ liệu ngựa...
                    </td>
                  </tr>
                ) : paginatedHorses.length > 0 ? (
                  paginatedHorses.map((horse) => (
                    <tr key={horse.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{horse.name}</td>
                      <td>{horse.age} tuổi</td>
                      <td>{horse.breed}</td>
                      <td>{horse.owner}</td>
                      <td>{horse.health || 'Khỏe mạnh'}</td>
                      <td>
                        <StatusBadge status={horse.status} />
                      </td>
                      <td>
                        <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--sm"
                            onClick={() => setSelectedHorse(horse)}
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--sm"
                            onClick={() => handleEdit(horse)}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleDelete(horse.id)}
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

          {totalPages > 1 && (
            <div
              className="admin-pagination"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 22px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <span className="text-muted" style={{ fontSize: '12px' }}>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)} trong tổng số {filtered.length} con ngựa
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Trang trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`admin-btn admin-btn--sm ${currentPage === page ? 'admin-btn--gold' : 'admin-btn--ghost'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedHorse && (
          <div className="admin-card user-detail-panel">
            <div className="admin-card-head">
              <h3>Chi tiết Ngựa</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setSelectedHorse(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-card-body user-detail-body">
              <div className="horse-detail-image-wrapper" style={{ width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <img 
                  src={selectedHorse.image || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'} 
                  alt={selectedHorse.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{selectedHorse.name}</h4>
              <p style={{ margin: '0 0 20px', color: '#d4af37', fontSize: '13px', letterSpacing: '0.05em' }}>{selectedHorse.breed}</p>
              
              <dl className="user-detail-dl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                <dt>Tuổi</dt>
                <dd>{selectedHorse.age} tuổi</dd>
                
                <dt>Chủ sở hữu</dt>
                <dd>{selectedHorse.owner}</dd>
                
                <dt>Sức khỏe</dt>
                <dd>{selectedHorse.health || 'Khỏe mạnh'}</dd>
                
                <dt>Trạng thái</dt>
                <dd>
                  <StatusBadge status={selectedHorse.status} />
                </dd>
                
                <dt>Điểm phong độ</dt>
                <dd style={{ color: '#d4af37', fontWeight: '700' }}>{selectedHorse.points || 0} PTS</dd>
                
                <dt>Chiến tích (Wins/Races)</dt>
                <dd style={{ color: '#4ade80', fontWeight: '500' }}>
                  {selectedHorse.wins || 0} thắng / {selectedHorse.races || 0} trận
                </dd>
              </dl>

              <div style={{ marginTop: '24px' }}>
                <h5 style={{ color: '#d4af37', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lịch sử thi đấu</h5>
                {loadingHistory ? (
                  <div className="text-muted" style={{ fontSize: '12px' }}>Đang tải lịch sử...</div>
                ) : horseHistory.length === 0 ? (
                  <div className="text-muted" style={{ fontSize: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                    Chưa có lịch sử thi đấu nào.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {horseHistory.map((race, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #d4af37' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: '#fff' }}>{race.raceName || `Trận đấu #${race.raceId}`}</strong>
                          <span style={{ fontSize: '12px', color: race.placement === 1 ? '#4ade80' : '#aaa' }}>Hạng {race.placement}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Thời gian hoàn thành: {race.completionTime}s</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              
            </div>
          </div>
        )}
      </div>

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
              <h3>{editingHorse ? `Sửa thông tin: ${editingHorse.name}` : 'Thêm ngựa đua mới'}</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="admin-card-body form-layout" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tên Ngựa</label>
                <input
                  required
                  className="admin-input"
                  placeholder="Nhập tên ngựa đua..."
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tuổi</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="30"
                    className="admin-input"
                    placeholder="Tuổi..."
                    value={formData.age}
                    onChange={(e) => setFormData(f => ({ ...f, age: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Giống loài</label>
                  <input
                    required
                    className="admin-input"
                    placeholder="Ví dụ: Thoroughbred..."
                    value={formData.breed}
                    onChange={(e) => setFormData(f => ({ ...f, breed: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chủ sở hữu</label>
                <input
                  required
                  className="admin-input"
                  placeholder="Ví dụ: Stable Alpha..."
                  value={formData.owner}
                  onChange={(e) => setFormData(f => ({ ...f, owner: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Link ảnh ngựa (Tùy chọn)</label>
                <input
                  className="admin-input"
                  placeholder="Nhập URL hình ảnh (Unsplash...)..."
                  value={formData.image}
                  onChange={(e) => setFormData(f => ({ ...f, image: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tình trạng Sức khỏe</label>
                <select
                  className="admin-select"
                  value={formData.healthStatus}
                  onChange={(e) => setFormData(f => ({ ...f, healthStatus: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="ELIGIBLE">Khỏe mạnh</option>
                  <option value="SUSPENDED">Bị đình chỉ</option>
                  <option value="INJURED">Bị chấn thương</option>
                  <option value="SICK">Bị ốm</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
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
                  {editingHorse ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
