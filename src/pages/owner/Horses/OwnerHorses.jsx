import React, { useState, useEffect } from 'react'
import { ownerHorses as initialHorses, ownerRaces } from '../../../data/ownerMockData'
import * as ownerService from '../../../services/ownerService'
import * as horseService from '../../../services/horseService'
export default function OwnerHorses() {
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)
  const [newHorseModal, setNewHorseModal] = useState(false)
  const [editHorseModal, setEditHorseModal] = useState(false)
  const [registerModal, setRegisterModal] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)
  const [horseHistory, setHorseHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [breed, setBreed] = useState('Thoroughbred')
  const [healthStatus, setHealthStatus] = useState('ELIGIBLE')
  const [image, setImage] = useState('')
  
  // Registration Form fields
  const [selectedRaceId, setSelectedRaceId] = useState('')

  // Pagination & Filter fields
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // ── Fetch horses from API on mount ──
  useEffect(() => {
    async function loadHorses() {
      try {
        setLoading(true)
        const data = await ownerService.getOwnerHorses()
        // API response format validation
        const list = Array.isArray(data) ? data : data?.data ?? data?.content ?? []
        
        // Map API fields (stable-owner attributes) if needed
        const formatted = list.map(h => ({
          id:            h.id ?? h.horseId ?? `HRS-00${Math.floor(Math.random() * 1000)}`,
          name:          h.name ?? h.fullName ?? 'Chưa đặt tên',
          breed:         h.breed ?? 'Thoroughbred',
          age:           h.age ?? 3,
          wins:          h.wins ?? 0,
          races:         h.racesCount ?? h.races ?? 0,
          earnings:      h.earnings ?? '0 VND',
          healthStatus:  h.healthStatus || 'ELIGIBLE',
          status:        (h.healthStatus === 'ELIGIBLE' || !h.healthStatus) ? 'ready' : 'gray',
          currentJockey: h.jockeyName ?? null,
          image:         h.image ?? ''
        }))
        setHorses(formatted)
      } catch (err) {
        console.warn('API getOwnerHorses lỗi, dùng dữ liệu giả lập:', err.message)
        // Fallback to initial mock data during dev
        setHorses(initialHorses)
      } finally {
        setLoading(false)
      }
    }
    loadHorses()
  }, [])

  const handleAddHorse = async (e) => {
    e.preventDefault()
    if (!name || !age) return
    
    const payload = {
      name,
      age: parseInt(age, 10),
      breed,
      healthStatus: healthStatus
    }

    try {
      const data = await ownerService.createOwnerHorse(payload)
      const newHorse = {
        id:            data?.id ?? `HRS-00${horses.length + 1}`,
        name:          data?.name ?? name,
        age:           data?.age ?? parseInt(age, 10),
        breed:         data?.breed ?? breed,
        wins:          0,
        races:         0,
        earnings:      '0 VND',
        status:        'ready',
        currentJockey: null
      }
      setHorses([...horses, newHorse])
      alert('✅ Đăng ký ngựa mới thành công!')
    } catch (err) {
      console.warn('Đăng ký ngựa qua API lỗi, tạo cục bộ:', err.message)
      // Fallback: Create locally
      const localNew = {
        id: `HRS-00${horses.length + 1}`,
        ...payload,
        wins: 0,
        races: 0,
        earnings: '0 VND',
        currentJockey: null,
        lastRace: 'Mới đăng ký'
      }
      setHorses([...horses, localNew])
      alert('⚠️ Đăng ký ngựa thành công (Dữ liệu lưu tạm thời)')
    }

    setNewHorseModal(false)
    setName('')
    setAge('')
  }

  const openNewHorseModal = () => {
    setName('')
    setAge('')
    setBreed('Thoroughbred')
    setHealthStatus('ELIGIBLE')
    setImage('')
    setNewHorseModal(true)
  }

  const openEditModal = (horse) => {
    setSelectedHorse(horse)
    setName(horse.name)
    setAge(horse.age)
    setBreed(horse.breed)
    setHealthStatus(horse.healthStatus || 'ELIGIBLE')
    setImage(horse.image || '')
    setEditHorseModal(true)
  }

  const openHistoryModal = async (horse) => {
    setSelectedHorse(horse)
    setHistoryModal(true)
    setLoadingHistory(true)
    try {
      const history = await horseService.getHorseHistory(horse.id)
      setHorseHistory(history || [])
    } catch (err) {
      console.error('Failed to load history:', err)
      setHorseHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleEditHorse = async (e) => {
    e.preventDefault()
    if (!selectedHorse || !name || !age) return
    
    const payload = {
      name,
      age: parseInt(age, 10),
      breed,
      healthStatus: healthStatus
    }

    try {
      const updatedData = await ownerService.updateOwnerHorse(selectedHorse.id, payload)
      // Update local state
      setHorses(horses.map(h => {
        if (h.id === selectedHorse.id) {
          return {
            ...h,
            name: updatedData?.name ?? name,
            age: updatedData?.age ?? parseInt(age, 10),
            breed: updatedData?.breed ?? breed,
            healthStatus: updatedData?.healthStatus ?? healthStatus
          }
        }
        return h
      }))
      alert('✅ Cập nhật thông tin ngựa thành công!')
    } catch (err) {
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : (err.response?.data?.message || err.message)
      alert('❌ Lỗi khi cập nhật thông tin ngựa: ' + errorMessage)
    }

    setEditHorseModal(false)
  }

  const handleDeleteHorse = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngựa đua này không?')) {
      try {
        await ownerService.deleteOwnerHorse(id)
        alert('✅ Xóa ngựa đua thành công!')
        setHorses(horses.filter(h => h.id !== id))
        if (selectedHorse && selectedHorse.id === id) {
          setHistoryModal(false)
          setSelectedHorse(null)
        }
      } catch (err) {
        const errorMessage = typeof err.response?.data === 'string' 
          ? err.response.data 
          : (err.response?.data?.message || err.message)
        alert('❌ Lỗi khi xóa ngựa: ' + errorMessage)
      }
    }
  }

  const openRegisterModal = (horse) => {
    setSelectedHorse(horse)
    const availableRaces = ownerRaces.filter(r => r.status === 'upcoming')
    if (availableRaces.length > 0) {
      setSelectedRaceId(availableRaces[0].id)
    }
    setRegisterModal(true)
  }

  const handleRegisterToRace = async (e) => {
    e.preventDefault()
    if (!selectedHorse || !selectedRaceId) return
    
    try {
      await ownerService.registerHorseToRace({
        horseId: selectedHorse.id,
        raceScheduleId: selectedRaceId
      })
      
      setHorses(horses.map(h => {
        if (h.id === selectedHorse.id) {
          return { ...h, status: 'registered' }
        }
        return h
      }))
      alert(`✅ Đăng ký thành công ngựa "${selectedHorse.name}" vào giải đấu!`)
    } catch (err) {
      console.warn('Đăng ký giải đấu qua API lỗi, xử lý cục bộ:', err.message)
      // Fallback
      setHorses(horses.map(h => {
        if (h.id === selectedHorse.id) {
          return { ...h, status: 'registered' }
        }
        return h
      }))
      alert(`⚠️ Đăng ký thành công ngựa "${selectedHorse.name}" vào giải đấu (Lưu tạm thời)`)
    }
    
    setRegisterModal(false)
  }

  const filtered = horses.filter((horse) => {
    const query = localSearch.toLowerCase()
    const matchSearch = horse.name.toLowerCase().includes(query) || horse.breed.toLowerCase().includes(query)
    const matchStatus = statusFilter === 'ALL' || horse.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedHorses = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <div className="own-horses" style={{ padding: 20, color: '#aaa' }}>
        <h2>Chiến mã của Stable</h2>
        <p>Đang tải thông tin ngựa từ hệ thống...</p>
      </div>
    )
  }

  return (
    <div className="own-horses">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Quản lý thông tin ngựa 🐴</h1>
          <p className="owner-page-sub">Danh sách các chiến mã thuộc trang trại của bạn.</p>
        </div>
        <button className="owner-btn owner-btn--gold" onClick={openNewHorseModal}>
          + Đăng Ký Ngựa Mới
        </button>
      </div>

      <div className="owner-filter-bar" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          className="owner-input"
          style={{ flex: 1, maxWidth: '400px' }}
          placeholder="Tìm theo tên ngựa hoặc giống loài..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
        <select 
          className="owner-select" 
          value={statusFilter} 
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ready">Sẵn sàng</option>
          <option value="registered">Đã đăng ký</option>
          <option value="gray">Đang nghỉ dưỡng</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: historyModal ? '1fr 340px' : '1fr', gap: '20px' }}>
        <div className="owner-card" style={{ overflow: 'hidden' }}>
          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Tên ngựa</th>
                  <th>Tuổi</th>
                  <th>Giống</th>
                  <th>Thành tích</th>
                  <th>Sức khỏe</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHorses.length > 0 ? (
                  paginatedHorses.map((horse) => (
                    <tr key={horse.id}>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{horse.name}</td>
                      <td>{horse.age} tuổi</td>
                      <td>{horse.breed}</td>
                      <td>{horse.wins} Thắng / {horse.races} Đua</td>
                      <td>
                        {horse.healthStatus === 'ELIGIBLE' ? 'Khỏe mạnh' : 
                         horse.healthStatus === 'SUSPENDED' ? 'Bị đình chỉ' : 
                         horse.healthStatus === 'INJURED' ? 'Bị chấn thương' : 
                         horse.healthStatus === 'SICK' ? 'Bị ốm' : (horse.healthStatus || 'N/A')}
                      </td>
                      <td>
                        <span className={`owner-badge owner-badge--${
                          horse.status === 'ready' ? 'green' : horse.status === 'registered' ? 'gold' : 'gray'
                        }`}>
                          {horse.status === 'ready' ? 'Sẵn sàng' : horse.status === 'registered' ? 'Đã đăng ký' : 'Đang nghỉ dưỡng'}
                        </span>
                      </td>
                      <td>
                        <div className="owner-table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="owner-btn owner-btn--ghost owner-btn--sm"
                            onClick={() => openHistoryModal(horse)}
                          >
                            Chi tiết
                          </button>
                          <button 
                            className="owner-btn owner-btn--ghost owner-btn--sm"
                            disabled={horse.status === 'registered'}
                            onClick={() => openEditModal(horse)}
                          >
                            Chỉnh sửa
                          </button>
                          <button 
                            className="owner-btn owner-btn--danger owner-btn--sm"
                            onClick={() => handleDeleteHorse(horse.id)}
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
                      Không tìm thấy ngựa phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#aaa' }}>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)} trong tổng số {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="owner-btn owner-btn--ghost owner-btn--sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} className={`owner-btn owner-btn--sm ${currentPage === page ? 'owner-btn--gold' : 'owner-btn--ghost'}`} onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button className="owner-btn owner-btn--ghost owner-btn--sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Sau</button>
              </div>
            </div>
          )}
        </div>

        {historyModal && selectedHorse && (
          <div className="owner-card" style={{ height: 'fit-content' }}>
            <div className="owner-card-head">
              <h3>Chi tiết Ngựa</h3>
              <button className="owner-btn owner-btn--ghost owner-btn--sm" onClick={() => setHistoryModal(false)}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <img 
                  src={selectedHorse.image || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'} 
                  alt={selectedHorse.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '2px', color: '#fff' }}>{selectedHorse.name}</h4>
              <p style={{ margin: '0 0 20px', color: '#d4af37', fontSize: '13px', letterSpacing: '0.05em' }}>{selectedHorse.breed}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', fontSize: '13px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', color: '#ccc' }}>
                <div style={{ color: '#888' }}>Tuổi:</div><div>{selectedHorse.age} tuổi</div>
                <div style={{ color: '#888' }}>Sức khỏe:</div><div>{selectedHorse.healthStatus === 'ELIGIBLE' ? 'Khỏe mạnh' : selectedHorse.healthStatus === 'SUSPENDED' ? 'Bị đình chỉ' : selectedHorse.healthStatus === 'INJURED' ? 'Bị chấn thương' : selectedHorse.healthStatus === 'SICK' ? 'Bị ốm' : (selectedHorse.healthStatus || 'Khỏe mạnh')}</div>
                <div style={{ color: '#888' }}>Trạng thái:</div>
                <div>
                  <span className={`owner-badge owner-badge--${selectedHorse.status === 'ready' ? 'green' : selectedHorse.status === 'registered' ? 'gold' : 'gray'}`}>
                    {selectedHorse.status === 'ready' ? 'Sẵn sàng' : selectedHorse.status === 'registered' ? 'Đã đăng ký' : 'Đang nghỉ dưỡng'}
                  </span>
                </div>
                <div style={{ color: '#888' }}>Thành tích:</div><div style={{ color: '#4ade80' }}>{selectedHorse.wins} Thắng / {selectedHorse.races} Đua</div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h5 style={{ color: '#d4af37', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lịch sử thi đấu</h5>
                {loadingHistory ? (
                  <div style={{ fontSize: '12px', color: '#aaa' }}>Đang tải lịch sử...</div>
                ) : horseHistory.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#aaa', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                    Chưa có lịch sử thi đấu.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {horseHistory.map((race, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #d4af37' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: '#fff' }}>{race.raceName || `Trận #${race.raceId}`}</strong>
                          <span style={{ fontSize: '12px', color: race.placement === 1 ? '#4ade80' : '#aaa' }}>Hạng {race.placement}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>TG: {race.completionTime}s</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Horse Form */}
      {newHorseModal && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Đăng ký tài khoản ngựa tham gia hệ thống</h2>
              <button className="owner-modal-close" onClick={() => setNewHorseModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddHorse}>
              <div className="owner-modal-body">
                <div className="owner-form-grid">
                  <div className="owner-form-group full">
                    <label className="owner-label">Tên chiến mã</label>
                    <input
                      type="text"
                      className="owner-input"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Xích Thố Vương"
                    />
                  </div>
                  <div className="owner-form-group">
                    <label className="owner-label">Tuổi</label>
                    <input
                      type="number"
                      className="owner-input"
                      required
                      min="2"
                      max="15"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="owner-form-group">
                    <label className="owner-label">Giống ngựa</label>
                    <input
                      type="text"
                      className="owner-input"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </div>

                  <div className="owner-form-group full">
                    <label className="owner-label">Link ảnh ngựa (Tùy chọn)</label>
                    <input
                      type="text"
                      className="owner-input"
                      placeholder="Nhập URL hình ảnh..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>

                  <div className="owner-form-group full">
                    <label className="owner-label">Tình trạng Sức khỏe</label>
                    <select
                      className="owner-select"
                      value={healthStatus}
                      onChange={(e) => setHealthStatus(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="ELIGIBLE">Khỏe mạnh</option>
                      <option value="SUSPENDED">Bị đình chỉ</option>
                      <option value="INJURED">Bị chấn thương</option>
                      <option value="SICK">Bị ốm</option>
                    </select>
                  </div>

                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setNewHorseModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Horse Form */}
      {editHorseModal && selectedHorse && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Cập nhật thông tin chiến mã</h2>
              <button className="owner-modal-close" onClick={() => setEditHorseModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditHorse}>
              <div className="owner-modal-body">
                <div className="owner-form-grid">
                  <div className="owner-form-group full">
                    <label className="owner-label">Tên chiến mã</label>
                    <input
                      type="text"
                      className="owner-input"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="owner-form-group">
                    <label className="owner-label">Tuổi</label>
                    <input
                      type="number"
                      className="owner-input"
                      required
                      min="2"
                      max="15"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="owner-form-group">
                    <label className="owner-label">Giống ngựa</label>
                    <input
                      type="text"
                      className="owner-input"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </div>
                  
                  <div className="owner-form-group full">
                    <label className="owner-label">Link ảnh ngựa (Tùy chọn)</label>
                    <input
                      type="text"
                      className="owner-input"
                      placeholder="Nhập URL hình ảnh..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>

                  <div className="owner-form-group full">
                    <label className="owner-label">Tình trạng Sức khỏe</label>
                    <select
                      className="owner-select"
                      value={healthStatus}
                      onChange={(e) => setHealthStatus(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="ELIGIBLE">Khỏe mạnh</option>
                      <option value="SUSPENDED">Bị đình chỉ</option>
                      <option value="INJURED">Bị chấn thương</option>
                      <option value="SICK">Bị ốm</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setEditHorseModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Horse to Tournament */}
      {registerModal && selectedHorse && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Đăng ký giải đấu cho {selectedHorse.name}</h2>
              <button className="owner-modal-close" onClick={() => setRegisterModal(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterToRace}>
              <div className="owner-modal-body">
                <div className="owner-form-group full" style={{ marginBottom: 16 }}>
                  <label className="owner-label">Chọn Giải Đấu đang mở</label>
                  <select 
                    className="owner-select" 
                    style={{ width: '100%', marginTop: 8 }}
                    value={selectedRaceId}
                    onChange={(e) => setSelectedRaceId(e.target.value)}
                  >
                    {ownerRaces.filter(r => r.status === 'upcoming').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} - ({r.distance} | Thưởng: {r.prizePool})
                      </option>
                    ))}
                    {ownerRaces.filter(r => r.status === 'upcoming').length === 0 && (
                      <option value="">Không có giải đấu nào đang mở đăng ký</option>
                    )}
                  </select>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 12, fontSize: 13 }}>
                  <p style={{ margin: '0 0 8px' }}><strong>Lưu ý đăng ký:</strong></p>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>Phí tham gia giải đấu: 10,000,000 VND sẽ trừ vào tài khoản stable.</li>
                    <li>Chiến mã cần ở trạng thái Sẵn sàng và không có chấn thương.</li>
                    <li>Ban tổ chức sẽ phê duyệt hồ sơ trong vòng 24 giờ.</li>
                  </ul>
                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setRegisterModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold" disabled={!selectedRaceId}>
                  Xác Nhận Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History panel now integrated in grid */}
    </div>
  )
}
