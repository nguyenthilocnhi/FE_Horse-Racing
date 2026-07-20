import React, { useState } from 'react'
import { ownerJockeys as initialJockeys, ownerHorses } from '../../../data/ownerMockData'

export default function OwnerJockeys() {
  const [jockeys, setJockeys] = useState(initialJockeys)
  const [hireModal, setHireModal] = useState(false)
  const [selectedJockey, setSelectedJockey] = useState(null)
  
  // Hiring Form fields
  const [selectedHorseId, setSelectedHorseId] = useState('')
  const [offeredFee, setOfferedFee] = useState('')
  const [message, setMessage] = useState('')

  const openHireModal = (jockey) => {
    setSelectedJockey(jockey)
    setOfferedFee(jockey.fee.replace(' VND', ''))
    // Find horses without a jockey or ready horses
    const freeHorses = ownerHorses.filter(h => h.status === 'ready' && !h.currentJockey)
    if (freeHorses.length > 0) {
      setSelectedHorseId(freeHorses[0].id)
    } else {
      setSelectedHorseId(ownerHorses[0]?.id || '')
    }
    setHireModal(true)
  }

  const handleSendInvitation = (e) => {
    e.preventDefault()
    if (!selectedJockey) return

    setJockeys(jockeys.map(j => {
      if (j.id === selectedJockey.id) {
        return { 
          ...j, 
          status: 'pending', 
          assignedHorse: ownerHorses.find(h => h.id === selectedHorseId)?.name || 'Chưa rõ' 
        }
      }
      return j
    }))

    alert(`Gửi lời mời thành công đến Jockey ${selectedJockey.name}!`)
    setHireModal(false)
  }

  const handleCancelInvite = (jockeyId) => {
    setJockeys(jockeys.map(j => {
      if (j.id === jockeyId) {
        return { ...j, status: 'available', assignedHorse: null }
      }
      return j
    }))
  }

  return (
    <div className="own-jockeys">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Quản lý danh sách Jockey 🏇</h1>
          <p className="owner-page-sub">Tìm kiếm, thuê nài ngựa cho chiến mã và quản lý các hợp đồng thi đấu.</p>
        </div>
      </div>

      {/* Section 1: Hired & Pending Jockeys */}
      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Đội ngũ Jockey của bạn ({jockeys.filter(j => j.status === 'hired' || j.status === 'pending').length})</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Jockey</th>
                <th>Tỉ lệ thắng</th>
                <th>Phí yêu cầu</th>
                <th>Đánh giá</th>
                <th>Chiến mã đảm nhận</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {jockeys.filter(j => j.status === 'hired' || j.status === 'pending').map((jockey) => (
                <tr key={jockey.id}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{jockey.name}</td>
                  <td>{jockey.winRate}% (Thắng {jockey.wins}/{jockey.races} trận)</td>
                  <td>{jockey.fee}</td>
                  <td style={{ color: '#d4af37' }}>★ {jockey.rating}</td>
                  <td>{jockey.assignedHorse || 'Chưa chỉ định'}</td>
                  <td>
                    <span className={`owner-badge owner-badge--${jockey.status === 'hired' ? 'green' : 'blue'}`}>
                      {jockey.status === 'hired' ? 'Đang hợp đồng' : 'Chờ phản hồi'}
                    </span>
                  </td>
                  <td>
                    {jockey.status === 'pending' ? (
                      <button 
                        className="owner-btn owner-btn--danger owner-btn--sm"
                        onClick={() => handleCancelInvite(jockey.id)}
                      >
                        Hủy lời mời
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#666' }}>Hợp đồng đang chạy</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Directory / Hire New */}
      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Thư viện Jockey tự do</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Jockey</th>
                <th>Kinh nghiệm</th>
                <th>Phí thi đấu</th>
                <th>Đánh giá</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {jockeys.filter(j => j.status === 'available').map((jockey) => (
                <tr key={jockey.id}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{jockey.name}</td>
                  <td>{jockey.races} trận đã đấu</td>
                  <td>{jockey.fee}</td>
                  <td style={{ color: '#d4af37' }}>★ {jockey.rating}</td>
                  <td>
                    <button className="owner-btn owner-btn--gold owner-btn--sm" onClick={() => openHireModal(jockey)}>
                      Gửi lời mời hợp đồng
                    </button>
                  </td>
                </tr>
              ))}
              {jockeys.filter(j => j.status === 'available').length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#555', padding: 20 }}>
                    Không còn jockey tự do nào khả dụng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hire Modal */}
      {hireModal && selectedJockey && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Đề nghị thuê Jockey: {selectedJockey.name}</h2>
              <button className="owner-modal-close" onClick={() => setHireModal(false)}>×</button>
            </div>
            <form onSubmit={handleSendInvitation}>
              <div className="owner-modal-body">
                <div className="owner-form-grid">
                  <div className="owner-form-group full">
                    <label className="owner-label">Chiến mã ghép đôi</label>
                    <select 
                      className="owner-select"
                      value={selectedHorseId}
                      onChange={(e) => setSelectedHorseId(e.target.value)}
                    >
                      {ownerHorses.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.breed})</option>
                      ))}
                    </select>
                  </div>
                  <div className="owner-form-group full">
                    <label className="owner-label">Phí đề nghị (VND)</label>
                    <input 
                      type="text" 
                      className="owner-input"
                      value={offeredFee}
                      onChange={(e) => setOfferedFee(e.target.value)}
                      placeholder="Ví dụ: 15,000,000"
                    />
                  </div>
                  <div className="owner-form-group full">
                    <label className="owner-label">Tin nhắn đính kèm</label>
                    <textarea 
                      className="owner-input"
                      style={{ minHeight: 80, resize: 'vertical' }}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ghi chú thêm yêu cầu cho jockey..."
                    />
                  </div>
                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setHireModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Gửi lời mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
