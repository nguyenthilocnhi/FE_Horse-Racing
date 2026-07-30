import React, { useState, useEffect } from 'react'
import { getAllRegistrations } from '../../../services/adminService'
import { getRaces, getRaceParticipations } from '../../../services/raceService'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RegistrationApproval.css'

const LANE_COLORS = [
  '#EF4444', // Làn 1 - Đỏ
  '#3B82F6', // Làn 2 - Xanh dương
  '#10B981', // Làn 3 - Xanh lá
  '#F59E0B', // Làn 4 - Vàng cam
  '#8B5CF6', // Làn 5 - Tím
  '#EC4899', // Làn 6 - Hồng
  '#06B6D4', // Làn 7 - Xanh lơ
  '#F97316', // Làn 8 - Cam
]

export default function RegistrationApproval() {
  const [races, setRaces] = useState([])
  const [selectedRaceId, setSelectedRaceId] = useState('')
  const [participants, setParticipants] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [viewMode, setViewMode] = useState('both') // 'both' | 'diagram' | 'table'

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const res = await getRaces()
        const fetchedRaces = res?.data || res || []
        const mappedRaces = fetchedRaces.map(r => ({
          id: r.id,
          name: r.name,
          tournament: r.tournament?.name || 'Chưa cập nhật',
          date: r.startTime ? r.startTime.substring(0, 10) : 'Chưa cập nhật'
        }))
        setRaces(mappedRaces)
        if (mappedRaces.length > 0) {
          setSelectedRaceId(mappedRaces[0].id)
        }
      } catch (err) {
        console.error("Failed to fetch races:", err)
      }
    }
    fetchRaces()
  }, [])

  useEffect(() => {
    if (selectedRaceId) {
      loadRaceParticipants(selectedRaceId)
    }
  }, [selectedRaceId])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const loadRaceParticipants = async (raceId) => {
    try {
      const res = await getRaceParticipations(raceId)
      const data = res?.data || res || []
      
      const confirmed = data.filter(p => p.status === 'CONFIRMED' || p.laneNumber != null)

      let localSaved = []
      try {
        const localStr = localStorage.getItem(`lane_assignments_${raceId}`)
        if (localStr) localSaved = JSON.parse(localStr)
      } catch (e) {}

      // First pass: preserve existing lanes from backend or local storage
      const existingLanes = new Set()
      const initialMap = confirmed.map(p => {
        let laneVal = p.laneNumber
        if (laneVal == null) {
          const localMatch = localSaved.find(loc => String(loc.id) === String(p.id))
          if (localMatch && localMatch.lane != null) {
            laneVal = localMatch.lane
          }
        }
        if (laneVal != null) {
          existingLanes.add(laneVal)
        }
        return { ...p, tempLane: laneVal }
      })

      // Second pass: assign empty lanes sequentially, avoiding occupied ones
      let nextAvailableLane = 1
      const getNextLane = () => {
        while (existingLanes.has(nextAvailableLane)) {
          nextAvailableLane++
        }
        existingLanes.add(nextAvailableLane)
        return nextAvailableLane
      }

      const mapped = initialMap.map((p) => {
        const laneVal = p.tempLane != null ? p.tempLane : getNextLane()

        return {
          id: p.id,
          horse: p.horseName || 'Không rõ',
          breed: p.horseBreed || 'Không rõ',
          owner: p.ownerName || 'Không rõ',
          jockey: p.jockeyName || 'Không rõ',
          color: laneVal ? LANE_COLORS[(laneVal - 1) % LANE_COLORS.length] : '#666',
          lane: laneVal,
          status: p.status === 'CONFIRMED' ? 'confirmed' : p.status?.toLowerCase() || 'confirmed'
        }
      })
      setParticipants(mapped)
    } catch (err) {
      console.error("Failed to load race participants:", err)
      setParticipants([])
    }
  }

  const saveParticipantsState = (newList) => {
    setParticipants(newList)
    localStorage.setItem(`lane_assignments_${selectedRaceId}`, JSON.stringify(newList))
  }

  // Handle Random Lane Draw (Bốc thăm ngẫu nhiên)
  const handleRandomDraw = () => {
    if (participants.length === 0) return

    setIsDrawing(true)

    // Simulate shuffling animation
    let shuffleCount = 0
    const interval = setInterval(() => {
      const shuffledLanes = Array.from({ length: participants.length }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)

      const animated = participants.map((p, idx) => ({
        ...p,
        lane: shuffledLanes[idx]
      }))
      setParticipants(animated)

      shuffleCount++
      if (shuffleCount >= 8) {
        clearInterval(interval)
        setIsDrawing(false)

        // Final random assignment
        const finalLanes = Array.from({ length: participants.length }, (_, i) => i + 1)
          .sort(() => Math.random() - 0.5)

        const finalResult = participants.map((p, idx) => ({
          ...p,
          lane: finalLanes[idx],
          color: LANE_COLORS[(finalLanes[idx] - 1) % LANE_COLORS.length]
        }))

        saveParticipantsState(finalResult)
        showToast('🎯 Đã hoàn tất bốc thăm ngẫu nhiên phân làn chạy!')
      }
    }, 120)
  }

  // Handle manual lane change
  const handleLaneChange = (participantId, newLaneNum) => {
    const targetLane = Number(newLaneNum)

    const updated = participants.map((p) => {
      if (p.id === participantId) {
        return {
          ...p,
          lane: targetLane,
          color: LANE_COLORS[(targetLane - 1) % LANE_COLORS.length]
        }
      }
      // If another horse already has this lane, swap them
      if (p.lane === targetLane) {
        const currentP = participants.find((x) => x.id === participantId)
        return {
          ...p,
          lane: currentP?.lane || null,
          color: currentP?.lane ? LANE_COLORS[(currentP.lane - 1) % LANE_COLORS.length] : '#666'
        }
      }
      return p
    })

    saveParticipantsState(updated)
    showToast('🔄 Đã cập nhật phân làn chạy!')
  }

  // Reset all lanes
  const handleResetLanes = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ phân làn của cuộc đua này?')) {
      const resetList = participants.map((p) => ({ ...p, lane: null }))
      saveParticipantsState(resetList)
      showToast('🗑️ Đã xóa phân làn cuộc đua!')
    }
  }

  const selectedRace = races.find((r) => r.id === selectedRaceId) || races[0]

  const filteredParticipants = participants.filter((p) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      p.horse.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q) ||
      p.jockey.toLowerCase().includes(q)
    )
  })

  // Sort by lane number for display
  const sortedByLane = [...filteredParticipants].sort((a, b) => {
    if (a.lane === null) return 1
    if (b.lane === null) return -1
    return a.lane - b.lane
  })

  const assignedCount = participants.filter((p) => p.lane !== null).length
  const totalCount = participants.length

  return (
    <div className="lane-assignment-page">
      {/* Toast */}
      {toastMessage && (
        <div className="lane-toast">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="admin-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="admin-page-title">🏁 Phân Làn Chạy Thi Đấu</h1>
          <p className="admin-page-sub">Sắp xếp vị trí cửa xuất phát (Làn chạy) & Bốc thăm ngẫu nhiên cho các ngựa đua</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="admin-btn admin-btn--gold"
            disabled={isDrawing || participants.length === 0}
            onClick={handleRandomDraw}
          >
            {isDrawing ? '🎲 Đang bốc thăm...' : '🎲 Bốc thăm ngẫu nhiên'}
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={participants.length === 0}
            onClick={handleResetLanes}
          >
            ↺ Xóa phân làn
          </button>
        </div>
      </div>

      {/* Filter / Race Selection Bar */}
      <div className="lane-filter-bar">
        <div className="lane-select-wrap">
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '4px' }}>Chọn Cuộc Đua</label>
          <select
            className="admin-select"
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
            style={{ minWidth: '280px', background: '#1a1a1a', color: '#fff', border: '1px solid rgba(212,175,55,0.3)', padding: '8px 12px', borderRadius: '6px' }}
          >
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} - {r.tournament} ({r.date})
              </option>
            ))}
          </select>
        </div>

        <div className="lane-search-wrap" style={{ flex: 1, maxWidth: '320px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '4px' }}>Tìm kiếm</label>
          <input
            type="text"
            className="admin-input"
            placeholder="Tìm theo tên ngựa, nài ngựa, chủ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginLeft: 'auto' }}>
          <button
            type="button"
            className={`admin-btn admin-btn--sm ${viewMode === 'both' ? 'admin-btn--gold' : 'admin-btn--ghost'}`}
            onClick={() => setViewMode('both')}
          >
            👁️ Tất cả
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn--sm ${viewMode === 'diagram' ? 'admin-btn--gold' : 'admin-btn--ghost'}`}
            onClick={() => setViewMode('diagram')}
          >
            🏟️ Sơ đồ đường chạy
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn--sm ${viewMode === 'table' ? 'admin-btn--gold' : 'admin-btn--ghost'}`}
            onClick={() => setViewMode('table')}
          >
            📄 Bảng phân làn
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="lane-stats-grid">
        <div className="lane-stat-card">
          <div className="lane-stat-icon">🐎</div>
          <div>
            <div className="lane-stat-val">{totalCount} Ngựa</div>
            <div className="lane-stat-lbl">Tham gia thi đấu</div>
          </div>
        </div>

        <div className="lane-stat-card">
          <div className="lane-stat-icon" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>✓</div>
          <div>
            <div className="lane-stat-val">{assignedCount} / {totalCount}</div>
            <div className="lane-stat-lbl">Đã phân làn xuất phát</div>
          </div>
        </div>

        <div className="lane-stat-card">
          <div className="lane-stat-icon" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>🏆</div>
          <div>
            <div className="lane-stat-val">{selectedRace?.name || ''}</div>
            <div className="lane-stat-lbl">{selectedRace?.tournament || ''}</div>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {participants.length === 0 ? (
        <div className="admin-card" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', height: '100%', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '24px' }}>
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>📭</span>
            <h4 style={{ fontSize: '20px', color: '#eee', marginBottom: '8px' }}>Chưa có đơn đăng ký nào</h4>
            <p style={{ fontSize: '14px', maxWidth: '350px', margin: '0 auto', lineHeight: '1.5' }}>
              Hiện tại cuộc đua này chưa có bất kỳ đơn đăng ký tham gia nào được xác nhận. Vui lòng chờ các chủ ngựa đăng ký tham gia cuộc đua này và được kỵ sĩ chấp nhận lời mời.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* VISUAL TRACK & GATES DIAGRAM */}
          {(viewMode === 'both' || viewMode === 'diagram') && (
            <div className="admin-card lane-diagram-card" style={{ marginTop: '24px' }}>
              <div className="admin-card-head">
                <h3>🏟️ Mô Phỏng Cửa Xuất Phát & Làn Chạy ({selectedRace?.name})</h3>
                <span style={{ fontSize: '12px', color: '#d4af37' }}>Cửa 1 ➔ Cửa {totalCount}</span>
              </div>
              <div className="admin-card-body">
                <div className="track-diagram-container">
                  {Array.from({ length: Math.max(totalCount, 6) }, (_, i) => i + 1).map((laneNum) => {
                    const participant = participants.find((p) => p.lane === laneNum)
                    const laneColor = LANE_COLORS[(laneNum - 1) % LANE_COLORS.length]

                    return (
                      <div
                        key={laneNum}
                        className={`gate-box ${participant ? 'is-filled' : 'is-empty'} ${isDrawing ? 'is-animating' : ''}`}
                        style={{ borderTop: `4px solid ${participant ? laneColor : '#444'}` }}
                      >
                        <div className="gate-number" style={{ background: participant ? laneColor : '#333' }}>
                          Làn {laneNum}
                        </div>

                        {participant ? (
                          <div className="gate-content">
                            <div className="gate-horse-icon">🐎</div>
                            <div className="gate-horse-name">{participant.horse}</div>
                            <div className="gate-jockey-name">👤 Nài: {participant.jockey}</div>
                            <div className="gate-owner-name">🏡 {participant.owner}</div>
                          </div>
                        ) : (
                          <div className="gate-empty-lbl">Cửa trống</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE TABLE FOR LANE CONFIGURATION */}
          {(viewMode === 'both' || viewMode === 'table') && (
            <div className="admin-card" style={{ marginTop: '24px' }}>
              <div className="admin-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📋 Bảng Danh Sách & Điều Chỉnh Làn Chạy</h3>
                <span style={{ fontSize: '12px', color: '#aaa' }}>Thay đổi làn chạy để tự động sắp xếp</span>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Làn Chạy</th>
                      <th>Ngựa Đua</th>
                      <th>Giống Loài</th>
                      <th>Chủ Stables</th>
                      <th>Nài Ngựa (Jockey)</th>
                      <th>Màu Áo Làn</th>
                      <th>Trạng Thái</th>
                      <th style={{ textAlign: 'right' }}>Chọn Làn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByLane.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                          Không tìm thấy ngựa đua nào phù hợp với từ khóa tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      sortedByLane.map((p) => (
                        <tr key={p.id} className={p.lane ? 'row-assigned' : ''}>
                          <td>
                            {p.lane ? (
                              <span className="lane-badge" style={{ backgroundColor: p.color }}>
                                Làn {p.lane}
                              </span>
                            ) : (
                              <span className="lane-badge lane-badge--none">
                                Chưa chọn
                              </span>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#fff', fontSize: '14px' }}>{p.horse}</strong>
                          </td>
                          <td>{p.breed}</td>
                          <td>{p.owner}</td>
                          <td>{p.jockey}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: p.lane ? p.color : '#555',
                                  display: 'inline-block'
                                }}
                              />
                              <span style={{ fontSize: '12px', color: '#ccc' }}>
                                {p.lane ? `Màu Làn ${p.lane}` : 'Chưa gán'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select
                              className="admin-select"
                              value={p.lane || ''}
                              onChange={(e) => handleLaneChange(p.id, e.target.value)}
                              style={{ width: '120px' }}
                            >
                              <option value="">-- Chọn --</option>
                              {Array.from({ length: Math.max(totalCount, 8) }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num}>Làn {num}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
