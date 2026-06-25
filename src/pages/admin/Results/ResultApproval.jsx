import React, { useState } from 'react'
import { resultReports as initialReports } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './ResultApproval.css'

// Mock ranking data for detailed report preview
const MOCK_REPORT_DETAILS = {
  'RES-801': [
    { rank: 1, horse: 'Aurelius', jockey: 'L. Anderson', time: '1m 38.4s' },
    { rank: 2, horse: 'Midnight Star', jockey: 'M. Rodriguez', time: '1m 39.1s' },
    { rank: 3, horse: 'Golden Eagle', jockey: 'S. Nakamura', time: '1m 39.8s' }
  ],
  'RES-802': [
    { rank: 1, horse: 'Midnight Star', jockey: 'M. Rodriguez', time: '1m 35.2s' },
    { rank: 2, horse: 'Aurelius', jockey: 'L. Anderson', time: '1m 35.9s' },
    { rank: 3, horse: 'Velvet Thunder', jockey: 'S. Nakamura', time: '1m 36.4s' }
  ],
  'RES-803': [
    { rank: 1, horse: 'Velvet Thunder', jockey: 'S. Nakamura', time: '1m 12.0s' },
    { rank: 2, horse: 'Midnight Star', jockey: 'M. Rodriguez', time: '1m 12.5s' },
    { rank: 3, horse: 'Storm Rider', jockey: 'L. Anderson', time: '1m 13.1s' }
  ]
}

export default function ResultApproval() {
  const [reports, setReports] = useState(() => {
    const stored = localStorage.getItem('mock_result_reports')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    localStorage.setItem('mock_result_reports', JSON.stringify(initialReports))
    return initialReports
  })
  const [selectedReport, setSelectedReport] = useState(null)

  const handleUpdateStatus = (id, newStatus) => {
    const updated = reports.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    )
    setReports(updated)
    localStorage.setItem('mock_result_reports', JSON.stringify(updated))
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport(prev => ({ ...prev, status: newStatus }))
    }
    
    if (newStatus === 'approved') {
      alert('Đã phê duyệt báo cáo kết quả! Bây giờ bạn có thể Công bố kết quả này.');
    } else if (newStatus === 'published') {
      alert('🎉 Đã công bố kết quả thi đấu thành công! Kết quả này đã được đồng bộ lên bảng xếp hạng công khai.');
    } else if (newStatus === 'rejected') {
      alert('Đã từ chối báo cáo kết quả từ trọng tài.');
    }
  }

  const getDetails = (id) => {
    return MOCK_REPORT_DETAILS[id] || []
  }

  return (
    <div className="result-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Duyệt & Công bố Kết quả</h1>
          <p className="admin-page-sub">Xem xét biên bản đua từ trọng tài, xác thực thứ hạng và công bố kết quả giải đấu</p>
        </div>
      </div>

      <div className="result-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {reports.map((r) => (
          <div key={r.id} className="admin-card result-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="result-card-head" style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="result-id" style={{ fontSize: '11px', color: '#666', marginRight: '6px' }}>#{r.id}</span>
                <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '15px' }}>{r.race}</h3>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="result-card-body" style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="result-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><label style={{ color: '#666' }}>Trọng tài báo cáo</label><span style={{ color: '#fff' }}>{r.referee}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><label style={{ color: '#666' }}>Ngày gửi biên bản</label><span style={{ color: '#fff' }}>{r.submitted}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><label style={{ color: '#666' }}>Ngựa về nhất</label><span className="result-winner" style={{ color: '#d4af37', fontWeight: 'bold' }}>{r.winner}</span></div>
              </div>
              <div className="admin-table-actions" style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => setSelectedReport(r)}
                  style={{ flex: 1 }}
                >
                  Xem biên bản
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details View Modal */}
      {selectedReport && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <div>
                <h3>Biên bản kết quả chi tiết</h3>
                <span style={{ fontSize: '11px', color: '#d4af37' }}>{selectedReport.race} (Mã: {selectedReport.id})</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13px' }}>
                <span style={{ color: '#666' }}>Trọng tài giám sát:</span>
                <strong style={{ color: '#fff' }}>{selectedReport.referee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
                <span style={{ color: '#666' }}>Ngày thi đấu:</span>
                <strong style={{ color: '#fff' }}>{selectedReport.submitted}</strong>
              </div>

              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d4af37', marginBottom: '10px', letterSpacing: '0.05em' }}>Thứ tự về đích đề xuất</h4>
              <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Hạng</th>
                      <th>Ngựa Đua</th>
                      <th>Jockey</th>
                      <th style={{ textAlign: 'right' }}>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDetails(selectedReport.id).map(d => (
                      <tr key={d.rank}>
                        <td style={{ fontWeight: 'bold', color: d.rank === 1 ? '#d4af37' : d.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>
                          🏆 Hạng {d.rank}
                        </td>
                        <td style={{ color: '#fff', fontWeight: '500' }}>{d.horse}</td>
                        <td>{d.jockey}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedReport(null)}>Đóng</button>
                {selectedReport.status === 'pending' && (
                  <>
                    <button 
                      type="button" 
                      className="admin-btn admin-btn--success"
                      onClick={() => handleUpdateStatus(selectedReport.id, 'approved')}
                    >
                      Duyệt báo cáo
                    </button>
                    <button 
                      type="button" 
                      className="admin-btn admin-btn--danger"
                      onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                    >
                      Từ chối
                    </button>
                  </>
                )}
                {selectedReport.status === 'approved' && (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--gold"
                    onClick={() => handleUpdateStatus(selectedReport.id, 'published')}
                  >
                    Công bố ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
