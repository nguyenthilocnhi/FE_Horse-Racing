import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as tournamentService from '../../../services/tournamentService'
import * as horseService from '../../../services/horseService'
import * as adminAccountService from '../../../services/adminAccountService'
import './RaceManagement.css'

export default function RaceManagement() {
  const [races, setRaces] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [jockeysList, setJockeysList] = useState([])
  const [horsesList, setHorsesList] = useState([])
  const [loading, setLoading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingRace, setEditingRace] = useState(null)
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState('')
  const [refereesList, setRefereesList] = useState([])
  
  const { searchQuery = '' } = useOutletContext() || {}

  // Create/Edit Race Form state
  const [formData, setFormData] = useState({
    name: '',
    tournamentId: '',
    date: '',
    time: '',
    distance: '1600m',
    status: 'scheduled',
    refereeId: ''
  })

  // Round Arrangement State
  const [arrangingRace, setArrangingRace] = useState(null)
  const [rounds, setRounds] = useState({}) // maps raceId -> list of rounds
  const [activeRoundIndex, setActiveRoundIndex] = useState(0)

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Tournaments
      const tourns = await tournamentService.getTournaments()
      const mappedTournaments = (tourns || []).map(t => ({
        id: t.id,
        name: t.name || '',
        location: t.location || '',
        startDate: t.startDate || '',
        endDate: t.endDate || '',
        status: t.status ? t.status.toLowerCase() : 'draft'
      }))
      setTournaments(mappedTournaments)

      // 2. Fetch schedules for each tournament
      let allRaces = []
      for (const t of mappedTournaments) {
        try {
          const res = await tournamentService.getTournamentSchedule(t.id)
          const schedules = res?.data || res || []
          const mappedRaces = schedules.map(r => {
            let statusVal = 'scheduled'
            if (r.status === 'RUNNING' || r.status === 'ONGOING') statusVal = 'ongoing'
            else if (r.status === 'COMPLETED') statusVal = 'completed'
            else if (r.status === 'CANCELLED') statusVal = 'cancelled'

            return {
              id: r.id?.toString() || '',
              name: r.raceName || r.name || `Race #${r.id}`,
              tournament: t.name,
              tournamentId: t.id,
              date: r.raceDate || r.startTime?.split('T')[0] || '',
              time: r.startTime?.split('T')[1]?.substring(0, 5) || '',
              distance: r.distance || '1600m',
              status: statusVal,
              horses: r.raceParticipationList?.length || 0,
              refereeId: r.refereeId || r.referee?.id || '',
              refereeName: r.refereeName || r.referee?.fullName || '',
              rawRace: r
            }
          })
          allRaces = [...allRaces, ...mappedRaces]
        } catch (err) {
          console.error(`Failed to load schedules for tournament ${t.id}:`, err)
        }
      }
      setRaces(allRaces)

      // 3. Fetch Jockeys, Referees & Horses for arranging lanes
      const allAccounts = await adminAccountService.getAllAccounts()
      setJockeysList((allAccounts || []).filter(u => u.role === 'JOCKEY'))
      setRefereesList((allAccounts || []).filter(u => u.role === 'REFEREE' || u.role === 'RACE_REFEREE'))
      
      const horseList = await horseService.getHorses()
      setHorsesList(horseList || [])

    } catch (err) {
      console.error("Failed to load races/tournaments data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const filteredRaces = races.filter(race => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = 
      race.name.toLowerCase().includes(q) || 
      race.tournament.toLowerCase().includes(q) ||
      race.id.toLowerCase().includes(q)
      
    const matchesTournament = selectedTournamentFilter
      ? race.tournamentId?.toString() === selectedTournamentFilter.toString()
      : true
      
    return matchesSearch && matchesTournament
  })

  // Initialize rounds for a race if not exists
  const openArrangement = (race) => {
    setArrangingRace(race)
    setActiveRoundIndex(0)
    
    if (!rounds[race.id]) {
      const initialRoundsForRace = [
        {
          name: 'Vòng loại 1',
          lanes: Array.from({ length: 8 }, (_, i) => ({
            lane: i + 1,
            horseId: '',
            jockeyId: ''
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
    setFormData({
      name: '',
      tournamentId: tournaments[0]?.id?.toString() || '',
      date: '',
      time: '',
      distance: '1600m',
      status: 'scheduled',
      refereeId: ''
    })
    setShowForm(true)
  }

  const handleOpenEdit = (race) => {
    setEditingRace(race)
    setFormData({
      name: race.name,
      tournamentId: race.tournamentId?.toString() || '',
      date: race.date,
      time: race.time,
      distance: race.distance,
      status: race.status,
      refereeId: race.refereeId?.toString() || ''
    })
    setShowForm(true)
  }

  const handleCancelRace = async (id, tournamentId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy cuộc đua này?')) {
      try {
        await tournamentService.cancelRaceSchedule(tournamentId, id)
        alert('Hủy cuộc đua thành công!')
        fetchAllData()
      } catch (err) {
        alert('Không thể hủy cuộc đua: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const handleSaveRace = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.tournamentId || !formData.date || !formData.time) {
      alert('Vui lòng điền đầy đủ thông tin cuộc đua!')
      return
    }

    const startStr = `${formData.date}T${formData.time}:00`
    
    // Construct local end time strictly on the same date to satisfy backend validation
    const [hours, minutes] = formData.time.split(':').map(Number)
    let endHours = hours + 2
    if (endHours >= 24) {
      endHours = 23
    }
    const endHoursStr = String(endHours).padStart(2, '0')
    const endMinutesStr = String(minutes).padStart(2, '0')
    const endStr = `${formData.date}T${endHoursStr}:${endMinutesStr}:00`

    const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())

    try {
      if (editingRace) {
        // Edit mode
        await tournamentService.updateRaceSchedule(editingRace.tournamentId, editingRace.id, {
          startTime: startStr,
          endTime: endStr,
          participationIds: editingRace.rawRace?.participationIds || [],
          refereeId: formData.refereeId ? parseInt(formData.refereeId) : null
        })
        alert('Cập nhật cuộc đua thành công!')
      } else {
        // Add mode
        await tournamentService.createRaceSchedule(formData.tournamentId, {
          name: formData.name,
          raceDate: formData.date,
          location: selectedT?.location || 'Sân đua chính',
          startTime: startStr,
          endTime: endStr,
          refereeId: formData.refereeId ? parseInt(formData.refereeId) : null
        })
        alert('Tạo cuộc đua thành công!')
      }
      setShowForm(false)
      fetchAllData()
    } catch (err) {
      alert('Thao tác thất bại: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleSaveArrangement = () => {
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
    alert('Sắp xếp vòng đua và làn chạy đã được lưu thành công (tạm thời)!')
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

      <div className="admin-filters-bar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Lọc theo Giải đấu</label>
          <select 
            className="admin-select"
            value={selectedTournamentFilter}
            onChange={(e) => setSelectedTournamentFilter(e.target.value)}
            style={{ minWidth: '220px', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="">-- Tất cả giải đấu --</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
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
                disabled={!!editingRace}
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
                disabled={!!editingRace}
                value={formData.tournamentId}
                onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">Chọn giải đấu...</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Cự ly chạy</label>
              <select 
                className="admin-select"
                disabled={!!editingRace}
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="1000m">1000m</option>
                <option value="1200m">1200m</option>
                <option value="1400m">1400m</option>
                <option value="1600m">1600m</option>
                <option value="1800m">1800m</option>
                <option value="2000m">2000m</option>
                <option value="2400m">2400m</option>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Phân công Trọng tài</label>
              <select 
                className="admin-select"
                value={formData.refereeId}
                onChange={(e) => setFormData({ ...formData, refereeId: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">-- Chưa phân công --</option>
                {refereesList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.fullName || r.name || r.userName} (Kinh nghiệm: {r.experienceYears || '0'} năm)
                  </option>
                ))}
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

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Đang tải lịch trình cuộc đua...</div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên cuộc đua</th>
                  <th>Giải đấu</th>
                  <th>Trọng tài</th>
                  <th>Thời gian</th>
                  <th>Cự ly</th>
                  <th>Ngựa tham gia</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRaces.map((race) => (
                  <tr key={race.id}>
                    <td>#{race.id}</td>
                    <td><strong className="race-name" style={{ color: '#fff' }}>{race.name}</strong></td>
                    <td style={{ color: '#d4af37' }}>{race.tournament}</td>
                    <td style={{ color: race.refereeName ? '#fff' : '#666' }}>
                      👤 {race.refereeName || 'Chưa phân công'}
                    </td>
                    <td>📅 {race.date} · ⏰ {race.time}</td>
                    <td>{race.distance}</td>
                    <td>
                      <strong style={{ color: '#d4af37', marginRight: '4px' }}>{race.horses}</strong>
                      <span className="text-muted" style={{ fontSize: '12px' }}>ngựa</span>
                    </td>
                    <td><StatusBadge status={race.status} /></td>
                    <td>
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
                          <button 
                            type="button" 
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleCancelRace(race.id, race.tournamentId)}
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRaces.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Không tìm thấy cuộc đua phù hợp</td>
                  </tr>
                )}
              </tbody>
            </table>
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
                <span style={{ fontSize: '12px', color: '#d4af37' }}>{arrangingRace.name} (ID: {arrangingRace.id})</span>
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
                              {jockeysList.map(j => (
                                <option key={j.id} value={j.id}>{j.fullName || j.name || j.userName}</option>
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
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setArrangingRace(null)}>Hủy bộ</button>
              <button type="button" className="admin-btn admin-btn--gold" onClick={handleSaveArrangement}>Lưu sắp xếp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
