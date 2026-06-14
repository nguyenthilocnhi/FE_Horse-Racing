import React, { useState } from 'react'
import { mockUserPredictions as initialUserPreds } from '../../../data/adminMockData'
import { formatCurrency } from '../../../utils/adminHelpers'
import './SpectatorProfile.css'

const INITIAL_PROFILE = {
  name: 'Hoang Van E',
  email: 'hoangvane@email.com',
  phone: '0987 654 321',
  balance: 5500000,
  joined: '2025-02-14',
  momoLinked: true
}

const MOCK_NOTIFICATIONS = [
  { id: 1, text: '🎉 Chúc mừng! Dự đoán của bạn cho "Sprint Classic" chính xác. Nhận thưởng +18,000,000 VND.', date: 'Hôm nay 10:20', read: false },
  { id: 2, text: '💰 Tiền thưởng dự đoán đã được chuyển vào tài khoản ví MoMo liên kết.', date: 'Hôm nay 10:21', read: false },
  { id: 3, text: '⚖️ Phiên mua vé cuộc đua "Derby Một Dặm" đã được mở. Mua vé tham gia ngay!', date: 'Hôm qua', read: true }
]

export default function SpectatorProfile() {
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('spectator_profile')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_PROFILE
  })
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ ...profile })
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [depositAmount, setDepositAmount] = useState('')

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    setProfile({ ...formData })
    localStorage.setItem('spectator_profile', JSON.stringify(formData))
    setIsEditing(false)
    alert('✅ Cập nhật thông tin tài khoản thành công!')
  }

  const handleDeposit = (e) => {
    e.preventDefault()
    const amount = parseInt(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Vui lòng nhập số tiền nạp hợp lệ!')
      return
    }
    const updated = { ...profile, balance: profile.balance + amount }
    setProfile(updated)
    localStorage.setItem('spectator_profile', JSON.stringify(updated))
    setDepositAmount('')
    alert(`💳 Nạp tiền thành công! Đã cộng ${formatCurrency(amount)} vào tài khoản.`);
  }

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  return (
    <div className="spectator-profile-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản Lý Tài Khoản</h1>
          <p className="admin-page-sub">Xem thông tin cá nhân, số dư ví, quản lý giao dịch và lịch sử đặt vé xem đua ngựa</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Profile and Wallet Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Personal Info Card */}
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Thông Tin Cá Nhân</h3>
              <button 
                type="button" 
                className="admin-btn admin-btn--outline admin-btn--sm"
                onClick={() => {
                  setFormData({ ...profile })
                  setIsEditing(!isEditing)
                }}
              >
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="admin-form-label">Họ và Tên</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      style={{ width: '100%' }}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Email</label>
                    <input 
                      type="email" 
                      className="admin-input" 
                      style={{ width: '100%' }}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Số điện thoại</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      style={{ width: '100%' }}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="admin-btn admin-btn--gold" style={{ marginTop: '10px' }}>Lưu Thay Đổi</button>
                </form>
              ) : (
                <dl className="profile-info-dl" style={{ fontSize: '13px', margin: 0 }}>
                  <dt style={{ color: '#888', marginBottom: '4px' }}>Vai trò tài khoản</dt>
                  <dd style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '12px' }}>SPECTATOR (Khán giả)</dd>

                  <dt style={{ color: '#888', marginBottom: '4px' }}>Họ và tên</dt>
                  <dd style={{ color: '#fff', fontSize: '15px', fontWeight: '500', marginBottom: '12px' }}>{profile.name}</dd>

                  <dt style={{ color: '#888', marginBottom: '4px' }}>Email liên hệ</dt>
                  <dd style={{ color: '#fff', marginBottom: '12px' }}>{profile.email}</dd>

                  <dt style={{ color: '#888', marginBottom: '4px' }}>Số điện thoại</dt>
                  <dd style={{ color: '#fff', marginBottom: '12px' }}>{profile.phone}</dd>

                  <dt style={{ color: '#888', marginBottom: '4px' }}>Ngày gia nhập</dt>
                  <dd style={{ color: '#fff' }}>{profile.joined}</dd>
                </dl>
              )}
            </div>
          </div>

          {/* Wallet Card */}
          <div className="admin-card" style={{ border: '1px solid rgba(212, 175, 55, 0.25)', background: 'linear-gradient(135deg, rgba(212,175,55,0.03), rgba(0,0,0,0))' }}>
            <div className="admin-card-head">
              <h3>Ví Tài Khoản (Spectator Wallet)</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Số dư khả dụng</span>
                <strong style={{ fontSize: '26px', color: '#d4af37', display: 'block' }}>{formatCurrency(profile.balance)}</strong>
              </div>

              <form onSubmit={handleDeposit} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <label className="admin-form-label" style={{ marginBottom: '6px', display: 'block' }}>Nạp thêm tiền (Demo)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    placeholder="Nhập số tiền cần nạp..." 
                    className="admin-input" 
                    style={{ flex: 1 }}
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                  />
                  <button type="submit" className="admin-btn admin-btn--gold">Nạp Tiền</button>
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phương thức liên kết: <strong>Ví MoMo ({profile.phone})</strong></span>
                  <span style={{ color: '#4ade80' }}>● Đã liên kết</span>
                </div>
              </form>
            </div>
          </div>

        </div>

        {/* Right Side: Predictions History and Reward Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Notifications Feed */}
          <div className="admin-card" style={{ border: '1px solid rgba(74, 222, 128, 0.15)' }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(74, 222, 128, 0.1)' }}>
              <h3 style={{ color: '#4ade80' }}>🔔 Thông Báo Trả Thưởng & Sự Kiện</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: n.read ? 'rgba(255, 255, 255, 0.01)' : 'rgba(74, 222, 128, 0.05)',
                    border: n.read ? '1px solid rgba(255, 255, 255, 0.03)' : '1px solid rgba(74, 222, 128, 0.2)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {!n.read && <span style={{ position: 'absolute', top: '10px', right: '10px', width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />}
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#fff', paddingRight: '12px' }}>{n.text}</p>
                  <span style={{ fontSize: '10px', color: '#666' }}>{n.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History of tickets & predictions */}
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Lịch Sử Đặt Vé & Dự Đoán</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userPreds.map(up => (
                <div 
                  key={up.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{up.race}</strong>
                    <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{formatCurrency(up.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                    <span>Ngựa dự đoán: <strong style={{ color: '#fff' }}>{up.horse}</strong> · Loại vé: <strong style={{ color: up.ticketType === 'VIP' ? '#c084fc' : '#e6c564' }}>{up.ticketType || 'Standard'}</strong></span>
                    <span>
                      {up.status === 'won' && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Thắng (+{formatCurrency(up.payout)})</span>}
                      {up.status === 'lost' && <span style={{ color: '#f87171' }}>Thua</span>}
                      {up.status === 'pending' && <span style={{ color: '#e6c564' }}>Đang chờ kết quả</span>}
                    </span>
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
