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
          allSchedules = [...allSchedules, ...sRes.data.map(r => ({ ...r, tournamentName: t.name }))]
        }
      }
      const relevantRaces = allSchedules.filter(r => (r.status === 'SCHEDULED' || r.status === 'DELAYED'))
      relevantRaces.sort((a, b) => {
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
    setErrorDetails('')
    setPreRaceReport('Đường đua và trang thiết bị đạt chuẩn.')

    if (race.status === 'DELAYED' || race.status === 'delayed') {
      alert(`⛔ Cuộc đua "${race.name}" đã bị hoãn!`)
      return
    }

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

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmRaceId, setConfirmRaceId] = useState(null)

  const handleApproveRaceStart = async (raceId) => {
    const list = vettingData[raceId] || []

    const passedCount = list.filter(h => h.medical && h.gear && h.weight).length
    if (passedCount < 2) {
      alert('Cần ít nhất 2 ngựa vượt qua kiểm tra để đủ điều kiện xuất phát!')
      return
    }

    setConfirmRaceId(raceId)
    setShowConfirmModal(true)
  }

  const executeApproveRaceStart = async () => {
    const raceId = confirmRaceId
    if (!raceId) return

    const list = vettingData[raceId] || []
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
      setShowConfirmModal(false)
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <StatusBadge status={r.status} />
                      {inspectedRaces[r.id] && <span className="admin-badge admin-badge--green" style={{ fontSize: '10px' }}>Đã Thanh Tra</span>}
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
                {(selectedRace.status === 'DELAYED' || selectedRace.status === 'delayed') ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>⛔</span>
                    <h3 style={{ margin: '0 0 8px', color: '#ef4444', fontSize: '18px', fontWeight: '700' }}>Cuộc đua đã bị hoãn</h3>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>Cuộc đua này đang trong trạng thái bị hoãn. Không thể thực hiện kiểm tra thanh tra trước đua.</p>
                  </div>
                ) : loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <p>Đang tải dữ liệu thanh tra...</p>
                  </div>
                ) : errorDetails ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px', opacity: 0.8 }}>⚠️</span>
                    <p style={{ marginBottom: '16px' }}>{errorDetails}</p>
                    <button type="button" className="admin-btn admin-btn--primary" onClick={() => handleSelectRace(selectedRace)}>
                      ↻ Thử lại
                    </button>
                  </div>
                ) : (vettingData[selectedRace.id] && vettingData[selectedRace.id].length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>📭</span>
                    <p>Chưa có danh sách đăng ký cho cuộc đua này.</p>
                  </div>
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
            border: '1px solid rgba(239, 68, 68, 0.3)', // red theme for warning
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(239,68,68,0.15)',
          }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <h3 style={{ color: '#ef4444' }}>⚠️ Xác nhận gửi thanh tra</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>
            <div className="admin-card-body" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', lineHeight: '1.5' }}>
                Bạn có chắc chắn nộp báo cáo và chốt danh sách xuất phát?
              </p>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
                <strong style={{ color: '#ef4444', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Đây là thao tác không thể chỉnh sửa
                </strong>
                <p style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                  Hệ thống sẽ khóa danh sách ngựa tham gia và công bố thông tin này cho giải đấu.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  style={{ minWidth: '100px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={executeApproveRaceStart}
                  disabled={submitting}
                  style={{ minWidth: '150px' }}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

