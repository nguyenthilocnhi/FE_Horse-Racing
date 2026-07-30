import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getPostRaceReports, getRaceResults, publishRaceResults, getRaces } from '../../../services/raceService'
import './ResultApproval.css'

export default function ResultApproval() {
  const [reports, setReports] = useState([])
  const [races, setRaces] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [details, setDetails] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [racesRes, reportsRes] = await Promise.all([
        getRaces(),
        getPostRaceReports()
      ])

      if (racesRes.data) {
        setRaces(racesRes.data)
      }

      if (reportsRes.data) {
        const mappedReports = reportsRes.data
          .filter(r => r.status !== 'PUBLISHED')
          .map(r => {
            const race = racesRes.data?.find(rc => rc.id === r.raceId)

            let st = 'pending'
            if (r.status === 'REVIEW') st = 'approved'
            else if (r.status === 'SUBMITTED') st = 'pending'

            return {
              id: r.id,
              raceId: r.raceId,
              race: race ? race.name : `Cuộc đua #${r.raceId}`,
              referee: race ? race.refereeName : 'Không xác định',
              submitted: new Date(r.createdAt).toLocaleString(),
              winner: 'Chưa xác định',
              status: st,
              originalStatus: r.status
            }
          })
        setReports(mappedReports)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleViewReport = async (report) => {
    setSelectedReport(report)
    setDetails([])
    setIsLoading(true)
    try {
      const res = await getRaceResults(report.raceId)
      if (res.data) {
        const sorted = res.data.sort((a, b) => a.rankPosition - b.rankPosition)
        const mappedDetails = sorted.map(d => ({
          rank: d.rankPosition,
          horse: d.horseName || `Ngựa #${d.horseId}`,
          jockey: 'Nài ngựa', // Placeholder if jockey name is not in DTO
          time: d.finishTime
        }))
        setDetails(mappedDetails)

        if (mappedDetails.length > 0) {
          const winnerName = mappedDetails[0].horse;
          setReports(prev => prev.map(r => r.id === report.id ? { ...r, winner: winnerName } : r))
          setSelectedReport(prev => ({ ...prev, winner: winnerName }))
        }
      }
    } catch (err) {
      console.error(err)
      alert('Không thể tải chi tiết kết quả')
    } finally {
      setIsLoading(false)
    }
  }

  const processAction = async () => {
    if (!confirmAction) return
    const { type, id, raceId } = confirmAction

    if (type === 'publish') {
      try {
        await publishRaceResults(raceId)
        alert('🎉 Đã công bố kết quả thi đấu thành công!\n\n- Kết quả đã đồng bộ lên Bảng xếp hạng công khai.\n- Hệ thống đã ghi nhận kết quả dự đoán của khán giả & kết toán trả thưởng tự động.\n- Cuộc đua đã chuyển sang trạng thái HOÀN THÀNH.')
        setReports(prev => prev.filter(r => r.id !== id))
        setSelectedReport(null)
      } catch (err) {
        alert('Có lỗi xảy ra khi công bố: ' + (err.response?.data?.message || err.message))
      }
    } else if (type === 'approve') {
      const updated = reports.map(r =>
        r.id === id ? { ...r, status: 'approved' } : r
      )
      setReports(updated)
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(prev => ({ ...prev, status: 'approved' }))
      }
    }
    setConfirmAction(null)
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
                  onClick={() => handleViewReport(r)}
                  style={{ flex: 1 }}
                >
                  Xem biên bản
                </button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', gridColumn: '1 / -1' }}>
            Không có báo cáo kết quả nào chờ duyệt.
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedReport && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
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

              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d4af37', marginBottom: '10px', letterSpacing: '0.05em' }}>Thứ tự về đích</h4>
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
                    {isLoading ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                    ) : details.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu kết quả</td></tr>
                    ) : details.map(d => (
                      <tr key={d.rank}>
                        <td style={{ fontWeight: 'bold', color: d.rank === 1 ? '#d4af37' : d.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>
                          {d.rank === 1 ? '🏆 ' : ''}Hạng {d.rank}
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
                  <button
                    type="button"
                    className="admin-btn admin-btn--success"
                    onClick={() => setConfirmAction({ type: 'approve', id: selectedReport.id, raceId: selectedReport.raceId })}
                  >
                    Duyệt kết quả
                  </button>
                )}

                {selectedReport.status === 'approved' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--gold"
                    onClick={() => setConfirmAction({ type: 'publish', id: selectedReport.id, raceId: selectedReport.raceId })}
                  >
                    Công bố kết quả
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', border: confirmAction.type === 'approve' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(212,175,55,0.3)' }}>
            <div className="admin-card-head">
              <h3 style={{ color: confirmAction.type === 'approve' ? '#22c55e' : '#d4af37' }}>
                Xác nhận thao tác
              </h3>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              <p style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
                {confirmAction.type === 'approve'
                  ? "Bạn có chắc chắn muốn duyệt kết quả này không?"
                  : "Bạn có chắc chắn muốn công bố? Dữ liệu sẽ hiển thị cho khán giả."}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setConfirmAction(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className={`admin-btn ${confirmAction.type === 'approve' ? 'admin-btn--success' : 'admin-btn--gold'}`}
                  onClick={processAction}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
