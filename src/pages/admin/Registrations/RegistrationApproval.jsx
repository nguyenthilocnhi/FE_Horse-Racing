import React, { useState, useEffect } from 'react'
import { registrations as initialRegistrations } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RegistrationApproval.css'

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function RegistrationApproval() {
  const [tab, setTab] = useState('pending')
  const [registrations, setRegistrations] = useState(() => {
    const stored = localStorage.getItem('mock_registrations')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    localStorage.setItem('mock_registrations', JSON.stringify(initialRegistrations))
    return initialRegistrations
  })

  useEffect(() => {
    const syncRegs = () => {
      const stored = localStorage.getItem('mock_registrations')
      if (stored) {
        try {
          setRegistrations(JSON.parse(stored))
        } catch (e) {
          console.error(e)
        }
      }
    }
    window.addEventListener('storage', syncRegs)
    return () => window.removeEventListener('storage', syncRegs)
  }, [])

  const [selectedReg, setSelectedReg] = useState(null)
  const [zoomedImg, setZoomedImg] = useState(null)
  
  // Checklist state for selected registration
  const [checklist, setChecklist] = useState({
    breedOk: false,
    healthOk: false,
    dopingClear: false
  })

  const filtered = tab === 'all'
    ? registrations
    : registrations.filter((r) => r.status === tab)

  const handleSelectReg = (r) => {
    setSelectedReg(r)
    // reset checklist
    setChecklist({
      breedOk: r.status === 'approved',
      healthOk: r.status === 'approved',
      dopingClear: r.status === 'approved'
    })
  }

  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === 'approved' && (!checklist.breedOk || !checklist.healthOk || !checklist.dopingClear)) {
      alert('Vui lòng kiểm tra và tích chọn toàn bộ Checklist trước khi phê duyệt!')
      return
    }

    const updated = registrations.map(r => {
      if (r.id === id) {
        const nextReg = { ...r, status: newStatus }
        if (selectedReg && selectedReg.id === id) {
          setSelectedReg(nextReg)
        }
        return nextReg
      }
      return r
    })
    setRegistrations(updated)
    localStorage.setItem('mock_registrations', JSON.stringify(updated))

    // ── Update the owner's horse status inside localStorage ──
    const targetReg = registrations.find(r => r.id === id)
    if (targetReg) {
      const horseName = targetReg.horse
      // Search all owner horses in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('owner_horses_')) {
          try {
            const ownerHorses = JSON.parse(localStorage.getItem(key) || '[]')
            let modified = false
            const nextOwnerHorses = ownerHorses.map(h => {
              if (h.name === horseName) {
                modified = true
                return { ...h, status: newStatus === 'approved' ? 'ready' : 'resting' }
              }
              return h
            })
            if (modified) {
              localStorage.setItem(key, JSON.stringify(nextOwnerHorses))
            }
          } catch (e) {
            console.error('Lỗi khi cập nhật trạng thái ngựa của owner trong localStorage:', e)
          }
        }
      }

      // Also update the matching race status in owner_races inside localStorage
      const storedRaces = localStorage.getItem('owner_races')
      if (storedRaces) {
        try {
          const currentRaces = JSON.parse(storedRaces)
          const updatedRaces = currentRaces.map(r => {
            if (r.registeredHorse === horseName) {
              return {
                ...r,
                status: newStatus === 'approved' ? 'registered' : 'upcoming',
                registeredHorse: newStatus === 'approved' ? horseName : null
              }
            }
            return r
          })
          localStorage.setItem('owner_races', JSON.stringify(updatedRaces))
        } catch (e) {
          console.error(e)
        }
      }

      // ── Send a notification to the owner ──
      const notifs = JSON.parse(localStorage.getItem('owner_notifications') || '[]')
      const timestamp = new Date().toLocaleString('vi-VN')
      if (newStatus === 'approved') {
        notifs.unshift({
          id: `NOTIF-${Date.now()}`,
          title: 'Đăng ký được phê duyệt 💚',
          message: `Chiến mã "${horseName}" đăng ký tham gia giải đấu "${targetReg.race}" đã được duyệt thành công! Ngựa đủ điều kiện tham gia.`,
          type: 'success',
          timestamp
        })
      } else if (newStatus === 'rejected') {
        notifs.unshift({
          id: `NOTIF-${Date.now()}`,
          title: 'Đăng ký bị từ chối ❌',
          message: `Yêu cầu đăng ký chiến mã "${horseName}" tham gia giải đấu "${targetReg.race}" đã bị từ chối xét duyệt.`,
          type: 'danger',
          timestamp
        })
      }
      localStorage.setItem('owner_notifications', JSON.stringify(notifs))
    }

    alert(newStatus === 'approved' ? 'Đã duyệt đăng ký thành công!' : newStatus === 'rejected' ? 'Đã từ chối đăng ký!' : 'Đã trả hồ sơ về hàng chờ!')
  }

  return (
    <div className="registration-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Duyệt Đăng ký tham gia</h1>
          <p className="admin-page-sub">Kiểm tra thông số kỹ thuật, hồ sơ y tế ngựa đua và phê duyệt tham gia</p>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="user-mgmt-layout" style={{ display: 'grid', gridTemplateColumns: selectedReg ? '1fr 340px' : '1fr', gap: '20px' }}>
        <div className="admin-card user-mgmt-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã ĐK</th>
                  <th>Ngựa Đua</th>
                  <th>Chủ stables</th>
                  <th>Race đăng ký</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><strong>{r.horse}</strong></td>
                    <td>{r.owner}</td>
                    <td>{r.race}</td>
                    <td>{r.submitted}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="admin-table-actions">
                        <button 
                          type="button" 
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => handleSelectReg(r)}
                        >
                          Chi tiết
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button 
                              type="button" 
                              className="admin-btn admin-btn--success admin-btn--sm"
                              onClick={() => {
                                handleSelectReg(r)
                                // Auto check for convenience in demo, but still show modal
                                setChecklist({ breedOk: true, healthOk: true, dopingClear: true })
                              }}
                            >
                              Duyệt nhanh
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedReg && (
          <div className="admin-card user-detail-panel">
            <div className="admin-card-head">
              <h3>Kiểm hồ sơ Đăng ký</h3>
              <button 
                type="button" 
                className="admin-btn admin-btn--ghost admin-btn--sm" 
                onClick={() => setSelectedReg(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-card-body">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(212,175,55,0.1)',
                  color: '#d4af37',
                  fontSize: '24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>📋</div>
                <h4 style={{ color: '#fff', margin: '0 0 4px 0' }}>{selectedReg.horse}</h4>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Đăng ký ID: {selectedReg.id}</p>
              </div>

              <dl className="user-detail-dl" style={{ fontSize: '13px', marginBottom: '20px' }}>
                <dt>Stable / Chủ sở hữu</dt>
                <dd>{selectedReg.owner}</dd>
                <dt>Race mong muốn</dt>
                <dd>{selectedReg.race}</dd>
                <dt>Ngày nộp hồ sơ</dt>
                <dd>{selectedReg.submitted}</dd>
                <dt>Trạng thái</dt>
                <dd><StatusBadge status={selectedReg.status} /></dd>
              </dl>

              {/* Document Previews */}
              <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d4af37' }}>Tài liệu đính kèm</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  
                  {/* Horse Image */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Ảnh ngựa</div>
                    {selectedReg.horseImageUrl ? (
                      <img 
                        src={selectedReg.horseImageUrl} 
                        alt="Ảnh chiến mã" 
                        style={{ width: '100%', height: '56px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setZoomedImg(selectedReg.horseImageUrl)}
                      />
                    ) : (
                      <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Chưa có
                      </div>
                    )}
                  </div>

                  {/* Birth Certificate */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Khai sinh</div>
                    {selectedReg.birthCertificateUrl ? (
                      <img 
                        src={selectedReg.birthCertificateUrl} 
                        alt="Giấy khai sinh" 
                        style={{ width: '100%', height: '56px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setZoomedImg(selectedReg.birthCertificateUrl)}
                      />
                    ) : (
                      <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Chưa có
                      </div>
                    )}
                  </div>

                  {/* Medical Certificate */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Giấy y tế</div>
                    {selectedReg.medicalCertificateUrl ? (
                      <img 
                        src={selectedReg.medicalCertificateUrl} 
                        alt="Chứng nhận y tế" 
                        style={{ width: '100%', height: '56px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setZoomedImg(selectedReg.medicalCertificateUrl)}
                      />
                    ) : (
                      <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Chưa có
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {selectedReg.status === 'pending' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d4af37' }}>Checklist xác minh</h5>
                  
                  <label style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#ccc', cursor: 'pointer', marginBottom: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={checklist.breedOk}
                      onChange={(e) => setChecklist({ ...checklist, breedOk: e.target.checked })}
                      style={{ accentColor: '#d4af37' }}
                    />
                    Giấy khai sinh giống loài hợp lệ
                  </label>

                  <label style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#ccc', cursor: 'pointer', marginBottom: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={checklist.healthOk}
                      onChange={(e) => setChecklist({ ...checklist, healthOk: e.target.checked })}
                      style={{ accentColor: '#d4af37' }}
                    />
                    Chứng nhận y tế đạt chuẩn
                  </label>

                  <label style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#ccc', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={checklist.dopingClear}
                      onChange={(e) => setChecklist({ ...checklist, dopingClear: e.target.checked })}
                      style={{ accentColor: '#d4af37' }}
                    />
                    Thông qua xét nghiệm doping
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedReg.status === 'pending' ? (
                  <>
                    <button 
                      type="button" 
                      className="admin-btn admin-btn--success" 
                      style={{ flex: 1 }}
                      onClick={() => handleUpdateStatus(selectedReg.id, 'approved')}
                    >
                      Duyệt hồ sơ
                    </button>
                    <button 
                      type="button" 
                      className="admin-btn admin-btn--danger" 
                      style={{ flex: 1 }}
                      onClick={() => handleUpdateStatus(selectedReg.id, 'rejected')}
                    >
                      Từ chối
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--outline" 
                    style={{ flex: 1 }}
                    onClick={() => handleUpdateStatus(selectedReg.id, 'pending')}
                  >
                    Hoàn lại Chờ Duyệt
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Zoom Overlay */}
      {zoomedImg && (
        <div 
          onClick={() => setZoomedImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={zoomedImg} 
            alt="Phóng to tài liệu" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              objectFit: 'contain', 
              borderRadius: '8px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
            }} 
          />
        </div>
      )}
    </div>
  )
}
