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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingViolation, setPendingViolation] = useState(null)
  const [selectedViolation, setSelectedViolation] = useState(null)

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

    setPendingViolation(newViolation)
    setShowConfirmModal(true)
  }

  const proceedAddViolation = () => {
    if (!pendingViolation) return
    setViolations([pendingViolation, ...violations])
    setSuccessMessage(`Đã lập biên bản vi phạm ${pendingViolation.id} thành công! Nội dung đã chuyển đến Ban trọng tài và BTC.`)
    setShowSuccessModal(true)
    
    // Reset form
    setSelectedRace('')
    setEntityName('')
    setViolationType('')
    setSeverity('medium')
    setDetails('')
    setShowConfirmModal(false)
    setPendingViolation(null)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={v.status} />
                      <button 
                        type="button" 
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        style={{ fontSize: '11px', padding: '2px 8px', borderColor: 'rgba(255,255,255,0.1)' }}
                        onClick={() => setSelectedViolation(v)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Confirm Action Modal */}
      {showConfirmModal && pendingViolation && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '440px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div className="admin-card-head" style={{ borderBottom: 'none', padding: '20px 24px 10px' }}>
              <h3 style={{ color: '#f59e0b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Xác nhận lập biên bản
              </h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => { setShowConfirmModal(false); setPendingViolation(null); }}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '10px 24px 20px' }}>
              <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                Bạn có chắc chắn muốn lập biên bản vi phạm cho <strong>{pendingViolation.entity}</strong> thuộc cuộc đua <strong>{pendingViolation.race}</strong> không? Biên bản sau khi gửi sẽ được chuyển trực tiếp tới BTC.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="admin-btn admin-btn--ghost" 
                  onClick={() => { setShowConfirmModal(false); setPendingViolation(null); }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  className="admin-btn"
                  style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
                  onClick={proceedAddViolation}
                >
                  Lập biên bản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '30px', border: '1px solid rgba(74, 222, 128, 0.25)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ marginBottom: '20px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 style={{ color: '#4ade80', marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Lập biên bản thành công!</h3>
            <p style={{ color: '#ccc', marginBottom: '25px', lineHeight: '1.6', fontSize: '14px' }}>
              {successMessage}
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="admin-btn"
              style={{ width: '100%', justifyContent: 'center', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: '12px' }}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}
      {/* Violation Detail Modal */}
      {selectedViolation && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="admin-card-head">
              <h3>Chi tiết biên bản #{selectedViolation.id}</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedViolation(null)}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#666', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Loại vi phạm</span>
                  <strong style={{ color: '#fff' }}>{selectedViolation.type}</strong>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Mức độ</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: selectedViolation.severity === 'high' ? '#f87171' : selectedViolation.severity === 'medium' ? '#fbbf24' : '#60a5fa' 
                  }}>
                    {selectedViolation.severity === 'high' ? 'Cao (Đình chỉ)' : selectedViolation.severity === 'medium' ? 'Trung bình (Trừ điểm)' : 'Thấp (Cảnh cáo)'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Đối tượng</span>
                  <strong style={{ color: '#fff' }}>{selectedViolation.entity}</strong>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Trận đua</span>
                  <strong style={{ color: '#fff' }}>{selectedViolation.race}</strong>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Ngày lập</span>
                  <span style={{ color: '#ccc' }}>{selectedViolation.date}</span>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái duyệt</span>
                  <StatusBadge status={selectedViolation.status} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', marginTop: '4px' }}>
                <span style={{ color: '#666', display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase' }}>Chi tiết sự việc & Bằng chứng</span>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', color: '#ccc', fontSize: '13px', lineHeight: '1.6', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                  {selectedViolation.details || 'Không có mô tả chi tiết.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="admin-btn admin-btn--gold" style={{ width: '100%' }} onClick={() => setSelectedViolation(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
