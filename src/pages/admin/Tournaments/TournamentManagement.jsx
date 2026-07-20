import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { tournaments as initialTournaments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, createTournament, updateTournament, cancelTournament, updateTournamentRegistration } from '../../../services/tournamentService'
import './TournamentManagement.css'

export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState(initialTournaments)
  const [loading, setLoading] = useState(true)
  const { searchQuery = '' } = useOutletContext() || {}

  // Filters State
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')

  useEffect(() => {
    fetchTournaments()
  }, [])

  const mapBackendStatusToFrontend = (backendStatus) => {
    if (!backendStatus) return 'upcoming'
    if (backendStatus === 'ONGOING') return 'ongoing'
    if (backendStatus === 'COMPLETED') return 'completed'
    if (backendStatus === 'CANCELLED') return 'cancelled'
    if (backendStatus === 'ACTIVE') return 'upcoming'
    return 'upcoming' // Default for DRAFT or others
  }

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const data = await getAllTournaments()
      if (data && data.length > 0) {
        // Map backend data to frontend format
        const formatted = data.map(t => ({
          id: t.id,
          name: t.name,
          venue: t.location,
          startDate: t.startDate,
          endDate: t.endDate,
          races: t.racesCount || 0,
          prize: 'Chưa cập nhật',
          status: mapBackendStatusToFrontend(t.status)
        }))
        setTournaments(formatted)
      } else {
        // Fallback to mock data if empty
        setTournaments(initialTournaments)
      }
    } catch (err) {
      console.error('Failed to load tournaments from API, using mock data:', err)
      setTournaments(initialTournaments)
    } finally {
      setLoading(false)
    }
  }

  const filteredTournaments = tournaments
    .filter(t => {
      // Local Search Filter
      const q = localSearch.toLowerCase()
      if (q && !t.name.toLowerCase().includes(q) && !t.venue.toLowerCase().includes(q)) {
        return false
      }
      // Global Header Search Filter
      const gq = searchQuery.toLowerCase()
      if (gq && !t.name.toLowerCase().includes(gq) && !t.venue.toLowerCase().includes(gq)) {
        return false
      }
      // Status Filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'NEWEST') {
        return b.id - a.id
      } else if (sortOrder === 'OLDEST') {
        return a.id - b.id
      } else if (sortOrder === 'NAME_AZ') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

  const [showForm, setShowForm] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)

  // Registration Modal States
  const [showRegModal, setShowRegModal] = useState(false)
  const [selectedRegTournament, setSelectedRegTournament] = useState(null)
  const [regFormData, setRegFormData] = useState({
    registrationStartDate: '',
    registrationEndDate: ''
  })

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
    setSelectedTournament(null)
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
    setShowForm(false)
    setSelectedTournament(t)
    setFormData({
      name: t.name,
      venue: t.venue,
      startDate: t.startDate,
      endDate: t.endDate,
      prize: t.prize,
      status: t.status
    })
  }

  const handleOpenRegistration = (t) => {
    setSelectedRegTournament(t)
    setRegFormData({
      registrationStartDate: '', 
      registrationEndDate: ''
    })
    setShowRegModal(true)
  }

  const handleSaveRegistration = async (e) => {
    e.preventDefault()
    if (!regFormData.registrationStartDate || !regFormData.registrationEndDate) {
      alert('Vui lòng chọn cả thời gian mở và đóng đăng ký!')
      return
    }
    if (new Date(regFormData.registrationEndDate) < new Date(regFormData.registrationStartDate)) {
      alert('Ngày đóng đăng ký không được diễn ra trước ngày mở đăng ký')
      return
    }

    // Compare local dates
    const regEndDateObj = new Date(regFormData.registrationEndDate);
    const tournStartDateObj = new Date(selectedRegTournament.startDate); // startDate is "YYYY-MM-DD"
    // Set both to midnight to compare just dates
    regEndDateObj.setHours(0, 0, 0, 0);
    tournStartDateObj.setHours(0, 0, 0, 0);
    
    if (regEndDateObj > tournStartDateObj) {
      alert('Ngày đóng đăng ký không được vượt quá ngày bắt đầu giải đấu')
      return
    }

    try {
      const startIso = new Date(regFormData.registrationStartDate).toISOString()
      const endIso = new Date(regFormData.registrationEndDate).toISOString()

      await updateTournamentRegistration(selectedRegTournament.id, {
        registrationStartDate: startIso,
        registrationEndDate: endIso
      })
      alert('Thiết lập thời gian đăng ký thành công!')
      setShowRegModal(false)
      setSelectedRegTournament(null)
      fetchTournaments() 
    } catch (err) {
      const errorMsg = err.response?.data || err.message || 'Lỗi không xác định'
      if (typeof errorMsg === 'string') {
        alert('Lỗi: ' + errorMsg)
      } else {
        alert('Lỗi: ' + JSON.stringify(errorMsg))
      }
    }
  }

  const handleCancelTournament = async (t) => {
    if (t.status === 'completed') {
      alert('Không thể hủy giải đấu đã hoàn thành!')
      return
    }

    if (window.confirm('Bạn có chắc chắn muốn hủy giải đấu này?')) {
      try {
        await cancelTournament(t.id, {
          reason: "Hủy theo yêu cầu quản trị viên",
          forceCancel: true
        })
        alert('Hủy giải đấu thành công!')
        
        // Cập nhật lại UI sau khi hủy hoặc có thể gọi lại fetchTournaments()
        fetchTournaments()
        if (selectedTournament && selectedTournament.id === t.id) {
          setSelectedTournament(null)
        }
      } catch(err) {
        const errorMsg = err.response?.data || err.message || 'Lỗi không xác định'
        if (typeof errorMsg === 'string') {
          alert('Hủy thất bại: ' + errorMsg)
        } else {
          alert('Hủy thất bại: ' + JSON.stringify(errorMsg))
        }
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Frontend Validation fallback (matching backend requirements)
    if (!formData.name || formData.name.length < 4) {
      alert('Tên giải đấu phải có ít nhất 4 ký tự')
      return
    }
    if (!formData.venue || formData.venue.length < 4) {
      alert('Địa điểm phải có ít nhất 4 ký tự')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc!')
      return
    }

    try {
      if (selectedTournament) {
        // Edit API Call
        const payload = {
          name: formData.name,
          location: formData.venue,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: mapFrontendStatusToBackend(formData.status)
        }
        await updateTournament(selectedTournament.id, payload)
        alert('Cập nhật giải đấu thành công!')
      } else {
        // Create API Call
        const payload = {
          name: formData.name,
          location: formData.venue,
          startDate: formData.startDate,
          endDate: formData.endDate
        }
        await createTournament(payload)
        alert('Tạo mới giải đấu thành công!')
      }
      
      // Reload list from backend
      setShowForm(false)
      setSelectedTournament(null)
      fetchTournaments()
    } catch (err) {
      const errorMsg = err.response?.data || err.message || 'Có lỗi xảy ra'
      if (typeof errorMsg === 'string') {
        alert('Lỗi: ' + errorMsg)
      } else if (err.response?.data?.errors) {
        // Handle Spring Validation errors
        const errors = err.response.data.errors
        const messages = Object.values(errors).join('\\n')
        alert('Lỗi: \\n' + messages)
      } else {
        alert('Lỗi: ' + JSON.stringify(errorMsg))
      }
    }
  }

  const mapFrontendStatusToBackend = (frontendStatus) => {
    if (frontendStatus === 'ongoing') return 'ONGOING'
    if (frontendStatus === 'completed') return 'COMPLETED'
    if (frontendStatus === 'cancelled') return 'CANCELLED'
    return 'ACTIVE' // map 'upcoming' to 'ACTIVE' for backend if needed
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
          <div className="admin-filters" style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid rgba(212,175,55,0.15)', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo tên hoặc địa điểm..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ minWidth: '220px' }}
            />
            
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <select
              className="admin-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="NEWEST">Sắp xếp: Mới nhất</option>
              <option value="OLDEST">Sắp xếp: Cũ nhất</option>
              <option value="NAME_AZ">Sắp xếp: Tên A ➔ Z</option>
            </select>
          </div>

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
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Đang tải danh sách giải đấu...
                    </td>
                  </tr>
                ) : filteredTournaments.length > 0 ? (
                  filteredTournaments.map((t) => (
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
                            onClick={() => handleCancelTournament(t)}
                          >
                            Hủy
                          </button>
                        )}
                        {t.status === 'upcoming' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm"
                            style={{ backgroundColor: '#1A73E8', color: '#FFF' }}
                            onClick={() => handleOpenRegistration(t)}
                            title="Thiết lập đăng ký"
                          >
                            Chỉnh sửa ngày đăng ký
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Không có giải đấu nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  <option value="upcoming">Sắp diễn ra (Active)</option>
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

        {/* REGISTRATION MODAL */}
        {showRegModal && selectedRegTournament && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div className="admin-card" style={{ width: '400px', border: '1px solid #D4AF37' }}>
              <div className="admin-card-head">
                <h3>MỞ/ĐÓNG ĐĂNG KÝ</h3>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setShowRegModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveRegistration} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>Giải đấu: <strong style={{ color: '#D4AF37' }}>{selectedRegTournament.name}</strong></p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thời gian Mở đăng ký</label>
                  <input
                    required
                    type="datetime-local"
                    className="admin-input"
                    value={regFormData.registrationStartDate}
                    onChange={(e) => setRegFormData({ ...regFormData, registrationStartDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thời gian Đóng đăng ký</label>
                  <input
                    required
                    type="datetime-local"
                    className="admin-input"
                    value={regFormData.registrationEndDate}
                    onChange={(e) => setRegFormData({ ...regFormData, registrationEndDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowRegModal(false)}>Hủy bỏ</button>
                  <button type="submit" className="admin-btn admin-btn--gold">Lưu thiết lập</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
