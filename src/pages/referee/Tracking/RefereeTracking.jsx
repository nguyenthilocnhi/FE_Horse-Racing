import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { getRaceParticipations, submitPostRaceReport, recordRaceResult } from '../../../services/refereeService'
import './RefereeTracking.css'

export default function RefereeTracking() {
  const [races, setRaces] = useState([])
  const [selectedRace, setSelectedRace] = useState(null)
  const [runners, setRunners] = useState({})
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [errorList, setErrorList] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  
  const [isSimulating, setIsSimulating] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [notes, setNotes] = useState('')
  const [successModal, setSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const relevantRaces = allSchedules.filter(r => r.status === 'RUNNING' || r.status === 'COMPLETED')
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
    setConfirmed(false)
    setNotes('')
    setErrorDetails('')

    if (!runners[race.id]) {
      try {
        setLoadingDetails(true)
        const pRes = await getRaceParticipations(race.id)
        if (pRes.data) {
          // Chỉ lấy những ngựa đã được chuẩn y tham gia (CONFIRMED)
          const validParticipants = pRes.data.filter(p => p.status === 'CONFIRMED')
          const mapped = validParticipants.map((p, index) => ({
            participationId: p.id,
            lane: index + 1,
            horse: p.horseName || 'Chưa có',
            jockey: p.jockeyName || 'Chưa có',
            progress: 0,
            rank: '',
            time: ''
          }))
          setRunners(prev => ({ ...prev, [race.id]: mapped }))
        }
      } catch (err) {
        console.error(err)
        setErrorDetails('Lỗi lấy danh sách ngựa: ' + (err.response?.data?.message || err.message))
      } finally {
        setLoadingDetails(false)
      }
    }
  }

  // Simulation loop
  useEffect(() => {
    let interval = null
    if (isSimulating && selectedRace) {
      interval = setInterval(() => {
        setRunners(prev => {
          const currentList = prev[selectedRace.id] || []
          let finishedCount = 0
          
          const updated = currentList.map(r => {
            if (r.progress >= 100) {
              finishedCount++
              return r
            }
            const increment = Math.floor(Math.random() * 15) + 5
            const nextProgress = Math.min(r.progress + increment, 100)
            return { ...r, progress: nextProgress }
          })

          if (finishedCount === updated.length) {
            setIsSimulating(false)
            clearInterval(interval)
            
            const withRanks = updated.map((r, i) => {
              const rnk = i + 1
              const mockSec = (90 + rnk * 1.5 + Math.random()).toFixed(1)
              const minutes = Math.floor(mockSec / 60)
              const seconds = (mockSec % 60).toFixed(1)
              return {
                ...r,
                rank: rnk.toString(),
                time: `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(4, '0')}` // Format HH:mm:ss.S for LocalTime mapping if possible. Just let user type or provide valid format like HH:mm:ss
              }
            })
            // Quick format fix for HH:mm:ss
            return { ...prev, [selectedRace.id]: updated.map((r, i) => {
              const mockSec = 90 + (i+1) * 2
              return {
                ...r,
                rank: (i + 1).toString(),
                time: `00:01:${(mockSec%60).toString().padStart(2, '0')}` 
              }
            }) }
          }

          return { ...prev, [selectedRace.id]: updated }
        })
      }, 300)
    }

    return () => clearInterval(interval)
  }, [isSimulating, selectedRace])

  const handleStartSimulation = () => {
    if (!selectedRace) return
    
    setRunners(prev => ({
      ...prev,
      [selectedRace.id]: prev[selectedRace.id].map(r => ({ ...r, progress: 0, rank: '', time: '' }))
    }))
    setIsSimulating(true)
  }

  const handleRankChange = (lane, val) => {
    if (!selectedRace) return
    setRunners(prev => ({
      ...prev,
      [selectedRace.id]: prev[selectedRace.id].map(r => 
        r.lane === lane ? { ...r, rank: val } : r
      )
    }))
  }

  const handleTimeChange = (lane, val) => {
    if (!selectedRace) return
    setRunners(prev => ({
      ...prev,
      [selectedRace.id]: prev[selectedRace.id].map(r => 
        r.lane === lane ? { ...r, time: val } : r
      )
    }))
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    if (!selectedRace) return
    
    const list = runners[selectedRace.id] || []
    
    if (list.length === 0) {
      alert('Danh sách ngựa rỗng, không thể nộp kết quả.')
      return
    }

    const incomplete = list.some(r => !r.rank || !r.time)
    if (incomplete) {
      alert('Vui lòng điền đầy đủ Thứ tự xếp hạng và Thời gian (định dạng HH:mm:ss) cho mọi làn chạy!')
      return
    }

    if (!confirmed) {
      alert('Vui lòng đánh dấu vào hộp xác nhận kết quả trước khi gửi!')
      return
    }

    setIsSubmitting(true)
    try {
      const resultsPayload = {
        results: list.map(r => {
          let t = r.time;
          if (t.split(':').length === 2) t = '00:' + t;
          return {
            participationId: r.participationId,
            rankPosition: parseInt(r.rank),
            finishTime: t
          }
        })
      }
      
      const reportPayload = {
        content: notes || 'Không có sự cố bất thường.',
        hasComplaint: false,
        violationNote: ''
      }

      await recordRaceResult(selectedRace.id, resultsPayload)
      await submitPostRaceReport(selectedRace.id, reportPayload)

      setRaces(races.map(r => r.id === selectedRace.id ? { ...r, status: 'COMPLETED' } : r))
      setSuccessModal(true)
    } catch (err) {
      alert('Có lỗi xảy ra khi nộp biên bản: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccessModal = () => {
    setSuccessModal(false)
    setSelectedRace(null)
    setConfirmed(false)
    setNotes('')
    fetchRaces()
  }

  const selectedRunners = selectedRace ? (runners[selectedRace.id] || []) : []

  return (
    <div className="referee-tracking-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Giám Sát & Ghi Nhận Kết Quả</h1>
          <p className="admin-page-sub">Theo dõi trực tiếp cuộc đua đang chạy, ghi nhận kết quả xếp hạng thi đấu và lập biên bản chính thức gửi Ban tổ chức</p>
        </div>
        <button onClick={fetchRaces} className="admin-btn admin-btn--primary">Làm mới</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Ongoing & Completed Races */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Cuộc đua đang chạy hoặc đã kết thúc</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingList ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Đang tải danh sách...</div>
              ) : errorList ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>{errorList}</div>
              ) : races.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Không có cuộc đua nào đang chạy.</div>
              ) : (
                races.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => handleSelectRace(r)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: selectedRace?.id === r.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.05)',
                      background: selectedRace?.id === r.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(18, 18, 18, 0.5)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="race-tracking-card"
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '15px', display: 'block' }}>{r.name}</strong>
                      <span style={{ fontSize: '12px', color: '#888', display: 'block', marginTop: '4px' }}>🏆 {r.tournamentName || `Giải #${r.tournamentId}`}</span>
                      <span style={{ fontSize: '11px', color: '#666' }}>Bắt đầu: {new Date(r.startTime).toLocaleString('vi-VN')}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Vetting / Reporting Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedRace ? (
            <div className="admin-card" style={{ border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div className="admin-card-head">
                <h3>Bảng ghi nhận kết quả: {selectedRace.name}</h3>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedRace(null)}>✕</button>
              </div>
              <div className="admin-card-body" style={{ padding: '20px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                  <div>
                    <span style={{ color: '#888', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Trạng thái cuộc đua</span>
                    <StatusBadge status={selectedRace.status} />
                  </div>
                  
                  {selectedRace.status === 'RUNNING' && (
                    <button 
                      type="button" 
                      className="admin-btn admin-btn--sm" 
                      onClick={handleStartSimulation} 
                      disabled={isSimulating}
                      style={{ background: '#10b981', color: '#fff', border: 'none' }}
                    >
                      {isSimulating ? '🏃 Cuộc đua đang diễn ra...' : '▶ Bắt đầu chạy giả lập'}
                    </button>
                  )}
                </div>

                {selectedRace.status === 'RUNNING' && (
                  <div style={{ background: '#0a0a0a', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '20px' }}>
                    <h5 style={{ color: '#ccc', margin: '0 0 12px 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mô phỏng đường chạy</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedRunners.map(r => (
                        <div key={r.lane} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '80px', color: '#888', fontSize: '11px', whiteSpace: 'nowrap' }}>Làn #{r.lane}</span>
                          <div style={{ flex: 1, background: '#222', height: '14px', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ width: `${r.progress}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', height: '100%', borderRadius: '7px', transition: 'width 0.3s ease-out' }} />
                            {r.progress >= 100 && <span style={{ position: 'absolute', right: '8px', top: '1px', fontSize: '9px', fontWeight: 'bold', color: '#fff' }}>FINISH</span>}
                          </div>
                        </div>
                      ))}
                      {selectedRunners.length === 0 && <span style={{color: '#666'}}>Chưa có thông tin xuất phát.</span>}
                    </div>
                  </div>
                )}

                {loadingDetails ? (
                   <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải danh sách thi đấu...</div>
                ) : errorDetails ? (
                   <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{errorDetails}</div>
                ) : (
                  <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#10b981', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Bảng điểm và Thành tích về đích</h4>
                    
                    <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <table className="admin-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '60px' }}>Làn</th>
                            <th>Ngựa & Jockey</th>
                            <th style={{ width: '120px' }}>Thứ hạng xếp hạng</th>
                            <th style={{ width: '140px', textAlign: 'right' }}>Thời gian chạy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRunners.map(r => (
                            <tr key={r.lane}>
                              <td style={{ fontWeight: 'bold', color: '#10b981' }}>#{r.lane}</td>
                              <td>
                                <strong style={{ color: '#fff', display: 'block' }}>{r.horse}</strong>
                                <span style={{ fontSize: '11px', color: '#888' }}>{r.jockey}</span>
                              </td>
                              <td>
                                <select 
                                  className="admin-select"
                                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                                  value={r.rank}
                                  onChange={(e) => handleRankChange(r.lane, e.target.value)}
                                  disabled={selectedRace.status === 'COMPLETED'}
                                >
                                  <option value="">-- Chọn hạng --</option>
                                  <option value="1">🥇 Hạng 1</option>
                                  <option value="2">🥈 Hạng 2</option>
                                  <option value="3">🥉 Hạng 3</option>
                                  <option value="4">Hạng 4</option>
                                  {selectedRunners.length > 4 && <option value="5">Hạng 5</option>}
                                  {selectedRunners.length > 5 && <option value="6">Hạng 6</option>}
                                  {selectedRunners.length > 6 && <option value="7">Hạng 7</option>}
                                  {selectedRunners.length > 7 && <option value="8">Hạng 8</option>}
                                </select>
                              </td>
                              <td>
                                <input 
                                  type="text"
                                  className="admin-input"
                                  style={{ width: '100%', textAlign: 'right', padding: '4px 8px', fontSize: '12px' }}
                                  placeholder="00:01:35"
                                  value={r.time}
                                  onChange={(e) => handleTimeChange(r.lane, e.target.value)}
                                  disabled={selectedRace.status === 'COMPLETED'}
                                />
                              </td>
                            </tr>
                          ))}
                          {selectedRunners.length === 0 && (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Không có ngựa đăng ký hợp lệ.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selectedRace.status === 'RUNNING' && (
                      <>
                        <div>
                          <label className="admin-form-label">Ghi chú sự cố / Biên bản trận đấu (Nếu có)</label>
                          <textarea 
                            className="admin-input" 
                            rows="3" 
                            style={{ width: '100%', resize: 'none' }}
                            placeholder="Mô tả các vấn đề về thời tiết, sự cố kỹ thuật hoặc hành vi xảy ra trong cuộc đua..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <input 
                            type="checkbox" 
                            id="confirmResults" 
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label htmlFor="confirmResults" style={{ fontSize: '12px', color: '#ccc', cursor: 'pointer', userSelect: 'none' }}>
                            Tôi xác nhận kết quả ghi nhận trên là trung thực và chính xác theo diễn biến trận đấu.
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedRace(null)} disabled={isSubmitting}>Hủy bỏ</button>
                          <button 
                            type="submit" 
                            className="admin-btn admin-btn--gold"
                            style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                            disabled={isSubmitting || selectedRunners.length === 0}
                          >
                            {isSubmitting ? 'Đang gửi...' : 'Xác Nhận & Gửi Biên Bản'}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⏱</span>
                <h4>Chưa chọn cuộc đua</h4>
                <p style={{ fontSize: '12px', maxWidth: '300px', margin: '8px auto 0' }}>Vui lòng chọn cuộc đua đang diễn ra hoặc đã kết thúc ở cột bên trái để cập nhật kết quả và nộp biên bản.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {successModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1100
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '420px', border: '1px solid rgba(16, 185, 129, 0.3)', background: '#121212', textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
            <h3 style={{ color: '#10b981', marginBottom: '20px', fontSize: '18px' }}>Nộp biên bản kết quả thành công!</h3>
            <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
              Biên bản cuộc đua <strong>{selectedRace?.name}</strong> đã được lưu trữ và gửi lên hệ thống. Kết quả đang chờ Ban tổ chức (Admin) công bố chính thức.
            </p>
            <button 
              type="button" 
              className="admin-btn" 
              style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none' }}
              onClick={handleCloseSuccessModal}
            >
              Hoàn thành
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
