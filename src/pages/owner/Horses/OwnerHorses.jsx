import React, { useState, useEffect } from 'react'
import { ownerHorses as initialHorses, ownerRaces } from '../../../data/ownerMockData'
import * as ownerService from '../../../services/ownerService'

export default function OwnerHorses() {
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)
  const [newHorseModal, setNewHorseModal] = useState(false)
  const [registerModal, setRegisterModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Form fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Đực')
  const [breed, setBreed] = useState('Thoroughbred')
  const [color, setColor] = useState('Hạt dẻ')
  
  // Registration Form fields
  const [selectedRaceId, setSelectedRaceId] = useState('')

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
          gender:        h.gender ?? 'Đực',
          wins:          h.wins ?? 0,
          races:         h.racesCount ?? h.races ?? 0,
          earnings:      h.earnings ?? '0 VND',
          status:        h.status ?? 'ready',
          currentJockey: h.jockeyName ?? null,
          color:         h.color ?? 'Hạt dẻ'
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
      healthStatus: 'ELIGIBLE'
    }

    try {
      const data = await ownerService.createOwnerHorse(payload)
      const newHorse = {
        id:            data?.id ?? data?.horseId ?? `HRS-00${horses.length + 1}`,
        name:          data?.name ?? name,
        age:           data?.age ?? parseInt(age, 10),
        gender:        data?.gender ?? gender,
        breed:         data?.breed ?? breed,
        color:         data?.color ?? color,
        wins:          0,
        races:         0,
        earnings:      '0 VND',
        status:        'ready',
        currentJockey: null
      }
      setHorses([...horses, newHorse])
      setSuccessMessage('Đăng ký ngựa mới thành công!')
      setShowSuccessPopup(true)
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
      setSuccessMessage('Đăng ký ngựa thành công (Dữ liệu lưu tạm thời)')
      setShowSuccessPopup(true)
    }

    setNewHorseModal(false)
    setName('')
    setAge('')
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
        horseId: Number(selectedHorse.id),
        raceScheduleId: Number(selectedRaceId)
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
        <button className="owner-btn owner-btn--gold" onClick={() => setNewHorseModal(true)}>
          + Đăng Ký Ngựa Mới
        </button>
      </div>

      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Chiến mã của Stable ({horses.length})</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Mã ngựa</th>
                <th>Tên ngựa</th>
                <th>Giống</th>
                <th>Tuổi / Giới</th>
                <th>Thành tích</th>
                <th>Trạng thái</th>
                <th>Jockey chính</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {horses.map((horse) => (
                <tr key={horse.id}>
                  <td>{horse.id}</td>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{horse.name}</td>
                  <td>{horse.breed}</td>
                  <td>{horse.age} tuổi / {horse.gender}</td>
                  <td>{horse.wins} Thắng / {horse.races} Đua</td>
                  <td>
                    <span className={`owner-badge owner-badge--${
                      horse.status === 'ready' ? 'green' : horse.status === 'registered' ? 'gold' : 'gray'
                    }`}>
                      {horse.status === 'ready' ? 'Sẵn sàng' : horse.status === 'registered' ? 'Đã đăng ký' : 'Đang nghỉ dưỡng'}
                    </span>
                  </td>
                  <td>{horse.currentJockey || 'Chưa chỉ định'}</td>
                  <td>
                    <div className="owner-table-actions">
                      <button 
                        className="owner-btn owner-btn--outline owner-btn--sm"
                        disabled={horse.status === 'registered'}
                        onClick={() => openRegisterModal(horse)}
                      >
                        Đăng ký giải đấu
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Success Popup */}
      {showSuccessPopup && (
        <div className="owner-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="owner-modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 style={{ color: '#d4af37', marginBottom: '15px', fontSize: '22px', fontWeight: 'bold' }}>Thành công!</h3>
            <p style={{ color: '#ccc', marginBottom: '25px', lineHeight: '1.6', fontSize: '15px' }}>
              {successMessage}
            </p>
            <button 
              onClick={() => setShowSuccessPopup(false)}
              className="owner-btn owner-btn--gold"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

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
                    <label className="owner-label">Giới tính</label>
                    <select className="owner-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="Đực">Đực</option>
                      <option value="Cái">Cái</option>
                    </select>
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
                  <div className="owner-form-group">
                    <label className="owner-label">Màu sắc</label>
                    <input
                      type="text"
                      className="owner-input"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
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
    </div>
  )
}
