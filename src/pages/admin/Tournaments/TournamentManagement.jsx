import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { tournaments as initialTournaments, races as initialRaces, mockRaceTracks } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import {
  getAllTournaments,
  getTournamentSchedule,
  createTournament,
  updateTournament,
  cancelTournament,
  updateTournamentRegistration
} from '../../../services/tournamentService'
import { getAllRaceTracks } from '../../../services/adminService'
import './TournamentManagement.css'

export default function TournamentManagement() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [raceTracks, setRaceTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const { searchQuery = '' } = useOutletContext() || {}

  // Filters State
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')


  useEffect(() => {
    fetchTournaments()
    fetchRaceTracks()
  }, [])

  const fetchRaceTracks = async () => {
    try {
      const res = await getAllRaceTracks()
      const data = res?.data || res
      if (Array.isArray(data) && data.length > 0) {
        setRaceTracks(data)
      } else {
        setRaceTracks(mockRaceTracks)
      }
    } catch (err) {
      console.warn('Failed to load race tracks from API:', err)
      setRaceTracks(mockRaceTracks)
    }
  }

  const mapBackendStatusToFrontend = (backendStatus) => {
    if (!backendStatus) return 'upcoming'
    if (backendStatus === 'ONGOING') return 'ongoing'
    if (backendStatus === 'COMPLETED') return 'completed'
    if (backendStatus === 'CANCELLED') return 'cancelled'
    if (backendStatus === 'ACTIVE') return 'upcoming'
    return 'upcoming'
  }

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const data = await getAllTournaments()
      const tourList = data?.data || data || []

      let localCreated = []
      try {
        localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
      } catch (e) { }

      if (Array.isArray(tourList)) {
        const formatted = await Promise.all(
          tourList.map(async (t) => {
            let raceCount = 0
            if (Array.isArray(t.schedules) && t.schedules.length > 0) {
              raceCount = t.schedules.length
            } else if (Array.isArray(t.races) && t.races.length > 0) {
              raceCount = t.races.length
            } else if (t.racesCount !== undefined && t.racesCount !== null && t.racesCount > 0) {
              raceCount = Number(t.racesCount)
            } else {
              try {
                const scheduleRes = await getTournamentSchedule(t.id)
                const schedules = scheduleRes?.data || scheduleRes || []
                if (Array.isArray(schedules) && schedules.length > 0) {
                  raceCount = schedules.length
                }
              } catch (_) {
                raceCount = 0
              }
            }

            // Prevent double counting since localCreated usually contains cached backend races
            // We only rely on backend raceCount.
            // raceCount += localMatches

            return {
              id: t.id,
              name: t.name,
              venue: t.location || t.venue,
              startDate: t.startDate,
              endDate: t.endDate,
              races: raceCount,
              prize: t.prize || 'Chưa cập nhật',
              status: mapBackendStatusToFrontend(t.status)
            }
          })
        )
        setTournaments(formatted)
      }
    } catch (err) {
      console.error('Failed to load tournaments from API:', err)
      setTournaments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTournaments = tournaments
    .filter(t => {
      const q = localSearch.toLowerCase()
      if (q && !t.name.toLowerCase().includes(q) && !t.venue.toLowerCase().includes(q)) {
        return false
      }
      const gq = searchQuery.toLowerCase()
      if (gq && !t.name.toLowerCase().includes(gq) && !t.venue.toLowerCase().includes(gq)) {
        return false
      }
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
    if (t.status === 'completed') {
      alert('Giải đấu đã hoàn thành, không thể chỉnh sửa!')
      return
    }
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
    if (t.status === 'completed') {
      alert('Giải đấu đã hoàn thành, không thể chỉnh sửa thời gian đăng ký!')
      return
    }
    if (!t.races || t.races === 0) {
      if (window.confirm('⚠️ Lỗi: Lịch thi đấu chưa được công bố. Vui lòng thêm lịch thi đấu trước khi mở đăng ký.\n\nBạn có muốn chuyển sang trang Quản lý cuộc đua để tạo lịch thi đấu ngay bây giờ không?')) {
        navigate('/admin/races', { state: { tournamentId: t.id, openAdd: true } })
      }
      return
    }
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

    const regEndDateObj = new Date(regFormData.registrationEndDate);
    const tournStartDateObj = new Date(selectedRegTournament.startDate);
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
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Lỗi không xác định'
      const displayMsg = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)

      if (displayMsg.toLowerCase().includes('lịch thi đấu') || displayMsg.toLowerCase().includes('chưa được công bố')) {
        if (window.confirm(`⚠️ Lỗi: ${displayMsg}\n\nBạn có muốn chuyển sang trang Quản lý cuộc đua để thêm lịch thi đấu ngay bây giờ không?`)) {
          setShowRegModal(false)
          navigate('/admin/races', { state: { tournamentId: selectedRegTournament.id, openAdd: true } })
        }
      } else {
        alert('Lỗi: ' + displayMsg)
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
        fetchTournaments()
        if (selectedTournament && selectedTournament.id === t.id) {
          setSelectedTournament(null)
        }
      } catch (err) {
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

    if (selectedTournament && selectedTournament.status === 'completed') {
      alert('Giải đấu đã hoàn thành, không thể chỉnh sửa!')
      return
    }

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
        const payload = {
          name: formData.name,
          location: formData.venue,
          startDate: formData.startDate,
          endDate: formData.endDate
        }
        await createTournament(payload)
        alert('Tạo mới giải đấu thành công!')
      }

      setShowForm(false)
      setSelectedTournament(null)
      fetchTournaments()
    } catch (err) {
      const errorMsg = err.response?.data || err.message || 'Có lỗi xảy ra'
      if (typeof errorMsg === 'string') {
        alert('Lỗi: ' + errorMsg)
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        const messages = Object.values(errors).join('\n')
        alert('Lỗi: \n' + messages)
      } else {
        alert('Lỗi: ' + JSON.stringify(errorMsg))
      }
    }
  }

  const mapFrontendStatusToBackend = (frontendStatus) => {
    if (frontendStatus === 'ongoing') return 'ONGOING'
    if (frontendStatus === 'completed') return 'COMPLETED'
    if (frontendStatus === 'cancelled') return 'CANCELLED'
    return 'ACTIVE'
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
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Địa điểm tổ chức (Trường đua)</label>
                <select
                  required
                  className="admin-select"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px' }}
                >
                  <option value="">-- Chọn trường đua --</option>
                  {raceTracks.map((track) => (
                    <option key={track.id} value={track.name}>
                      {track.name} {track.location ? `(${track.location})` : ''}
                    </option>
                  ))}
                  {formData.venue && !raceTracks.some(t => t.name === formData.venue) && (
                    <option value={formData.venue}>{formData.venue}</option>
                  )}
                </select>
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
                          {t.status !== 'completed' && t.status !== 'cancelled' ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost admin-btn--sm"
                              onClick={() => handleOpenEdit(t)}
                            >
                              Sửa
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost admin-btn--sm"
                              onClick={() => { setSelectedTournament(t); setFormData({ name: t.name, venue: t.venue, startDate: t.startDate, endDate: t.endDate, prize: t.prize, status: t.status }); }}
                            >
                              Chi tiết
                            </button>
                          )}

                          {t.status !== 'completed' && t.status !== 'cancelled' && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger admin-btn--sm"
                              onClick={() => handleCancelTournament(t)}
                            >
                              Hủy
                            </button>
                          )}
                          {t.status === 'upcoming' && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm"
                                style={{ backgroundColor: '#8B5CF6', color: '#FFF' }}
                                onClick={() => navigate('/admin/races', { state: { tournamentId: t.id, openAdd: true } })}
                                title="Thêm lịch thi đấu cho giải đấu này"
                              >
                                📅 + Lịch thi đấu
                              </button>
                            </>
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
                  disabled={selectedTournament.status === 'completed'}
                  className="admin-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px', opacity: selectedTournament.status === 'completed' ? 0.6 : 1 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Địa điểm tổ chức (Trường đua)</label>
                <select
                  required
                  disabled={selectedTournament.status === 'completed'}
                  className="admin-select"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px', opacity: selectedTournament.status === 'completed' ? 0.6 : 1 }}
                >
                  <option value="">-- Chọn trường đua --</option>
                  {raceTracks.map((track) => (
                    <option key={track.id} value={track.name}>
                      {track.name} {track.location ? `(${track.location})` : ''}
                    </option>
                  ))}
                  {formData.venue && !raceTracks.some(t => t.name === formData.venue) && (
                    <option value={formData.venue}>{formData.venue}</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày bắt đầu</label>
                <input
                  required
                  disabled={selectedTournament.status === 'completed'}
                  className="admin-input"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px', opacity: selectedTournament.status === 'completed' ? 0.6 : 1 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày kết thúc</label>
                <input
                  required
                  disabled={selectedTournament.status === 'completed'}
                  className="admin-input"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px', opacity: selectedTournament.status === 'completed' ? 0.6 : 1 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
                <select
                  disabled={selectedTournament.status === 'completed'}
                  className="admin-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', fontSize: '13px', padding: '6px 10px', opacity: selectedTournament.status === 'completed' ? 0.6 : 1 }}
                >
                  <option value="upcoming">Chờ diễn ra (Upcoming)</option>
                  <option value="ongoing">Đang diễn ra (Ongoing)</option>
                  <option value="completed">Hoàn thành (Completed)</option>
                  <option value="cancelled">Đã hủy (Cancelled)</option>
                </select>
              </div>

              {selectedTournament.status !== 'completed' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedTournament(null)}>Hủy</button>
                  <button type="submit" className="admin-btn admin-btn--gold">Lưu thay đổi</button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* REGISTRATION MODAL MOVED TO RACE MANAGEMENT */}


      </div>
    </div>
  )
}
