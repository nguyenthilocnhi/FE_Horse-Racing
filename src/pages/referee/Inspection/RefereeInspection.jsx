import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { getRaceParticipations, inspectRaceParticipants, submitPreRaceReport } from '../../../services/refereeService'
import './RefereeInspection.css'

export default function RefereeInspection() {
  const [races, setRaces] = useState([])
  const [selectedRace, setSelectedRace] = useState(null)
  const [vettingData, setVettingData] = useState({})
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [errorList, setErrorList] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [preRaceReport, setPreRaceReport] = useState('Đường đua và trang thiết bị đạt chuẩn.')
  const [inspectedRaces, setInspectedRaces] = useState({})

  useEffect(() => {
    fetchRaces()
  }, [])

  const fetchRaces = async () => {
    try {
      setLoadingList(true)
      setErrorList('')
      const tRes = await getAllTournaments()
      let allSchedules = []
      const tList = Array.isArray(tRes) ? tRes : (tRes?.data || [])
      for (const t of tList) {
        const sRes = await getTournamentSchedule(t.id)
        if (sRes?.data) {
          allSchedules = [...allSchedules, ...sRes.data.map(r => ({...r, tournamentName: t.name}))]
        }
      }
      const relevantRaces = allSchedules.filter(r => (r.status === 'SCHEDULED' || r.status === 'DELAYED'))
      setRaces(relevantRaces)
    } catch (err) {
      console.error(err)
      setErrorList('Lỗi khi lấy danh sách cuộc đua: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoadingList(false)
    }
  }

  const handleSelectRace = async (race) => {
    setSelectedRace(race)
    setErrorDetails('')
    setPreRaceReport('Đường đua và trang thiết bị đạt chuẩn.')
    
    if (!vettingData[race.id]) {
      try {
        setLoadingDetails(true)
        const pRes = await getRaceParticipations(race.id)
        if (pRes.data) {
          // If any participation has horseReady !== null, it was already inspected
          const alreadyInspected = pRes.data.some(p => p.horseReady !== null && p.horseReady !== undefined)
          setInspectedRaces(prev => ({ ...prev, [race.id]: alreadyInspected }))

          const mapped = pRes.data.map(p => ({
            id: p.id,
            horse: p.horseName || 'Chưa có',
            jockey: p.jockeyName || 'Chưa có',
            medical: alreadyInspected ? p.horseReady : true,
            gear: alreadyInspected ? p.horseReady : true, // simplify mock logic for gear/weight using horseReady
            weight: alreadyInspected ? p.jockeyReady : true,
            note: p.inspectionNote || ''
          }))
          setVettingData(prev => ({ ...prev, [race.id]: mapped }))
        }
      } catch (err) {
        console.error(err)
        setErrorDetails('Lỗi lấy danh sách đăng ký: ' + (err.response?.data?.message || err.message))
      } finally {
        setLoadingDetails(false)
      }
    }
  }

  const handleToggleCheck = (raceId, horseId, field) => {
    setVettingData(prev => ({
      ...prev,
      [raceId]: prev[raceId].map(h => 
        h.id === horseId ? { ...h, [field]: !h[field] } : h
      )
    }))
  }

  const handleNoteChange = (raceId, horseId, val) => {
    setVettingData(prev => ({
      ...prev,
      [raceId]: prev[raceId].map(h => 
        h.id === horseId ? { ...h, note: val } : h
      )
    }))
  }

  const handleApproveRaceStart = async (raceId) => {
    const list = vettingData[raceId] || []
    
    const passedCount = list.filter(h => h.medical && h.gear && h.weight).length
    if (passedCount < 2) {
      alert('Cần ít nhất 2 ngựa vượt qua kiểm tra để đủ điều kiện xuất phát!')
      return
    }

    if (!window.confirm('Bạn có chắc chắn nộp báo cáo và chốt danh sách xuất phát? Thao tác này không thể hoàn tác.')) {
      return
    }

    try {
      setSubmitting(true)
      const inspectionItems = list.map(h => {
        const ready = h.medical && h.gear && h.weight;
        return {
          participationId: h.id,
          horseReady: ready,
          jockeyReady: ready,
          note: h.note || (ready ? 'Passed' : 'Failed')
        }
      })
      
      const payload = {
        items: inspectionItems
      }

      await inspectRaceParticipants(raceId, payload)
      
      const reportPayload = {
        content: preRaceReport || 'Sẵn sàng xuất phát.',
        hasComplaint: false,
        violationNote: ''
      }
      await submitPreRaceReport(raceId, reportPayload)

      setInspectedRaces(prev => ({ ...prev, [raceId]: true }))
      alert('🟢 Xác nhận: Ghi nhận thanh tra và nộp báo cáo thành công!')
      setSelectedRace(null)
      fetchRaces()
    } catch (err) {
      console.error(err)
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="referee-inspection-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Kiểm Tra Trước Cuộc Đua</h1>
          <p className="admin-page-sub">Kiểm tra tư cách tham gia, y tế, doping và trang bị của ngựa/nài trước khi xuất phát</p>
        </div>
        <button onClick={fetchRaces} className="admin-btn admin-btn--primary">Làm mới</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Assigned Races List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Cuộc đua chờ thanh tra</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingList ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Đang tải danh sách...</div>
              ) : errorList ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>{errorList}</div>
              ) : races.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Không có cuộc đua nào đang chờ thanh tra.</div>
              ) : (
                races.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => handleSelectRace(r)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: selectedRace?.id === r.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.05)',
                      background: selectedRace?.id === r.id ? 'rgba(59, 130, 246, 0.05)' : 'rgba(18, 18, 18, 0.5)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="race-inspect-card"
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '15px', display: 'block' }}>{r.name}</strong>
                      <span style={{ fontSize: '12px', color: '#888', display: 'block', marginTop: '4px' }}>🏆 {r.tournamentName || `Giải #${r.tournamentId}`}</span>
                      <span style={{ fontSize: '11px', color: '#666' }}>Bắt đầu: {new Date(r.startTime).toLocaleString('vi-VN')}</span>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                      <StatusBadge status={r.status} />
                      {inspectedRaces[r.id] && <span className="admin-badge admin-badge--green" style={{fontSize: '10px'}}>Đã Thanh Tra</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Vetting Checklist Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedRace ? (
            <div className="admin-card" style={{ border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div className="admin-card-head">
                <h3>Checklist thanh tra: {selectedRace.name}</h3>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedRace(null)}>✕</button>
              </div>
              <div className="admin-card-body" style={{ padding: '20px' }}>
                
                {loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải danh sách ngựa tham gia...</div>
                ) : errorDetails ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{errorDetails}</div>
                ) : (
                  <>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '12px', letterSpacing: '0.05em' }}>Đánh giá thể trạng & Trang bị</h4>
                    
                    <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                      <table className="admin-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Ngựa & Jockey</th>
                            <th style={{ textAlign: 'center', width: '90px' }}>Y khoa</th>
                            <th style={{ textAlign: 'center', width: '90px' }}>Trang bị</th>
                            <th style={{ textAlign: 'center', width: '90px' }}>Cân nặng</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(vettingData[selectedRace.id] || []).map(h => (
                            <tr key={h.id}>
                              <td>
                                <strong style={{ color: '#fff', display: 'block' }}>🏇 {h.horse}</strong>
                                <span style={{ fontSize: '11px', color: '#888' }}>👤 {h.jockey}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="checkbox"
                                  checked={h.medical}
                                  onChange={() => handleToggleCheck(selectedRace.id, h.id, 'medical')}
                                  disabled={submitting || inspectedRaces[selectedRace.id]}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="checkbox"
                                  checked={h.gear}
                                  onChange={() => handleToggleCheck(selectedRace.id, h.id, 'gear')}
                                  disabled={submitting || inspectedRaces[selectedRace.id]}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="checkbox"
                                  checked={h.weight}
                                  onChange={() => handleToggleCheck(selectedRace.id, h.id, 'weight')}
                                  disabled={submitting || inspectedRaces[selectedRace.id]}
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  value={h.note} 
                                  onChange={(e) => handleNoteChange(selectedRace.id, h.id, e.target.value)}
                                  placeholder="Tùy chọn"
                                  className="admin-input"
                                  style={{ padding: '4px 8px', fontSize: '12px', minWidth: '80px' }}
                                  disabled={submitting || inspectedRaces[selectedRace.id]}
                                />
                              </td>
                            </tr>
                          ))}
                          {(!vettingData[selectedRace.id] || vettingData[selectedRace.id].length === 0) && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Không có dữ liệu đăng ký hợp lệ cho cuộc đua này.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>Báo cáo chung (Pre-Race Report):</label>
                      <textarea
                        value={inspectedRaces[selectedRace.id] ? 'Cuộc đua đã được thanh tra và báo cáo trước trận đã được nộp.' : preRaceReport}
                        onChange={(e) => setPreRaceReport(e.target.value)}
                        className="admin-input"
                        rows="2"
                        placeholder="Nhập nhận xét tổng quan..."
                        disabled={submitting || inspectedRaces[selectedRace.id]}
                        style={{ width: '100%', resize: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {inspectedRaces[selectedRace.id] ? (
                        <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: 'bold' }}>
                          ✓ Cuộc đua đã được thanh tra
                        </div>
                      ) : <div />}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedRace(null)} disabled={submitting}>Đóng</button>
                        {!inspectedRaces[selectedRace.id] && (
                          <button 
                            type="button" 
                            className="admin-btn admin-btn--gold"
                            onClick={() => handleApproveRaceStart(selectedRace.id)}
                            disabled={submitting || !vettingData[selectedRace.id] || vettingData[selectedRace.id].length === 0}
                            style={{ background: '#3b82f6', borderColor: '#3b82f6', color: '#fff', opacity: submitting ? 0.7 : 1 }}
                          >
                            {submitting ? 'Đang nộp...' : 'Nộp Thanh Tra & Báo Cáo'}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📋</span>
                <h4>Chưa chọn cuộc đua</h4>
                <p style={{ fontSize: '12px', maxWidth: '300px', margin: '8px auto 0' }}>Vui lòng nhấp chọn một cuộc đua ở cột bên trái để bắt đầu thanh tra.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

