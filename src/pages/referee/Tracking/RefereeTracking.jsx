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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
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
          allSchedules = [...allSchedules, ...sRes.data.map(r => ({ ...r, tournamentName: t.name }))]
        }
      }
      const relevantRaces = allSchedules.filter(r => r.status === 'RUNNING' || r.status === 'COMPLETED')
      relevantRaces.sort((a, b) => {
        const statusPriorityA = a.status === 'RUNNING' ? 1 : 0
        const statusPriorityB = b.status === 'RUNNING' ? 1 : 0
        if (statusPriorityB !== statusPriorityA) return statusPriorityB - statusPriorityA

        const idA = Number(String(a.originalId || a.id).replace(/\D/g, '')) || 0
        const idB = Number(String(b.originalId || b.id).replace(/\D/g, '')) || 0
        if (idB !== idA) return idB - idA

        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
        return timeB - timeA
      })
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

    if (race.status === 'DELAYED' || race.status === 'delayed') {
      alert(`⛔ Cuộc đua "${race.name}" đã bị hoãn!`)
      return
    }

    if (!runners[race.id]) {
      try {
        setLoadingDetails(true)
        const pRes = await getRaceParticipations(race.id)
        const rawList = Array.isArray(pRes) ? pRes : (pRes?.data || [])
        if (rawList) {
          const validParticipants = rawList.filter(p => p.status === 'CONFIRMED' || p.status === 'confirmed' || !p.status)
          const finalParticipants = validParticipants.length > 0 ? validParticipants : rawList

          const mapped = finalParticipants.map((p, idx) => ({
            participationId: p.id,
            lane: p.laneNumber != null ? p.laneNumber : (p.lane != null ? p.lane : (p.laneNo != null ? p.laneNo : (idx + 1))),
            horse: p.horseName || (p.horse ? (p.horse.name || p.horse) : 'Chưa có'),
            jockey: p.jockeyName || (p.jockey ? (p.jockey.fullName || p.jockey.userName || p.jockey) : 'Chưa có'),
            progress: 0,
            rank: p.rankPosition != null ? String(p.rankPosition) : (p.rank != null ? String(p.rank) : ''),
            time: p.finishTime || p.time || ''
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
      const finishOrder = []

      interval = setInterval(() => {
        setRunners(prev => {
          const currentList = prev[selectedRace.id] || []
          let allFinished = true

          const updated = currentList.map(r => {
            if (r.progress >= 100) {
              return r
            }
            const increment = Math.floor(Math.random() * 14) + 6
            const nextProgress = Math.min(r.progress + increment, 100)
            if (nextProgress >= 100) {
              const key = r.participationId || r.lane
              if (!finishOrder.includes(key)) {
                finishOrder.push(key)
              }
            } else {
              allFinished = false
            }
            return { ...r, progress: nextProgress }
          })

          if (allFinished) {
            setIsSimulating(false)
            clearInterval(interval)

            const finalRunners = updated.map(r => {
              const key = r.participationId || r.lane
              let rnkIndex = finishOrder.indexOf(key)
              if (rnkIndex === -1) rnkIndex = finishOrder.length
              const rankNum = rnkIndex + 1

              const totalSec = 88 + rankNum * 2 + (Math.random() * 0.5)
              const min = Math.floor(totalSec / 60)
              const sec = Math.floor(totalSec % 60)
              const timeStr = `00:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`

              return {
                ...r,
                rank: rankNum.toString(),
                time: timeStr
              }
            })

            return { ...prev, [selectedRace.id]: finalRunners }
          }

          return { ...prev, [selectedRace.id]: updated }
        })
      }, 250)
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

    setShowConfirmModal(true)
  }

  const executeSubmitReport = async () => {
    setIsSubmitting(true)
    try {
      const list = runners[selectedRace.id] || []
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
      setShowConfirmModal(false)
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

  const selectedRunners = selectedRace ? [...(runners[selectedRace.id] || [])].sort((a, b) => a.lane - b.lane) : []

  return (
    <div className="referee-tracking-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Giám Sát & Ghi Nhận Kết Quả</h1>
          <p className="admin-page-sub">Theo dõi trực tiếp cuộc đua đang chạy, ghi nhận kết quả xếp hạng thi đấu và lập biên bản chính thức gửi Ban tổ chức</p>
        </div>
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
                      {selectedRunners.length === 0 && <span style={{ color: '#666' }}>Chưa có thông tin xuất phát.</span>}
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
                                {r.rank ? (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    background: r.rank === '1' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.1)',
                                    color: r.rank === '1' ? '#d4af37' : '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    border: `1px solid ${r.rank === '1' ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255,255,255,0.2)'}`
                                  }}>
                                    {r.rank === '1' ? '🥇 Hạng 1' : `Hạng ${r.rank}`}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#666' }}>--</span>
                                )}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="admin-input"
                                  style={{ width: '100%', textAlign: 'right', padding: '4px 8px', fontSize: '12px', opacity: 0.8, cursor: 'not-allowed' }}
                                  placeholder="00:01:35"
                                  value={r.time}
                                  onChange={(e) => handleTimeChange(r.lane, e.target.value)}
                                  disabled={true}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="admin-card" style={{
            width: '100%',
            maxWidth: '450px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.15)',
          }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)', background: 'rgba(16, 185, 129, 0.1)' }}>
              <h3 style={{ color: '#10b981' }}>Xác nhận gửi kết quả</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
            <div className="admin-card-body" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn nộp biên bản và kết quả cuộc đua?
              </p>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '24px' }}>
                <strong style={{ color: '#10b981', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Hành động này không thể hoàn tác
                </strong>
                <p style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                  Kết quả sẽ được gửi lên Ban tổ chức để kiểm duyệt và công bố chính thức.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  style={{ minWidth: '100px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--success"
                  onClick={executeSubmitReport}
                  disabled={isSubmitting}
                  style={{ minWidth: '150px' }}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Biên Bản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
