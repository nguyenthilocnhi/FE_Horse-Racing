import React, { useState, useEffect } from 'react'
import { races as initialRaces, tournaments as initialTournaments, mockJockeys } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
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
  const [races, setRaces] = useState(initialRaces)
  const [tournaments] = useState(initialTournaments)
  const [showForm, setShowForm] = useState(false)
  const [editingRace, setEditingRace] = useState(null)
  
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
    tournament: '',
    date: '',
    time: '',
    distance: '1600m',
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
    setFormData({
      name: '',
      tournament: tournaments[0]?.name || '',
      date: '',
      time: '',
      distance: '1600m',
      status: 'scheduled'
    })
    setShowForm(true)
  }

  const handleOpenEdit = (race) => {
    setEditingRace(race)
    setFormData({
      name: race.name,
      tournament: race.tournament,
      date: race.date,
      time: race.time,
      distance: race.distance,
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

  const handleSaveRace = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.tournament || !formData.date || !formData.time) {
      alert('Vui lòng điền đầy đủ thông tin cuộc đua!')
      return
    }

    if (editingRace) {
      setRaces(races.map(r => 
        r.id === editingRace.id ? { ...r, ...formData } : r
      ))
    } else {
      const newRace = {
        id: `R-${1000 + races.length + 5}`,
        ...formData,
        horses: 0
      }
      setRaces([newRace, ...races])
    }

    setShowForm(false)
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
                value={formData.tournament}
                onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
                style={{ width: '100%' }}
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Cự ly chạy</label>
              <select 
                className="admin-select"
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
        {races.map((race) => (
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
            <div className="race-card-horses">
              <strong>{race.horses}</strong>
              <span>ngựa tham gia</span>
            </div>
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
                  onClick={() => handleCancelRace(race.id)}
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
