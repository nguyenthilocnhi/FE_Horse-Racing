import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as horseService from '../../../services/horseService'
import * as adminAccountService from '../../../services/adminAccountService'
import './HorseManagement.css'

export default function HorseManagement() {
  const [horses, setHorses] = useState([])
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(false)

  const { searchQuery: search = '', setSearchQuery: setSearch = () => {} } = useOutletContext() || {}
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedHorse, setSelectedHorse] = useState(null)
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHorse, setEditingHorse] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    age: '', 
    breed: '', 
    ownerId: '', 
    healthStatus: 'ELIGIBLE', 
    image: '' 
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const fetchHorses = async () => {
    setLoading(true)
    try {
      const data = await horseService.getHorses()
      const list = data || []
      const mappedList = list.map(h => {
        let statusVal = 'active'
        let healthLabel = 'Khỏe mạnh'

        if (h.healthStatus === 'INJURED') {
          statusVal = 'injured'
          healthLabel = 'Bị chấn thương'
        } else if (h.healthStatus === 'SICK') {
          statusVal = 'injured'
          healthLabel = 'Bị ốm'
        } else if (h.healthStatus === 'SUSPENDED') {
          statusVal = 'retired'
          healthLabel = 'Bị đình chỉ'
        }

        return {
          id: h.id,
          name: h.name,
          age: h.age || 0,
          breed: h.breed || '',
          owner: h.ownerName || h.horseOwner?.fullName || '—',
          ownerId: h.ownerId || h.horseOwner?.id || '',
          status: statusVal,
          health: healthLabel,
          healthStatus: h.healthStatus || 'ELIGIBLE',
          wins: 0,
          races: 0,
          points: 0,
          image: '',
          rawHorse: h
        }
      })
      setHorses(mappedList)
    } catch (err) {
      console.error("Failed to fetch horses from API:", err)
      setHorses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async () => {
    try {
      const data = await adminAccountService.getAllAccounts()
      const ownerList = (data || []).filter(u => u.role === 'HORSE_OWNER')
      setOwners(ownerList)
    } catch (err) {
      console.error("Failed to fetch owners:", err)
    }
  }

  useEffect(() => {
    fetchHorses()
    fetchOwners()
  }, [])

  // Filter list by search query & status
  const filtered = horses.filter((horse) => {
    const query = search.toLowerCase()
    const nameVal = horse.name || ''
    const breedVal = horse.breed || ''
    const ownerVal = horse.owner || ''
    const matchSearch =
      nameVal.toLowerCase().includes(query) ||
      breedVal.toLowerCase().includes(query) ||
      ownerVal.toLowerCase().includes(query)
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
    setFormData({ name: '', age: '', breed: '', ownerId: '', healthStatus: 'ELIGIBLE', image: '' })
    setModalOpen(true)
  }

  const handleEdit = (horse) => {
    setEditingHorse(horse)
    setFormData({
      name: horse.name,
      age: horse.age.toString(),
      breed: horse.breed,
      ownerId: horse.ownerId?.toString() || '',
      healthStatus: horse.healthStatus || 'ELIGIBLE',
      image: horse.image || ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    const h = horses.find(item => item.id === id)
    if (!h) return
    if (window.confirm(`Bạn có chắc chắn muốn xóa ngựa đua "${h.name}" không?`)) {
      try {
        await horseService.deleteHorse(id)
        setHorses(horses.filter(item => item.id !== id))
        if (selectedHorse && selectedHorse.id === id) {
          setSelectedHorse(null)
        }
        alert('Xóa ngựa đua thành công!')
      } catch (err) {
        alert('Xóa thất bại: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    try {
      if (editingHorse) {
        // Edit mode
        const updated = await horseService.updateHorse(editingHorse.id, {
          name: formData.name,
          age: parseInt(formData.age) || 0,
          breed: formData.breed,
          healthStatus: formData.healthStatus
        })
        alert('Cập nhật ngựa đua thành công!')
      } else {
        // Add mode
        if (!formData.ownerId) {
          alert('Vui lòng chọn một chủ sở hữu cho ngựa đua!')
          return
        }
        await horseService.createHorse({
          name: formData.name,
          age: parseInt(formData.age) || 0,
          breed: formData.breed,
          healthStatus: formData.healthStatus,
          horseOwner: { id: parseInt(formData.ownerId) }
        })
        alert('Thêm ngựa đua mới thành công!')
      }
      fetchHorses()
      setModalOpen(false)
    } catch (err) {
      alert('Thao tác thất bại: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <div className="horse-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Ngựa đua</h1>
          <p className="admin-page-sub">Quản lý danh sách ngựa đua, thông số chiến tích và trạng thái hoạt động trực tuyến</p>
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
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
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
          <option value="retired">Giải nghệ/Đình chỉ (Suspended)</option>
        </select>
      </div>

      <div className="user-mgmt-layout" style={{ display: 'grid', gridTemplateColumns: selectedHorse ? '1fr 340px' : '1fr', gap: '20px' }}>
        <div className="admin-card user-mgmt-table-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Đang tải dữ liệu ngựa đua...</div>
          ) : (
            <>
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
                    {paginatedHorses.length > 0 ? (
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
                                className="admin-btn admin-btn--outline admin-btn--sm"
                                onClick={() => handleEdit(horse)}
                              >
                                Sửa
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
            </>
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
              
              <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => handleEdit(selectedHorse)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => handleDelete(selectedHorse.id)}
                >
                  Xóa
                </button>
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
                    placeholder="Thoroughbred, Arabian..."
                    value={formData.breed}
                    onChange={(e) => setFormData(f => ({ ...f, breed: e.target.value }))}
                  />
                </div>
              </div>

              {!editingHorse && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chủ sở hữu (Owner)</label>
                  <select
                    required
                    className="admin-select"
                    value={formData.ownerId}
                    onChange={(e) => setFormData(f => ({ ...f, ownerId: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="">Chọn chủ sở hữu...</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.fullName} ({o.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tình trạng sức khỏe & Trạng thái</label>
                <select
                  className="admin-select"
                  value={formData.healthStatus}
                  onChange={(e) => setFormData(f => ({ ...f, healthStatus: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="ELIGIBLE">Khỏe mạnh / Đủ điều kiện thi đấu</option>
                  <option value="INJURED">Bị chấn thương</option>
                  <option value="SICK">Bị ốm</option>
                  <option value="SUSPENDED">Bị đình chỉ thi đấu</option>
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
