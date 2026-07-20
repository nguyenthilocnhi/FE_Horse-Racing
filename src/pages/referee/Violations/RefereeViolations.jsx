import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { getRaceParticipations, handleRuleViolation } from '../../../services/refereeService'
import './RefereeViolations.css'

const INFRACTION_TYPES = [
  { value: 'Lane Deviation', label: 'Chạy lấn làn (Lane Deviation)' },
  { value: 'Excessive Whipping', label: 'Sử dụng roi quá mức (Excessive Whipping)' },
  { value: 'Unsportsmanlike Conduct', label: 'Hành vi phi thể thao (Unsportsmanlike)' },
  { value: 'Weight Failure', label: 'Không đạt trọng lượng quy chuẩn (Weight Failure)' },
  { value: 'Doping Suspicion', label: 'Nghi vấn chất kích thích (Doping Suspicion)' },
  { value: 'Equipment Violation', label: 'Vi phạm trang bị kỹ thuật (Equipment)' },
]

export default function RefereeViolations() {
  const [violations, setViolations] = useState([])
  const [races, setRaces] = useState([])
  const [participations, setParticipations] = useState([])
  const [loadingParticipations, setLoadingParticipations] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [selectedRace, setSelectedRace] = useState('')
  const [selectedParticipation, setSelectedParticipation] = useState('')
  const [violationType, setViolationType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [details, setDetails] = useState('')

  useEffect(() => {
    fetchRaces()
  }, [])

  const fetchRaces = async () => {
    try {
      const tRes = await getAllTournaments()
      let allSchedules = []
      const tList = Array.isArray(tRes) ? tRes : (tRes?.data || [])
      for (const t of tList) {
        const sRes = await getTournamentSchedule(t.id)
        if (sRes?.data) {
          allSchedules = [...allSchedules, ...sRes.data.map(r => ({...r, tournamentName: t.name}))]
        }
      }
      setRaces(allSchedules)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRaceChange = async (e) => {
    const raceId = e.target.value
    setSelectedRace(raceId)
    setSelectedParticipation('')
    setParticipations([])
    if (raceId) {
      try {
        setLoadingParticipations(true)
        const pRes = await getRaceParticipations(raceId)
        if (pRes.data) {
          setParticipations(pRes.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingParticipations(false)
      }
    }
  }

  const handleAddViolation = async (e) => {
    e.preventDefault()
    if (!selectedRace || !violationType) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (Cuộc đua và Loại vi phạm)!')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        participationId: selectedParticipation ? parseInt(selectedParticipation) : null,
        description: `${violationType}: ${details}`,
        penalty: severity,
        evidence: 'Ghi nhận trực tiếp từ trọng tài'
      }

      await handleRuleViolation(selectedRace, payload)

      const raceName = races.find(r => r.id.toString() === selectedRace)?.name || selectedRace
      const partInfo = participations.find(p => p.id.toString() === selectedParticipation)
      const entityStr = partInfo ? `Ngựa: ${partInfo.horseName} - Nài: ${partInfo.jockeyName}` : 'Chưa xác định'

      const newViolation = {
        id: `VIO-${Math.floor(Math.random() * 9000) + 1000}`,
        type: violationType,
        entity: entityStr,
        race: raceName,
        date: new Date().toLocaleString('vi-VN'),
        status: 'PENDING',
        severity: severity
      }

      setViolations([newViolation, ...violations])
      alert(`⚠️ Đã lập biên bản vi phạm thành công! Nội dung đã chuyển đến Ban trọng tài và BTC.`);
      
      // Reset form
      setSelectedRace('')
      setSelectedParticipation('')
      setParticipations([])
      setViolationType('')
      setSeverity('medium')
      setDetails('')
    } catch (err) {
      console.error(err)
      alert('Lỗi nộp biên bản vi phạm: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="referee-violations-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Ghi Nhận Vi Phạm</h1>
          <p className="admin-page-sub">Ghi nhận các sự cố, hành vi phạm luật thi đấu của nài ngựa (Jockey) hoặc ngựa đua trong cuộc đua</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Form to Log Violation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Lập Biên Bản Vi Phạm Mới</h3>
            </div>
            <form onSubmit={handleAddViolation} className="admin-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label className="admin-form-label">Chọn cuộc đua xảy ra sự cố *</label>
                <select 
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={selectedRace}
                  onChange={handleRaceChange}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">-- Chọn cuộc đua --</option>
                  {races.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.tournamentName}) - {r.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="admin-form-label">Đối tượng vi phạm {loadingParticipations && '(Đang tải...)'}</label>
                <select 
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={selectedParticipation}
                  onChange={e => setSelectedParticipation(e.target.value)}
                  disabled={!selectedRace || isSubmitting || loadingParticipations}
                >
                  <option value="">-- Chọn ngựa/nài vi phạm (Tùy chọn) --</option>
                  {participations.map(p => (
                    <option key={p.id} value={p.id}>
                      Ngựa: {p.horseName || 'N/A'} - Nài: {p.jockeyName || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="admin-form-label">Loại vi phạm luật *</label>
                <select 
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">-- Chọn hành vi vi phạm --</option>
                  {INFRACTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="admin-form-label">Mức độ nghiêm trọng *</label>
                <select 
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="low">Thấp (Cảnh cáo)</option>
                  <option value="medium">Trung bình (Trừ điểm)</option>
                  <option value="high">Cao (Truất quyền thi đấu / Đình chỉ)</option>
                </select>
              </div>

              <div>
                <label className="admin-form-label">Mô tả sự việc & Bằng chứng xác nhận</label>
                <textarea 
                  className="admin-input" 
                  rows="4" 
                  style={{ width: '100%', resize: 'none' }}
                  placeholder="Ghi nhận cụ thể thời gian, vị trí trên sân đua, hoặc các quan sát trực tiếp từ trọng tài..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" className="admin-btn admin-btn--gold" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Lập Biên Bản & Gửi Báo Cáo'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: List of Recorded Violations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Nhật Ký Vi Phạm Đã Ghi Nhận (Phiên hiện tại)</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {violations.map(v => (
                <div 
                  key={v.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{v.id}</code>
                      <strong style={{ color: '#fff' }}>{v.type}</strong>
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      textTransform: 'uppercase', 
                      fontWeight: 'bold',
                      color: v.severity === 'high' ? '#f87171' : v.severity === 'medium' ? '#fbbf24' : '#60a5fa' 
                    }}>
                      {v.severity === 'high' ? 'Cao' : v.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#888', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span>📍 Đối tượng: <strong style={{ color: '#fff' }}>{v.entity}</strong></span>
                    <span>🏁 Cuộc đua: <strong style={{ color: '#fff' }}>{v.race}</strong></span>
                    <span>📅 Ngày lập: {v.date}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Trạng thái xử lý:</span>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
              {violations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Chưa có vi phạm nào được ghi nhận.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
