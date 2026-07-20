import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { races as initialRaces, tournaments as initialTournaments, mockJockeys } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule, createRaceSchedule, updateRaceSchedule } from '../../../services/tournamentService'
import { startRace, delayRace, reopenPrediction, publishRaceResult } from '../../../services/adminService'
import './RaceManagement.css'

// Default horses if localStorage is empty
const FALLBACK_HORSES = [
  { id: 1, name: 'Aurelius' },
  { id: 2, name: 'Midnight Star' },
  { id: 3, name: 'Velvet Thunder' },
  { id: 4, name: 'Storm Rider' },
  { id: 5, name: 'Thunder Bolt' },
  { id: 6, name: 'Golden Eagle' },
  { id: 7, name: 'Shadow Dancer' },
  { id: 8, name: 'Pegasus' }
]

export default function RaceManagement() {
  const [races, setRaces] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRace, setEditingRace] = useState(null)
  const [delayingRace, setDelayingRace] = useState(null)
  const [delayForm, setDelayForm] = useState({ reason: '', newStartTime: '', newEndTime: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  const { searchQuery = '' } = useOutletContext() || {}

  const fetchData = async () => {
    try {
      const tourRes = await getAllTournaments()
      const fetchedTournaments = tourRes.data || tourRes || []
      setTournaments(fetchedTournaments)

      if (fetchedTournaments && fetchedTournaments.length > 0) {
        const allRaces = []
        for (const t of fetchedTournaments) {
          try {
            const scheduleRes = await getTournamentSchedule(t.id)
            const schedules = scheduleRes.data || []
            const formattedSchedules = schedules.map(s => ({
              id: `R-${s.id}`,
              originalId: s.id,
              name: s.name,
              tournament: t.name,
              tournamentId: t.id,
              date: s.raceDate || (s.startTime ? s.startTime.split('T')[0] : 'N/A'),
              time: s.startTime ? s.startTime.split('T')[1].substring(0, 5) : '00:00',
              distance: '1600m', // Default
              status: s.status ? s.status.toLowerCase() : 'pending',
              horses: 0 // Default
            }))
            allRaces.push(...formattedSchedules)
          } catch (err) {
            console.error(`Error fetching schedules for tournament ${t.id}`, err)
          }
        }
        setRaces(allRaces)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredRaces = races
    .filter(race => {
      const globalQ = searchQuery.toLowerCase()
      const localQ = localSearchQuery.toLowerCase()
      
      const matchesGlobal = !globalQ || 
        race.name.toLowerCase().includes(globalQ) || 
        (race.tournament && race.tournament.toLowerCase().includes(globalQ)) ||
        race.id.toLowerCase().includes(globalQ)
        
      const matchesLocal = !localQ || 
        race.name.toLowerCase().includes(localQ) || 
        (race.tournament && race.tournament.toLowerCase().includes(localQ)) ||
        race.id.toLowerCase().includes(localQ)
        
      const matchesStatus = statusFilter === 'all' || (race.status && race.status.toLowerCase() === statusFilter.toLowerCase())
      
      return matchesGlobal && matchesLocal && matchesStatus
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`)
      } else if (sortOrder === 'oldest') {
        return new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`)
      } else if (sortOrder === 'az') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  
  // Horses list (load from localStorage if available)
  const [horsesList, setHorsesList] = useState(FALLBACK_HORSES)
  useEffect(() => {
    const stored = localStorage.getItem('mock_horses')
    if (stored) {
      try {
        setHorsesList(JSON.parse(stored))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Create/Edit Race Form state
  const [formData, setFormData] = useState({
    name: '',
    tournamentId: '',
    date: '',
    time: '',
    endTime: '',
    status: 'scheduled'
  })

  // Round Arrangement State
  const [arrangingRace, setArrangingRace] = useState(null)
  const [rounds, setRounds] = useState({}) // maps raceId -> list of rounds (each round has lanes)
  const [activeRoundIndex, setActiveRoundIndex] = useState(0)

  // Initialize rounds for a race if not exists
  const openArrangement = (race) => {
    setArrangingRace(race)
    setActiveRoundIndex(0)
    
    // If this race doesn't have rounds in state yet, initialize with default rounds
    if (!rounds[race.id]) {
      const initialRoundsForRace = [
        {
          name: 'Vòng loại 1',
          lanes: Array.from({ length: 8 }, (_, i) => ({
            lane: i + 1,
            horseId: i < 4 ? horsesList[i]?.id || '' : '',
            jockeyId: i < 4 ? mockJockeys[i]?.id || '' : ''
          }))
        },
        {
          name: 'Vòng Chung kết',
          lanes: Array.from({ length: 8 }, (_, i) => ({
            lane: i + 1,
            horseId: '',
            jockeyId: ''
          }))
        }
      ]
      setRounds(prev => ({
        ...prev,
        [race.id]: initialRoundsForRace
      }))
    }
  }

  const handleAddRound = () => {
    if (!arrangingRace) return
    const currentRounds = rounds[arrangingRace.id] || []
    const nextRound = {
      name: `Vòng ${currentRounds.length + 1}`,
      lanes: Array.from({ length: 8 }, (_, i) => ({
        lane: i + 1,
        horseId: '',
        jockeyId: ''
      }))
    }
    setRounds(prev => ({
      ...prev,
      [arrangingRace.id]: [...currentRounds, nextRound]
    }))
    setActiveRoundIndex(currentRounds.length)
  }

  const handleRemoveRound = (idx) => {
    if (!arrangingRace) return
    const currentRounds = rounds[arrangingRace.id] || []
    if (currentRounds.length <= 1) {
      alert('Phải có ít nhất 1 vòng đua!')
      return
    }
    const filtered = currentRounds.filter((_, i) => i !== idx)
    setRounds(prev => ({
      ...prev,
      [arrangingRace.id]: filtered
    }))
    setActiveRoundIndex(Math.max(0, idx - 1))
  }

  const handleUpdateLane = (laneNum, field, value) => {
    if (!arrangingRace) return
    const raceId = arrangingRace.id
    const currentRounds = [...rounds[raceId]]
    const currentRound = { ...currentRounds[activeRoundIndex] }
    currentRound.lanes = currentRound.lanes.map(l => 
      l.lane === laneNum ? { ...l, [field]: value ? parseInt(value) || value : '' } : l
    )
    currentRounds[activeRoundIndex] = currentRound
    setRounds(prev => ({
      ...prev,
      [raceId]: currentRounds
    }))
  }

  // Handlers for Race Form
  const handleOpenAdd = () => {
    setEditingRace(null)
    const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE')
    setFormData({
      name: '',
      tournamentId: activeTournaments[0]?.id || '',
      date: '',
      time: '',
      endTime: '',
      status: 'scheduled'
    })
    setShowForm(true)
  }

  const handleOpenEdit = (race) => {
    setEditingRace(race)
    setFormData({
      name: race.name,
      tournamentId: race.tournamentId || '',
      date: race.date,
      time: race.time,
      endTime: '',
      status: race.status
    })
    setShowForm(true)
  }

  const handleCancelRace = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy cuộc đua này?')) {
      setRaces(races.map(r => 
        r.id === id ? { ...r, status: 'cancelled' } : r
      ))
    }
  }

  const handleStartRace = async (race) => {
    if (!window.confirm(`Bạn có chắc muốn BẮT ĐẦU cuộc đua: ${race.name}?`)) return
    setIsProcessing(true)
    try {
      await startRace(race.originalId, { conditionsConfirmed: true })
      alert('Đã bắt đầu cuộc đua!')
      fetchData()
    } catch (err) {
      alert('Lỗi bắt đầu cuộc đua: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePublish = async (race) => {
    if (!window.confirm(`Xác nhận CÔNG BỐ KẾT QUẢ cuộc đua: ${race.name}?`)) return
    setIsProcessing(true)
    try {
      await publishRaceResult(race.originalId)
      alert('Đã công bố kết quả!')
      fetchData()
    } catch (err) {
      alert('Lỗi công bố kết quả: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReopenPrediction = async (race) => {
    if (!window.confirm(`Mở lại cổng dự đoán cho cuộc đua: ${race.name}?`)) return
    setIsProcessing(true)
    try {
      await reopenPrediction(race.originalId, true)
      alert('Đã mở lại dự đoán!')
    } catch (err) {
      alert('Lỗi mở dự đoán: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsProcessing(false)
    }
  }

  const submitDelayRace = async (e) => {
    e.preventDefault()
    if (!delayForm.reason) {
      alert('Vui lòng nhập lý do hoãn!')
      return
    }
    setIsProcessing(true)
    try {
      let payload = { reason: delayForm.reason }
      if (delayForm.newStartTime && delayForm.newEndTime) {
        payload.newStartTime = new Date(delayForm.newStartTime).toISOString()
        payload.newEndTime = new Date(delayForm.newEndTime).toISOString()
      }
      await delayRace(delayingRace.originalId, payload)
      alert('Đã hoãn cuộc đua thành công!')
      setDelayingRace(null)
      fetchData()
    } catch (err) {
      alert('Lỗi hoãn cuộc đua: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveRace = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.tournamentId || !formData.date || !formData.time || !formData.endTime) {
      alert('Vui lòng điền đầy đủ thông tin cuộc đua!')
      return
    }

    if (formData.name.trim().length < 4) {
      alert('Tên cuộc đua phải có ít nhất 4 kí tự')
      return
    }

    const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())
    if (selectedT && selectedT.startDate && selectedT.endDate) {
      const tStart = new Date(selectedT.startDate)
      tStart.setHours(0, 0, 0, 0)
      const tEnd = new Date(selectedT.endDate)
      tEnd.setHours(23, 59, 59, 999)

      const raceDateObj = new Date(formData.date)
      raceDateObj.setHours(0, 0, 0, 0)

      if (raceDateObj < tStart || raceDateObj > tEnd) {
        alert('Ngày đua không nằm trong thời gian bắt đầu và thời gian kết thúc của giải đấu')
        return
      }

      const raceStartObj = new Date(`${formData.date}T${formData.time}`)
      const raceEndObj = new Date(`${formData.date}T${formData.endTime}`)

      if (raceStartObj < tStart || raceStartObj > tEnd) {
        alert('Giờ xuất phát không nằm trong thời gian bắt đầu và thời gian kết thúc của giải đấu')
        return
      }

      if (raceEndObj < tStart || raceEndObj > tEnd) {
        alert('Giờ kết thúc không nằm trong thời gian bắt đầu và thời gian kết thúc của giải đấu')
        return
      }

      if (raceStartObj >= raceEndObj) {
        alert('Giờ kết thúc phải sau giờ xuất phát')
        return
      }
    }

    if (editingRace) {
      try {
        const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())
        const payload = {
          name: formData.name,
          raceDate: formData.date,
          location: selectedT ? selectedT.location : "Trường đua",
          startTime: `${formData.date}T${formData.time}:00.000Z`,
          endTime: `${formData.date}T${formData.endTime}:00.000Z`,
          status: formData.status.toUpperCase()
        }
        await updateRaceSchedule(formData.tournamentId, editingRace.originalId, payload)

        setRaces(races.map(r => 
          r.id === editingRace.id ? { ...r, ...formData, status: formData.status } : r
        ))
        setShowForm(false)
        alert('Cập nhật cuộc đua thành công!')
      } catch (error) {
        console.error(error)
        alert('Có lỗi xảy ra khi cập nhật cuộc đua!')
      }
    } else {
      try {
        const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())
        const payload = {
          name: formData.name,
          raceDate: formData.date,
          location: selectedT ? selectedT.location : "Trường đua",
          startTime: `${formData.date}T${formData.time}:00.000Z`,
          endTime: `${formData.date}T${formData.endTime}:00.000Z`,
          status: formData.status.toUpperCase()
        }
        
        const result = await createRaceSchedule(formData.tournamentId, payload)
        
        const newRace = {
          id: `R-${result.id}`,
          originalId: result.id,
          name: result.name,
          tournament: selectedT?.name,
          tournamentId: selectedT?.id,
          date: result.raceDate,
          time: result.startTime ? result.startTime.split('T')[1].substring(0, 5) : formData.time,
          distance: '1600m', // Default
          status: result.status ? result.status.toLowerCase() : formData.status,
          horses: 0
        }
        setRaces([newRace, ...races])
        setShowForm(false)
        alert('Tạo cuộc đua thành công!')
      } catch (error) {
        console.error(error)
        alert('Có lỗi xảy ra khi tạo cuộc đua!')
      }
    }
  }

  const handleSaveArrangement = () => {
    // Calculate total horses assigned in this arrangement across rounds
    if (!arrangingRace) return
    const raceId = arrangingRace.id
    const raceRounds = rounds[raceId] || []
    
    // Count unique horses in this race
    const uniqueHorses = new Set()
    raceRounds.forEach(r => {
      r.lanes.forEach(l => {
        if (l.horseId) uniqueHorses.add(l.horseId)
      })
    })

    setRaces(races.map(r => 
      r.id === raceId ? { ...r, horses: uniqueHorses.size } : r
    ))

    setArrangingRace(null)
    alert('Sắp xếp vòng đua và cuốc đua đã được lưu thành công!')
  }

  return (
    <div className="race-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Cuộc đua</h1>
          <p className="admin-page-sub">Lập lịch các cuộc đua, cấu hình cự ly, chia vòng đấu và gán làn chạy</p>
        </div>
        <button 
          type="button" 
          className="admin-btn admin-btn--gold" 
          onClick={handleOpenAdd}
        >
          + Tạo race
        </button>
      </div>

      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          className="admin-input" 
          placeholder="Tìm theo tên hoặc địa điểm..." 
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: '300px' }}
        />
        <select 
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả Trạng thái</option>
          <option value="pending">Chờ xử lý (Pending)</option>
          <option value="delayed">Bị hoãn (Delayed)</option>
          <option value="running">Đang chạy (Running)</option>
          <option value="ongoing">Đang diễn ra (Ongoing)</option>
          <option value="completed">Đã hoàn thành (Completed)</option>
          <option value="cancelled">Đã hủy (Cancelled)</option>
        </select>
        <select 
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Sắp xếp: Mới nhất</option>
          <option value="oldest">Sắp xếp: Cũ nhất</option>
          <option value="az">Sắp xếp: Từ A đến Z</option>
        </select>
      </div>

      {showForm && (
        <div className="admin-card race-form-card" style={{ border: '1px solid rgba(212,175,55,0.15)', marginBottom: '24px' }}>
          <div className="admin-card-head">
            <h3>{editingRace ? `Sửa cuộc đua: ${editingRace.name}` : 'Tạo cuộc đua mới'}</h3>
            <button 
              type="button" 
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSaveRace} className="admin-card-body race-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên cuộc đua (Race name)</label>
              <input 
                required
                className="admin-input" 
                placeholder="Ví dụ: Derby nước rút..." 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thuộc Giải đấu</label>
              <select 
                className="admin-select"
                value={formData.tournamentId}
                onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                style={{ width: '100%' }}
              >
                {tournaments.filter(t => t.status === 'ACTIVE').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày đua</label>
              <input 
                required
                type="date"
                className="admin-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giờ xuất phát</label>
              <input 
                required
                type="time"
                className="admin-input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giờ kết thúc</label>
              <input 
                required
                type="time"
                className="admin-input"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
              <select 
                className="admin-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="scheduled">Đã lên lịch (Scheduled)</option>
                <option value="ongoing">Đang diễn ra (Ongoing)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
                <option value="cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', gridColumn: 'span 2', marginTop: '12px' }}>
              <button 
                type="button" 
                className="admin-btn admin-btn--ghost" 
                onClick={() => setShowForm(false)}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="admin-btn admin-btn--gold"
              >
                Lưu cuộc đua
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="race-cards-grid">
        {filteredRaces.map((race) => (
          <div key={race.id} className="admin-card race-card-item">
            <div className="race-card-top">
              <span className="race-card-id">{race.id}</span>
              <StatusBadge status={race.status} />
            </div>
            <h3>{race.name}</h3>
            <p className="race-card-tournament">{race.tournament}</p>
            <div className="race-card-meta">
              <span>📅 {race.date} · ⏰ {race.time}</span>
              <span>📏 Cự ly: {race.distance}</span>
            </div>
            {/* 
            <div className="race-card-horses">
              <strong>{race.horses}</strong>
              <span>ngựa tham gia</span>
            </div>
            */}
            <div className="admin-table-actions">
              <button 
                type="button" 
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => handleOpenEdit(race)}
              >
                Sửa
              </button>
              <button 
                type="button" 
                className="admin-btn admin-btn--outline admin-btn--sm"
                onClick={() => openArrangement(race)}
              >
                Sắp xếp cuốc/vòng
              </button>
              {race.status === 'scheduled' && (
                <>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    style={{ borderColor: '#22c55e', color: '#22c55e' }}
                    onClick={() => handleStartRace(race)}
                    disabled={isProcessing}
                  >
                    Bắt đầu
                  </button>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={() => {
                      setDelayingRace(race)
                      setDelayForm({ reason: '', newStartTime: '', newEndTime: '' })
                    }}
                    disabled={isProcessing}
                  >
                    Hoãn
                  </button>
                </>
              )}

              {race.status === 'delayed' && (
                <>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    style={{ borderColor: '#a855f7', color: '#a855f7' }}
                    onClick={() => handleReopenPrediction(race)}
                    disabled={isProcessing}
                  >
                    Mở lại dự đoán
                  </button>
                </>
              )}

              {race.status === 'completed' && (
                <button 
                  type="button" 
                  className="admin-btn admin-btn--gold admin-btn--sm"
                  onClick={() => handlePublish(race)}
                  disabled={isProcessing}
                >
                  Công bố KQ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delay Modal */}
      {delayingRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="admin-card" style={{ width: '400px', border: '1px solid #ef4444' }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#ef4444' }}>Hoãn cuộc đua: {delayingRace.name}</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setDelayingRace(null)}>✕</button>
            </div>
            <form onSubmit={submitDelayRace} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-muted" style={{ fontSize: '12px' }}>Lý do hoãn (*)</label>
                <textarea
                  className="admin-input"
                  required
                  value={delayForm.reason}
                  onChange={e => setDelayForm({ ...delayForm, reason: e.target.value })}
                  style={{ width: '100%', minHeight: '60px', marginTop: '4px' }}
                />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: '12px' }}>Thời gian dự kiến bắt đầu (Tùy chọn)</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={delayForm.newStartTime}
                  onChange={e => setDelayForm({ ...delayForm, newStartTime: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: '12px' }}>Thời gian dự kiến kết thúc (Tùy chọn)</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={delayForm.newEndTime}
                  onChange={e => setDelayForm({ ...delayForm, newEndTime: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setDelayingRace(null)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--danger" disabled={isProcessing}>Xác nhận Hoãn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Round Arrangement Modal */}
      {arrangingRace && (
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
          <div className="admin-card" style={{ width: '100%', maxWidth: '850px', border: '1px solid rgba(212,175,55,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-card-head" style={{ flexShrink: 0 }}>
              <div>
                <h3>Thiết lập vòng đua & làn chạy</h3>
                <span style={{ fontSize: '12px', color: '#d4af37' }}>{arrangingRace.name} ({arrangingRace.id})</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setArrangingRace(null)}>✕</button>
            </div>
            
            <div className="admin-card-body" style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {(rounds[arrangingRace.id] || []).map((round, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`admin-tab ${activeRoundIndex === idx ? 'is-active' : ''}`}
                      onClick={() => setActiveRoundIndex(idx)}
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      {round.name}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--sm admin-btn--outline" 
                    onClick={handleAddRound}
                  >
                    + Thêm vòng
                  </button>
                </div>
                { (rounds[arrangingRace.id] || []).length > 1 && (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => handleRemoveRound(activeRoundIndex)}
                  >
                    Xóa vòng này
                  </button>
                ) }
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên vòng đấu</label>
                    <input 
                      className="admin-input"
                      value={rounds[arrangingRace.id]?.[activeRoundIndex]?.name || ''}
                      onChange={(e) => {
                        const raceId = arrangingRace.id
                        const rIndex = activeRoundIndex
                        const updated = [...rounds[raceId]]
                        updated[rIndex].name = e.target.value
                        setRounds(prev => ({ ...prev, [raceId]: updated }))
                      }}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Làn (Lane)</th>
                        <th>Ngựa Đua (Horse)</th>
                        <th>Nài Ngựa (Jockey)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rounds[arrangingRace.id]?.[activeRoundIndex]?.lanes || []).map((laneInfo) => (
                        <tr key={laneInfo.lane}>
                          <td style={{ fontWeight: '700', color: '#d4af37', fontSize: '14px' }}>#{laneInfo.lane}</td>
                          <td>
                            <select
                              className="admin-select"
                              value={laneInfo.horseId}
                              onChange={(e) => handleUpdateLane(laneInfo.lane, 'horseId', e.target.value)}
                              style={{ width: '100%', minWidth: 'auto', padding: '6px 10px', fontSize: '12px' }}
                            >
                              <option value="">-- Chọn ngựa đua --</option>
                              {horsesList.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="admin-select"
                              value={laneInfo.jockeyId}
                              onChange={(e) => handleUpdateLane(laneInfo.lane, 'jockeyId', e.target.value)}
                              style={{ width: '100%', minWidth: 'auto', padding: '6px 10px', fontSize: '12px' }}
                            >
                              <option value="">-- Chọn Jockey --</option>
                              {mockJockeys.map(j => (
                                <option key={j.id} value={j.id}>{j.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="admin-card-head" style={{ flexShrink: 0, justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: 'none' }}>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setArrangingRace(null)}>Hủy bỏ</button>
              <button type="button" className="admin-btn admin-btn--gold" onClick={handleSaveArrangement}>Lưu sắp xếp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
