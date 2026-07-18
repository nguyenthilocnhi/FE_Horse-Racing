import React, { useState, useEffect } from 'react'
import { ownerHorses as initialHorses, ownerRaces } from '../../../data/ownerMockData'
import * as ownerService from '../../../services/ownerService'
import { useAuth } from '../../../contexts/AuthContext'
import { registrations as adminInitialRegistrations } from '../../../data/adminMockData'
import * as tournamentService from '../../../services/tournamentService'

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
  const [availableRaces, setAvailableRaces] = useState([])
  const [loadingRaces, setLoadingRaces] = useState(false)
  const [medicalCertificate, setMedicalCertificate] = useState('')

  // New Horse Attachment states
  const [birthCertificate, setBirthCertificate] = useState('')
  const [horseImage, setHorseImage] = useState('')

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setter(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const { user } = useAuth()

  // ── Fetch/Load horses ──
  useEffect(() => {
    if (!user) return

    async function loadHorses() {
      const storageKey = `owner_horses_${user.email || 'giathanh.owner@gmail.com'}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          setHorses(JSON.parse(stored))
          setLoading(false)
          return
        } catch (e) {
          console.error('Failed to parse owner_horses from localStorage:', e)
        }
      }

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
        localStorage.setItem(storageKey, JSON.stringify(formatted))
      } catch (err) {
        console.warn('API getOwnerHorses lỗi, dùng dữ liệu giả lập:', err.message)
        // Fallback to initial mock data during dev
        setHorses(initialHorses)
        localStorage.setItem(storageKey, JSON.stringify(initialHorses))
      } finally {
        setLoading(false)
      }
    }
    loadHorses()
  }, [user])

  useEffect(() => {
    if (user && horses.length > 0) {
      const storageKey = `owner_horses_${user.email || 'giathanh.owner@gmail.com'}`
      localStorage.setItem(storageKey, JSON.stringify(horses))
    }
  }, [horses, user])

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
        currentJockey: null,
        birthCertificateUrl: birthCertificate || '',
        horseImageUrl: horseImage || ''
      }
      setHorses([...horses, newHorse])
      setSuccessMessage('Thêm ngựa mới thành công!')
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
        lastRace: 'Mới đăng ký',
        birthCertificateUrl: birthCertificate || '',
        horseImageUrl: horseImage || ''
      }
      setHorses([...horses, localNew])
      setSuccessMessage('Thêm ngựa mới thành công (Dữ liệu lưu tạm thời)')
      setShowSuccessPopup(true)
    }

    setNewHorseModal(false)
    setName('')
    setAge('')
    setBirthCertificate('')
    setHorseImage('')
  }

  const handleToggleStatus = async (horseId, currentStatus) => {
    const nextStatus = currentStatus === 'ready' ? 'resting' : 'ready'
    try {
      await ownerService.updateOwnerHorse(horseId, { status: nextStatus })
      setHorses(horses.map(h => h.id === horseId ? { ...h, status: nextStatus } : h))
      alert('Cập nhật trạng thái ngựa thành công!')
    } catch (e) {
      console.warn('API updateOwnerHorse lỗi, xử lý cục bộ:', e.message)
      setHorses(horses.map(h => h.id === horseId ? { ...h, status: nextStatus } : h))
      alert('Cập nhật trạng thái ngựa thành công (Lưu tạm thời)')
    }
  }

  const openRegisterModal = async (horse) => {
    setSelectedHorse(horse)
    setRegisterModal(true)
    setLoadingRaces(true)
    
    try {
      const tournamentsList = await tournamentService.getTournaments()
      const activeTournaments = tournamentsList.filter(t => t.status === 'ACTIVE')
      
      const allSchedules = []
      for (const tour of activeTournaments) {
        try {
          const scheduleRes = await tournamentService.getTournamentSchedule(tour.id)
          const schedules = Array.isArray(scheduleRes) ? scheduleRes : scheduleRes?.data ?? []
          
          schedules.forEach(s => {
            if (s.status === 'PENDING') {
              allSchedules.push({
                id: s.id,
                name: s.name,
                tournamentName: tour.name,
                distance: '1600m',
                prizePool: '500,000,000 VND'
              })
            }
          })
        } catch (err) {
          console.warn(`Lỗi load tournament ${tour.id}:`, err)
        }
      }

      if (allSchedules.length > 0) {
        setAvailableRaces(allSchedules)
        setSelectedRaceId(String(allSchedules[0].id))
      } else {
        // Fallback
        const storedRaces = localStorage.getItem('owner_races')
        const currentRaces = storedRaces ? JSON.parse(storedRaces) : ownerRaces
        const fallbacks = currentRaces.filter(r => r.status === 'upcoming')
        setAvailableRaces(fallbacks)
        if (fallbacks.length > 0) {
          setSelectedRaceId(String(fallbacks[0].id))
        }
      }
    } catch (e) {
      console.warn('Lỗi load giải đấu:', e)
      const storedRaces = localStorage.getItem('owner_races')
      const currentRaces = storedRaces ? JSON.parse(storedRaces) : ownerRaces
      const fallbacks = currentRaces.filter(r => r.status === 'upcoming')
      setAvailableRaces(fallbacks)
      if (fallbacks.length > 0) {
        setSelectedRaceId(String(fallbacks[0].id))
      }
    } finally {
      setLoadingRaces(false)
    }
  }

  const handleRegisterToRace = async (e) => {
    e.preventDefault()
    if (!selectedHorse || !selectedRaceId) return

    const storedRaces = localStorage.getItem('owner_races')
    const currentRaces = storedRaces ? JSON.parse(storedRaces) : ownerRaces
    const raceObj = availableRaces.find(r => String(r.id) === String(selectedRaceId))
    const raceName = raceObj ? raceObj.name : 'Đua Tốc Độ Mùa Hè 2026'

    const newReg = {
      id: `REG-${Math.floor(500 + Math.random() * 500)}`,
      horse: selectedHorse.name,
      owner: user?.name || 'Lý Gia Thành',
      race: raceName,
      submitted: new Date().toISOString().split('T')[0],
      status: 'pending',
      birthCertificateUrl: selectedHorse.birthCertificateUrl || '',
      horseImageUrl: selectedHorse.horseImageUrl || '',
      medicalCertificateUrl: medicalCertificate || ''
    }
    
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

      // Sync mock registrations and races
      const storedRegs = localStorage.getItem('mock_registrations')
      const currentRegs = storedRegs ? JSON.parse(storedRegs) : adminInitialRegistrations
      localStorage.setItem('mock_registrations', JSON.stringify([newReg, ...currentRegs]))

      const updatedRaces = currentRaces.map(r => {
        if (String(r.id) === String(selectedRaceId)) {
          return {
            ...r,
            status: 'registered',
            registeredHorse: selectedHorse.name
          }
        }
        return r
      })
      localStorage.setItem('owner_races', JSON.stringify(updatedRaces))

      // Dispatch event to sync immediately in this window
      window.dispatchEvent(new Event('storage'))

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

      // Sync mock registrations and races (in case of API error)
      const storedRegs = localStorage.getItem('mock_registrations')
      const currentRegs = storedRegs ? JSON.parse(storedRegs) : adminInitialRegistrations
      localStorage.setItem('mock_registrations', JSON.stringify([newReg, ...currentRegs]))

      const updatedRaces = currentRaces.map(r => {
        if (String(r.id) === String(selectedRaceId)) {
          return {
            ...r,
            status: 'registered',
            registeredHorse: selectedHorse.name
          }
        }
        return r
      })
      localStorage.setItem('owner_races', JSON.stringify(updatedRaces))

      // Dispatch event to sync immediately in this window
      window.dispatchEvent(new Event('storage'))

      alert(`⚠️ Đăng ký thành công ngựa "${selectedHorse.name}" vào giải đấu (Lưu tạm thời)`)
    }
    
    setMedicalCertificate('')
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
          + Thêm Ngựa Mới
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
                    <div className="owner-table-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {horse.status === 'registered' ? (
                        <span style={{ color: '#666', fontSize: '13px', fontStyle: 'italic', paddingLeft: '8px' }}>
                          Đã đăng ký
                        </span>
                      ) : (
                        <>
                          <button 
                            className="owner-btn owner-btn--outline owner-btn--sm"
                            onClick={() => openRegisterModal(horse)}
                          >
                            Đăng ký giải đấu
                          </button>
                          <button 
                            className="owner-btn owner-btn--ghost owner-btn--sm"
                            onClick={() => handleToggleStatus(horse.id, horse.status)}
                            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#aaa' }}
                          >
                            {horse.status === 'ready' ? 'Nghỉ dưỡng' : 'Kích hoạt'}
                          </button>
                        </>
                      )}
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
              <h2>Thêm ngựa mới</h2>
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

                  <div className="owner-form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div>
                      <label className="owner-label" style={{ display: 'block', marginBottom: '8px' }}>Giấy khai sinh (Ảnh)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setBirthCertificate)}
                        style={{ display: 'block', width: '100%', fontSize: '12px', color: '#aaa' }}
                      />
                      {birthCertificate && (
                        <div style={{ marginTop: '8px' }}>
                          <img src={birthCertificate} alt="Khai sinh Preview" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="owner-label" style={{ display: 'block', marginBottom: '8px' }}>Ảnh chiến mã</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setHorseImage)}
                        style={{ display: 'block', width: '100%', fontSize: '12px', color: '#aaa' }}
                      />
                      {horseImage && (
                        <div style={{ marginTop: '8px' }}>
                          <img src={horseImage} alt="Ảnh ngựa Preview" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setNewHorseModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Thêm Ngựa
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
                    disabled={loadingRaces}
                  >
                    {loadingRaces ? (
                      <option value="">Đang tải danh sách từ máy chủ...</option>
                    ) : (
                      availableRaces.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} - ({r.tournamentName || 'Giải đấu'})
                        </option>
                      ))
                    )}
                    {!loadingRaces && availableRaces.length === 0 && (
                      <option value="">Không có giải đấu nào đang mở đăng ký</option>
                    )}
                  </select>
                </div>
                <div className="owner-form-group full" style={{ marginBottom: 16 }}>
                  <label className="owner-label" style={{ display: 'block', marginBottom: '8px' }}>Giấy kiểm tra y tế (Ảnh chứng nhận)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setMedicalCertificate)}
                    style={{ display: 'block', width: '100%', fontSize: '12px', color: '#aaa' }}
                  />
                  {medicalCertificate && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={medicalCertificate} alt="Y tế Preview" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px' }}><strong>Lưu ý đăng ký:</strong></p>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
