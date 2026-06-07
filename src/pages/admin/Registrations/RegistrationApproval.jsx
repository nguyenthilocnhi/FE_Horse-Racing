import React, { useState } from 'react'
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
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [selectedReg, setSelectedReg] = useState(null)
  
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
    alert(newStatus === 'approved' ? 'Đã duyệt đăng ký thành công!' : 'Đã từ chối đăng ký!')
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
    </div>
  )
}
