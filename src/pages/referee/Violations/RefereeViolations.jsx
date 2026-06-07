import React, { useState } from 'react'
import { violations as initialViolations } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
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
  const [violations, setViolations] = useState(initialViolations)
  
  // Form state
  const [selectedRace, setSelectedRace] = useState('')
  const [entityType, setEntityType] = useState('Jockey')
  const [entityName, setEntityName] = useState('')
  const [violationType, setViolationType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [details, setDetails] = useState('')

  const handleAddViolation = (e) => {
    e.preventDefault()
    if (!selectedRace || !entityName || !violationType) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!')
      return
    }

    const newViolation = {
      id: `VIO-${Math.floor(Math.random() * 900) + 100}`,
      type: violationType,
      entity: `${entityType}: ${entityName}`,
      race: selectedRace,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      severity: severity,
      details: details
    }

    setViolations([newViolation, ...violations])
    alert(`⚠️ Đã lập biên bản vi phạm ${newViolation.id} thành công! Nội dung đã chuyển đến Ban trọng tài và BTC.`);
    
    // Reset form
    setSelectedRace('')
    setEntityName('')
    setViolationType('')
    setSeverity('medium')
    setDetails('')
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
                  onChange={e => setSelectedRace(e.target.value)}
                  required
                >
                  <option value="">-- Chọn cuộc đua --</option>
                  <option value="Derby Một Dặm">Derby Một Dặm</option>
                  <option value="Đua nước rút">Đua nước rút</option>
                  <option value="Sprint Classic">Sprint Classic</option>
                  <option value="Cúp Nhà Vô Địch">Cúp Nhà Vô Địch</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
                <div>
                  <label className="admin-form-label">Đối tượng vi phạm *</label>
                  <select 
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={entityType}
                    onChange={e => setEntityType(e.target.value)}
                  >
                    <option value="Jockey">👤 Jockey (Nài)</option>
                    <option value="Horse">🏇 Ngựa đua</option>
                    <option value="Stable">🏠 Chủ ngựa (Stable)</option>
                  </select>
                </div>
                <div>
                  <label className="admin-form-label">Tên đối tượng *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    placeholder="Ví dụ: L. Anderson, Aurelius..."
                    style={{ width: '100%' }}
                    value={entityName}
                    onChange={e => setEntityName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="admin-form-label">Loại vi phạm luật *</label>
                <select 
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
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
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" className="admin-btn admin-btn--gold" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}>
                  Lập Biên Bản & Gửi Báo Cáo
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: List of Recorded Violations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Nhật Ký Vi Phạm Đã Ghi Nhận</h3>
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
                      <code style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>#{v.id}</code>
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
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
