import React, { useState } from 'react'
import { mockPredictions as initialPools, mockUserPredictions as initialUserPreds } from '../../../data/adminMockData'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import './SpectatorPredictions.css'

const MOCK_HORSES_DETAILS = [
  { id: 1, name: 'Aurelius', age: 4, gender: 'Ngựa đực (Stallion)', breed: 'Thoroughbred', owner: 'Stable Alpha', wins: 12, races: 18, points: 2450 },
  { id: 2, name: 'Midnight Star', age: 5, gender: 'Ngựa cái (Mare)', breed: 'Arabian', owner: 'Blue Ridge Farm', wins: 9, races: 16, points: 2280 },
  { id: 3, name: 'Velvet Thunder', age: 3, gender: 'Ngựa thiến (Gelding)', breed: 'Quarter Horse', owner: 'Golden Hooves', wins: 15, races: 22, points: 2150 },
  { id: 4, name: 'Storm Rider', age: 4, gender: 'Ngựa đực (Stallion)', breed: 'Thoroughbred', owner: 'Wind Valley', wins: 6, races: 14, points: 1540 },
]

const MOCK_JOCKEYS_DETAILS = [
  { id: 1, name: 'L. Anderson', age: 28, experience: '12 năm', license: 'JOC-2024-001', wins: 320, races: 450, points: 3200 },
  { id: 2, name: 'M. Rodriguez', age: 24, experience: '8 năm', license: 'JOC-2023-089', wins: 289, races: 410, points: 2890 },
  { id: 3, name: 'S. Nakamura', age: 31, experience: '10 năm', license: 'JOC-2022-114', wins: 270, races: 395, points: 2700 },
  { id: 4, name: 'K. McEvoy', age: 22, experience: '5 năm', license: 'JOC-2025-023', wins: 120, races: 250, points: 1850 },
]

// Simulate runners for a selected race
const MOCK_RUNNERS = [
  { lane: 1, horse: 'Aurelius', jockey: 'L. Anderson' },
  { lane: 2, horse: 'Midnight Star', jockey: 'M. Rodriguez' },
  { lane: 3, horse: 'Velvet Thunder', jockey: 'S. Nakamura' },
  { lane: 4, horse: 'Storm Rider', jockey: 'K. McEvoy' }
]

export default function SpectatorPredictions() {
  const [pools, setPools] = useState(initialPools)
  const [selectedPool, setSelectedPool] = useState(null)

  // Selection states
  const [predictedHorse, setPredictedHorse] = useState('')
  const [ticketType, setTicketType] = useState('standard') // 'standard' or 'vip'

  // Modals state
  const [selectedHorseDetail, setSelectedHorseDetail] = useState(null)
  const [selectedJockeyDetail, setSelectedJockeyDetail] = useState(null)
  const [successModal, setSuccessModal] = useState(null)

  // Load profile from localStorage to check/deduct balance
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('spectator_profile')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    const INITIAL_PROFILE = {
      name: 'Hoang Van E',
      email: 'hoangvane@email.com',
      phone: '0987 654 321',
      balance: 5500000,
      joined: '2025-02-14',
      momoLinked: true
    }
    return INITIAL_PROFILE
  })

  // Load userPreds to append new predictions
  const [userPreds, setUserPreds] = useState(() => {
    const stored = localStorage.getItem('spectator_user_preds')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return initialUserPreds
  })

  const handleSelectPool = (pool) => {
    setSelectedPool(pool)
    setPredictedHorse('')
    setTicketType('standard')
  }

  const handleOpenHorseInfo = (horseName, e) => {
    e.stopPropagation()
    const found = MOCK_HORSES_DETAILS.find(h => h.name.toLowerCase() === horseName.toLowerCase()) || {
      name: horseName, age: 'Chưa cập nhật', gender: 'Chưa cập nhật', breed: 'Chưa rõ', owner: 'Không rõ', wins: 0, races: 0, points: 0
    }
    setSelectedHorseDetail(found)
  }

  const handleOpenJockeyInfo = (jockeyName, e) => {
    e.stopPropagation()
    const found = MOCK_JOCKEYS_DETAILS.find(j => j.name.toLowerCase() === jockeyName.toLowerCase()) || {
      name: jockeyName, age: 'Chưa cập nhật', experience: 'Chưa rõ', license: 'Chưa cấp', wins: 0, races: 0, points: 0
    }
    setSelectedJockeyDetail(found)
  }

  const handlePlaceBet = (e) => {
    e.preventDefault()
    if (!predictedHorse) {
      alert('Vui lòng chọn ngựa đua dự đoán thắng cuộc!')
      return
    }

    const finalAmount = ticketType === 'vip' ? 300000 : 100000
    const finalTypeName = ticketType === 'vip' ? 'VIP' : 'Standard'

    if (profile.balance < finalAmount) {
      alert(`⚠️ Số dư ví không đủ! Bạn cần ít nhất ${formatCurrency(finalAmount)} để mua vé này.`)
      return
    }

    // Deduct balance and sync to localStorage
    const updatedProfile = { ...profile, balance: profile.balance - finalAmount }
    setProfile(updatedProfile)
    localStorage.setItem('spectator_profile', JSON.stringify(updatedProfile))

    // Add new prediction entry and sync to localStorage
    const newPred = {
      id: Date.now(),
      race: selectedPool.raceName,
      amount: finalAmount,
      horse: predictedHorse,
      ticketType: finalTypeName,
      status: 'pending'
    }
    const updatedUserPreds = [newPred, ...userPreds]
    setUserPreds(updatedUserPreds)
    localStorage.setItem('spectator_user_preds', JSON.stringify(updatedUserPreds))

    // Update pool state locally
    setPools(pools.map(p =>
      p.id === selectedPool.id
        ? { ...p, totalPool: p.totalPool + finalAmount, participants: p.participants + 1 }
        : p
    ))

    setSuccessModal({
      race: selectedPool.raceName,
      ticketType: finalTypeName,
      horse: predictedHorse,
      amount: finalAmount
    })
    setSelectedPool(null)
  }

  return (
    <div className="spectator-predictions">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Mua Vé & Đặt Dự Đoán</h1>
          <p className="admin-page-sub">Xem chi tiết cuộc đua, thông tin ngựa chiến & jockey nài ngựa để đưa ra dự đoán chính xác nhất</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: List of Open Pools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Các cuộc đua đang mở cổng dự đoán</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pools.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPool(p)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: selectedPool?.id === p.id ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.05)',
                    background: selectedPool?.id === p.id ? 'rgba(212, 175, 55, 0.05)' : 'rgba(18, 18, 18, 0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="pool-item-card"
                >
                  <div>
                    <strong style={{ color: '#fff', fontSize: '15px', display: 'block' }}>{p.raceName}</strong>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                      <span>💰 Quỹ cược: <strong style={{ color: '#d4af37' }}>{formatCurrency(p.totalPool)}</strong></span>
                      <span style={{ marginLeft: '12px' }}>👥 {p.participants} vé</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <StatusBadge status={p.status} />
                    <span style={{ fontSize: '10px', color: '#666' }}>Hạn: {p.endDate.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Race & Prediction Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedPool ? (
            <div className="admin-card" style={{ border: '1px solid rgba(212, 175, 55, 0.25)' }}>
              <div className="admin-card-head">
                <h3>Chi tiết cuộc đua & Đặt mua vé</h3>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedPool(null)}>✕</button>
              </div>

              <div className="admin-card-body" style={{ padding: '20px' }}>
                {/* Race summary details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div><span style={{ color: '#888' }}>Cuộc đua:</span> <strong style={{ color: '#fff' }}>{selectedPool.raceName}</strong></div>
                  <div><span style={{ color: '#888' }}>Quỹ cược:</span> <strong style={{ color: '#d4af37' }}>{formatCurrency(selectedPool.totalPool)}</strong></div>
                  <div><span style={{ color: '#888' }}>Hạn đóng vé:</span> <strong style={{ color: '#fff' }}>{selectedPool.endDate}</strong></div>
                  <div><span style={{ color: '#888' }}>Số vé đã bán:</span> <strong style={{ color: '#fff' }}>{selectedPool.participants} vé</strong></div>
                </div>

                {/* Sơ đồ làn chạy (Runners) */}
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d4af37', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  Sơ đồ làn chạy & Thông tin ngựa/jockey
                </h4>

                <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                  <table className="admin-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Làn</th>
                        <th>Ngựa Đua</th>
                        <th>Jockey (Nài)</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Chọn dự đoán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_RUNNERS.map(r => (
                        <tr
                          key={r.lane}
                          onClick={() => setPredictedHorse(r.horse)}
                          style={{ cursor: 'pointer', background: predictedHorse === r.horse ? 'rgba(212, 175, 55, 0.04)' : 'transparent' }}
                        >
                          <td style={{ fontWeight: 'bold', color: '#d4af37' }}>#{r.lane}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#fff' }}>{r.horse}</strong>
                              <button
                                type="button"
                                className="info-icon-btn"
                                onClick={(e) => handleOpenHorseInfo(r.horse, e)}
                                title="Xem thông tin ngựa"
                              >
                                ℹ
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{r.jockey}</span>
                              <button
                                type="button"
                                className="info-icon-btn"
                                onClick={(e) => handleOpenJockeyInfo(r.jockey, e)}
                                title="Xem thông tin Jockey"
                              >
                                ℹ
                              </button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="radio"
                              name="predictedHorse"
                              checked={predictedHorse === r.horse}
                              onChange={() => setPredictedHorse(r.horse)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ticket and Prediction Booking Form */}
                <form onSubmit={handlePlaceBet} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="admin-form-label">1. Chọn loại vé xem đua</label>
                    <select
                      className="admin-select"
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="standard">Vé Thường (100.000 VND)</option>
                      <option value="vip">Vé VIP (300.000 VND)</option>
                    </select>
                    <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '4px' }}>
                      * Giá trị vé mua sẽ chính là số tiền đặt dự đoán cho chú ngựa được chọn.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Ngựa cược:</span>
                      <strong style={{ color: predictedHorse ? '#4ade80' : '#f87171', fontSize: '14px' }}>
                        {predictedHorse || 'Chưa chọn ngựa'}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Số dư ví:</span>
                      <strong style={{ color: '#fff', fontSize: '14px' }}>
                        {formatCurrency(profile.balance)}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Thanh toán:</span>
                      <strong style={{ color: '#d4af37', fontSize: '16px' }}>
                        {formatCurrency(ticketType === 'vip' ? 300000 : 100000)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(212,175,55,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.1)', fontSize: '12px', color: '#ccc' }}>
                    <strong style={{ color: '#d4af37', display: 'block', marginBottom: '2px' }}>ℹ️ Luật chia quỹ thưởng 10%:</strong>
                    Khi ngựa bạn dự đoán vô địch, bạn sẽ được nhận thưởng từ 10% tổng quỹ cược** của cuộc đua, được chia đều tương ứng theo tỷ trọng giá trị vé của những người thắng cược.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedPool(null)}>Hủy bỏ</button>
                    <button type="submit" className="admin-btn admin-btn--gold" disabled={!predictedHorse}>
                      Thanh toán & Đặt cược
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚖</span>
                <h4>Vui lòng chọn cuộc đua</h4>
                <p style={{ fontSize: '12px', maxWidth: '300px', margin: '8px auto 0' }}>Chọn một cuộc đua ở danh sách bên trái để xem chi tiết làn chạy và bắt đầu mua vé dự đoán.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Horse Detail Modal */}
      {selectedHorseDetail && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1050
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="admin-card-head">
              <h3>Thông Tin Chi Tiết Ngựa Đua</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedHorseDetail(null)}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 12px 0' }}>🏇 {selectedHorseDetail.name}</h3>
              <dl className="profile-info-dl" style={{ fontSize: '13px' }}>
                <dt>Độ tuổi</dt> <dd>{selectedHorseDetail.age} tuổi</dd>
                <dt>Giới tính</dt> <dd>{selectedHorseDetail.gender}</dd>
                <dt>Giống ngựa</dt> <dd>{selectedHorseDetail.breed}</dd>
                <dt>Chủ sở hữu (Stable)</dt> <dd>{selectedHorseDetail.owner}</dd>
                <dt>Thành tích toàn khóa</dt>
                <dd style={{ color: '#4ade80' }}>
                  {selectedHorseDetail.wins} trận thắng / {selectedHorseDetail.races} trận đấu ({((selectedHorseDetail.wins / selectedHorseDetail.races) * 100).toFixed(0)}% tỷ lệ thắng)
                </dd>
                <dt>Điểm phong độ tích lũy</dt> <dd style={{ color: '#d4af37', fontWeight: 'bold' }}>{selectedHorseDetail.points} PTS</dd>
              </dl>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedHorseDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jockey Detail Modal */}
      {selectedJockeyDetail && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1050
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="admin-card-head">
              <h3>Thông Tin Chi Tiết Nài Ngựa (Jockey)</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedJockeyDetail(null)}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 12px 0' }}>👤 {selectedJockeyDetail.name}</h3>
              <dl className="profile-info-dl" style={{ fontSize: '13px' }}>
                <dt>Mã số License</dt> <dd><code>{selectedJockeyDetail.license}</code></dd>
                <dt>Độ tuổi</dt> <dd>{selectedJockeyDetail.age} tuổi</dd>
                <dt>Kinh nghiệm thi đấu</dt> <dd>{selectedJockeyDetail.experience}</dd>
                <dt>Thành tích toàn khóa</dt>
                <dd style={{ color: '#4ade80' }}>
                  {selectedJockeyDetail.wins} chiến thắng / {selectedJockeyDetail.races} trận đua
                </dd>
                <dt>Điểm số phong độ</dt> <dd style={{ color: '#d4af37', fontWeight: 'bold' }}>{selectedJockeyDetail.points} PTS</dd>
              </dl>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedJockeyDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1100
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '420px', border: '1px solid rgba(74, 222, 128, 0.3)', background: '#121212', textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👍</div>
            <h3 style={{ color: '#4ade80', marginBottom: '20px', fontSize: '18px' }}>Đặt dự đoán và mua vé thành công!</h3>
            
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>
              <div><span style={{ color: '#888' }}>- Cuộc đua:</span> <strong style={{ color: '#fff' }}>{successModal.race}</strong></div>
              <div><span style={{ color: '#888' }}>- Loại vé:</span> <strong style={{ color: '#fff' }}>Vé {successModal.ticketType}</strong></div>
              <div><span style={{ color: '#888' }}>- Ngựa dự đoán:</span> <strong style={{ color: '#fff' }}>{successModal.horse}</strong></div>
              <div><span style={{ color: '#888' }}>- Tổng thanh toán:</span> <strong style={{ color: '#d4af37' }}>{formatCurrency(successModal.amount)}</strong></div>
              <div><span style={{ color: '#888' }}>- Số dư ví còn lại:</span> <strong style={{ color: '#4ade80' }}>{formatCurrency(profile.balance)}</strong></div>
            </div>

            <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px' }}>
              (Bạn có thể xem lịch sử vé đã mua tại trang "Tài Khoản Cá Nhân")
            </p>

            <button 
              type="button" 
              className="admin-btn admin-btn--gold" 
              style={{ width: '100%', padding: '10px' }}
              onClick={() => setSuccessModal(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
