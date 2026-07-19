import React, { useState } from 'react'
import { races as mockRaces } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RefereeInspection.css'

// Initial vetting checklists for horses in races
const INITIAL_VETTING_DATA = {
  'R-1042': [
    { id: 1, horse: 'Aurelius', jockey: 'L. Anderson', medical: true, gear: true, weight: true },
    { id: 2, horse: 'Midnight Star', jockey: 'M. Rodriguez', medical: true, gear: true, weight: true },
    { id: 3, horse: 'Velvet Thunder', jockey: 'S. Nakamura', medical: false, gear: true, weight: true },
    { id: 4, horse: 'Storm Rider', jockey: 'K. McEvoy', medical: true, gear: false, weight: true }
  ],
  'R-1043': [
    { id: 1, horse: 'Midnight Star', jockey: 'M. Rodriguez', medical: true, gear: true, weight: true },
    { id: 2, horse: 'Velvet Thunder', jockey: 'S. Nakamura', medical: true, gear: true, weight: true }
  ]
}

export default function RefereeInspection() {
  const [races, setRaces] = useState(mockRaces.filter(r => r.status === 'scheduled' || r.status === 'ongoing'))
  const [selectedRace, setSelectedRace] = useState(null)
  const [vettingData, setVettingData] = useState(INITIAL_VETTING_DATA)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingRaceId, setPendingRaceId] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleToggleCheck = (raceId, horseId, field) => {
    setVettingData(prev => ({
      ...prev,
      [raceId]: prev[raceId].map(h => 
        h.id === horseId ? { ...h, [field]: !h[field] } : h
      )
    }))
  }

  const handleApproveRaceStart = (raceId) => {
    // Check if all horses have medical, gear, and weight approved
    const list = vettingData[raceId] || []
    const allPassed = list.every(h => h.medical && h.gear && h.weight)
    
    if (!allPassed) {
      setPendingRaceId(raceId)
      setShowConfirmModal(true)
      return
    }

    proceedApproveRaceStart(raceId)
  }

  const proceedApproveRaceStart = (raceId) => {
    // Update race status to ongoing
    setRaces(races.map(r => r.id === raceId ? { ...r, status: 'ongoing' } : r))
    const raceName = mockRaces.find(r => r.id === raceId)?.name || 'Cuộc đua'
    setSuccessMessage(`Xác nhận: Cuộc đua "${raceName}" đã được phê duyệt sẵn sàng xuất phát!`)
    setShowSuccessModal(true)
    setSelectedRace(null)
    setShowConfirmModal(false)
    setPendingRaceId(null)
  }

  return (
    <div className="referee-inspection-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Kiểm Tra Trước Cuộc Đua</h1>
          <p className="admin-page-sub">Kiểm tra tư cách tham gia, chứng nhận y tế, kiểm tra doping và trang bị của ngựa và nài trước khi cuộc đua bắt đầu</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Assigned Races List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Cuộc đua cần giám định của bạn</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {races.map(r => (
                <div 
                  key={r.id}
                  onClick={() => setSelectedRace(r)}
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
                    <span style={{ fontSize: '12px', color: '#888', display: 'block', marginTop: '4px' }}>🏆 Giải: {r.tournament}</span>
                    <span style={{ fontSize: '11px', color: '#666' }}>📏 Cự ly: {r.distance} | ⏰ {r.time}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
              {races.length === 0 && (
                <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Không có cuộc đua nào cần kiểm tra.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Vetting Checklist Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedRace ? (
            <div className="admin-card" style={{ border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div className="admin-card-head">
                <h3>Checklist kiểm tra: {selectedRace.name}</h3>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedRace(null)}>✕</button>
              </div>
              <div className="admin-card-body" style={{ padding: '20px' }}>
                
                {/* Race Vetting details */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#888' }}>Mã cuộc đua:</span>
                    <strong style={{ color: '#fff' }}>{selectedRace.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Trạng thái xuất phát:</span>
                    <StatusBadge status={selectedRace.status} />
                  </div>
                </div>

                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '12px', letterSpacing: '0.05em' }}>Danh sách kiểm định Ngựa & Jockey</h4>
                
                <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                  <table className="admin-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Ngựa & Jockey</th>
                        <th style={{ textAlign: 'center', width: '90px' }}>Y khoa & Doping</th>
                        <th style={{ textAlign: 'center', width: '90px' }}>Trang bị</th>
                        <th style={{ textAlign: 'center', width: '90px' }}>Cân nặng Nài</th>
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
                              disabled={selectedRace.status === 'ongoing'}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={h.gear}
                              onChange={() => handleToggleCheck(selectedRace.id, h.id, 'gear')}
                              disabled={selectedRace.status === 'ongoing'}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={h.weight}
                              onChange={() => handleToggleCheck(selectedRace.id, h.id, 'weight')}
                              disabled={selectedRace.status === 'ongoing'}
                            />
                          </td>
                        </tr>
                      ))}
                      {(!vettingData[selectedRace.id] || vettingData[selectedRace.id].length === 0) && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>Không có ngựa đăng ký cho chặng đua này.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedRace(null)}>Đóng</button>
                  {selectedRace.status === 'scheduled' && (
                    <button 
                      type="button" 
                      className="admin-btn admin-btn--gold"
                      onClick={() => handleApproveRaceStart(selectedRace.id)}
                      style={{ background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' }}
                    >
                      Duyệt Bắt Đầu Cuộc Đua
                    </button>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📋</span>
                <h4>Chưa chọn cuộc đua kiểm định</h4>
                <p style={{ fontSize: '12px', maxWidth: '300px', margin: '8px auto 0' }}>Vui lòng nhấp chọn một cuộc đua chưa xuất phát ở cột bên trái để thực hiện quy trình kiểm tra và chuẩn y.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Warning Confirmation Modal */}
      {showConfirmModal && (
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
          <div className="admin-card" style={{ width: '100%', maxWidth: '440px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div className="admin-card-head" style={{ borderBottom: 'none', padding: '20px 24px 10px' }}>
              <h3 style={{ color: '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Cảnh báo an toàn
              </h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => { setShowConfirmModal(false); setPendingRaceId(null); }}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '10px 24px 20px' }}>
              <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                Có ngựa đua chưa vượt qua toàn bộ tiêu chuẩn kiểm tra! Bạn vẫn muốn phê duyệt bắt đầu cuộc đua?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="admin-btn admin-btn--ghost" 
                  onClick={() => { setShowConfirmModal(false); setPendingRaceId(null); }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  className="admin-btn admin-btn--danger"
                  style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                  onClick={() => proceedApproveRaceStart(pendingRaceId)}
                >
                  Vẫn bắt đầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Success Confirmation Modal */}
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
            <h3 style={{ color: '#4ade80', marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Phê duyệt thành công!</h3>
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
    </div>
  )
}
