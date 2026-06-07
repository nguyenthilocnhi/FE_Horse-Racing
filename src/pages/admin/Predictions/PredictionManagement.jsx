import React, { useState } from 'react'
import { mockPredictions as initialPredictions, mockUserPredictions as initialUserPredictions } from '../../../data/adminMockData'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import './PredictionManagement.css'

export default function PredictionManagement() {
  const [predictions, setPredictions] = useState(initialPredictions)
  const [userPredictions, setUserPredictions] = useState(initialUserPredictions)
  const [selectedRacePred, setSelectedRacePred] = useState(null)
  
  // Distribute rewards modal
  const [rewardModalOpen, setRewardModalOpen] = useState(false)
  const [rewardingRace, setRewardingRace] = useState(null)
  const [winningHorse, setWinningHorse] = useState('')

  // Candidate horses for calculation (fetched from race winner lists/referee approvals)
  const candidateHorses = ['Aurelius', 'Midnight Star', 'Velvet Thunder', 'Storm Rider']

  const handleClosePrediction = (id) => {
    setPredictions(predictions.map(p => 
      p.id === id ? { ...p, status: 'closed' } : p
    ))
    if (selectedRacePred && selectedRacePred.id === id) {
      setSelectedRacePred(prev => ({ ...prev, status: 'closed' }))
    }
    alert('Đã đóng cổng dự đoán thành công! Người dùng không thể đặt cược thêm.');
  }

  const handleOpenRewardModal = (pred) => {
    setRewardingRace(pred)
    setWinningHorse('')
    setRewardModalOpen(true)
  }

  const handleDistributeRewards = (e) => {
    e.preventDefault()
    if (!winningHorse) {
      alert('Vui lòng chọn ngựa chiến thắng để tính toán!')
      return
    }

    const raceId = rewardingRace.raceId
    const raceName = rewardingRace.raceName
    const racePool = rewardingRace.totalPool

    // Total reward pool is 5% of total bets of this race
    const rewardBudget = 0.05 * racePool

    // Find all users who bet on the winning horse
    const winnersForRace = userPredictions.filter(up => up.race === raceName && up.horse === winningHorse)
    const totalWinningBets = winnersForRace.reduce((sum, w) => sum + w.amount, 0)

    // Update the main prediction status
    setPredictions(predictions.map(p => 
      p.id === rewardingRace.id 
        ? { ...p, status: 'distributed', winner: winningHorse } 
        : p
    ))

    // Update user predictions status for this race
    let wonCount = 0
    let totalPayout = 0
    const updatedUserPreds = userPredictions.map(up => {
      if (up.race === raceName) {
        if (up.horse === winningHorse) {
          // Payout is proportional to the ticket price
          const payout = totalWinningBets > 0
            ? Math.round(rewardBudget * (up.amount / totalWinningBets))
            : 0
          wonCount++
          totalPayout += payout
          return { ...up, status: 'won', payout }
        } else {
          return { ...up, status: 'lost', payout: 0 }
        }
      }
      return up
    })

    setUserPredictions(updatedUserPreds)
    setRewardModalOpen(false)
    
    // If selected view is the active race, update it
    if (selectedRacePred && selectedRacePred.id === rewardingRace.id) {
      setSelectedRacePred({ ...selectedRacePred, status: 'distributed', winner: winningHorse })
    }

    alert(`🎉 Trả thưởng thành công!\n- Ngựa thắng: ${winningHorse}\n- Tổng quỹ đua: ${formatCurrency(racePool)}\n- 5% Quỹ chia sẻ: ${formatCurrency(rewardBudget)}\n- Số lượt trúng: ${wonCount}\n- Tổng tiền trả thưởng thực tế: ${formatCurrency(totalPayout)}`);
  }

  // Filter user predictions for the selected race
  const activeUserPreds = selectedRacePred 
    ? userPredictions.filter(up => up.race === selectedRacePred.raceName)
    : []

  return (
    <div className="prediction-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Dự đoán kết quả</h1>
          <p className="admin-page-sub">Quản lý các cổng dự đoán, khóa cược trước giờ đua và tính toán trả thưởng cho người dùng</p>
        </div>
      </div>

      <div className="user-mgmt-layout" style={{ display: 'grid', gridTemplateColumns: selectedRacePred ? '1fr 360px' : '1fr', gap: '20px' }}>
        <div className="admin-card user-mgmt-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã phiên</th>
                  <th>Tên Race</th>
                  <th>Tổng quỹ cược (Pool)</th>
                  <th>Lượt tham gia</th>
                  <th>Thời gian đóng cược</th>
                  <th>Ngựa thắng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id}</code></td>
                    <td><strong style={{ color: '#fff' }}>{p.raceName}</strong></td>
                    <td style={{ color: '#d4af37', fontWeight: '600' }}>{formatCurrency(p.totalPool)}</td>
                    <td>{p.participants} người</td>
                    <td>{p.endDate}</td>
                    <td>{p.winner ? <strong style={{ color: '#4ade80' }}>🏆 {p.winner}</strong> : <span style={{ color: '#555' }}>--</span>}</td>
                    <td>
                      <StatusBadge status={p.status === 'distributed' ? 'published' : p.status} />
                    </td>
                    <td>
                      <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => setSelectedRacePred(p)}
                        >
                          Chi tiết
                        </button>
                        {p.status === 'open' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleClosePrediction(p.id)}
                          >
                            Đóng cược
                          </button>
                        )}
                        {(p.status === 'closed' || p.status === 'open') && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--gold admin-btn--sm"
                            onClick={() => handleOpenRewardModal(p)}
                          >
                            Trả thưởng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRacePred && (
          <div className="admin-card user-detail-panel">
            <div className="admin-card-head">
              <h3>Thống kê cược</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setSelectedRacePred(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '15px' }}>{selectedRacePred.raceName}</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px 0' }}>Mã cuộc đua: {selectedRacePred.raceId}</p>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#666' }}>Tổng quỹ cược:</span>
                  <strong style={{ color: '#d4af37' }}>{formatCurrency(selectedRacePred.totalPool)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#666' }}>Tổng số phiếu:</span>
                  <strong style={{ color: '#fff' }}>{selectedRacePred.participants} phiếu</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Trạng thái:</span>
                  <StatusBadge status={selectedRacePred.status === 'distributed' ? 'published' : selectedRacePred.status} />
                </div>
              </div>

              <h5 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', color: '#d4af37', letterSpacing: '0.05em' }}>Danh sách phiếu dự đoán</h5>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', paddingRight: '4px' }}>
                {activeUserPreds.length > 0 ? (
                  activeUserPreds.map(up => (
                    <div 
                      key={up.id} 
                      style={{ 
                        background: 'rgba(0,0,0,0.15)', 
                        padding: '10px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255,255,255,0.03)',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#fff' }}>{up.user}</strong>
                        <span style={{ color: '#d4af37' }}>{formatCurrency(up.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                        <span>Dự đoán: <strong>{up.horse}</strong></span>
                        <span>
                          {up.status === 'won' && <span style={{ color: '#4ade80', fontWeight: '600' }}>+{formatCurrency(up.payout)}</span>}
                          {up.status === 'lost' && <span style={{ color: '#f87171' }}>Thua</span>}
                          {up.status === 'pending' && <span style={{ color: '#e6c564' }}>Chờ KQ</span>}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#555', fontSize: '12px' }}>Không có lượt dự đoán nào cho race này</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rewards Calculator Modal */}
      {rewardModalOpen && (
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
          <div className="admin-card" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <h3>Tính toán & Trả thưởng dự đoán</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setRewardModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleDistributeRewards} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(212,175,55,0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.15)', fontSize: '13px', color: '#e5e5e5' }}>
                Chọn ngựa chiến thắng thực tế từ báo cáo trọng tài đã duyệt. Hệ thống sẽ tự động quét toàn bộ các phiếu dự đoán của người dùng và chuyển tiền/điểm thưởng cho người dự đoán đúng.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Cuộc đua</label>
                <input className="admin-input" disabled value={rewardingRace?.raceName} style={{ width: '100%', opacity: 0.7 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Chọn Ngựa Chiến Thắng</label>
                <select 
                  required
                  className="admin-select"
                  value={winningHorse}
                  onChange={(e) => setWinningHorse(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Chọn ngựa chiến thắng --</option>
                  {candidateHorses.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setRewardModalOpen(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--gold">🚀 Tính & Trả Thưởng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
