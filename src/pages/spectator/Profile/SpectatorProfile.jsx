import React, { useState, useEffect } from 'react'
import { mockUserPredictions as initialUserPreds } from '../../../data/adminMockData'
import { formatCurrency } from '../../../utils/adminHelpers'
import { useAuth } from '../../../contexts/AuthContext'
import * as spectatorService from '../../../services/spectatorService'
import { createPayment } from '../../../services/paymentService'
import './SpectatorProfile.css'

const MOCK_NOTIFICATIONS = [
  { id: 1, text: '🎉 Chúc mừng! Dự đoán của bạn cho "Sprint Classic" chính xác. Nhận thưởng +18,000,000 VND.', date: 'Hôm nay 10:20', read: false },
  { id: 2, text: '💰 Tiền thưởng dự đoán đã được chuyển vào tài khoản ví PayOS liên kết.', date: 'Hôm nay 10:21', read: false },
  { id: 3, text: '⚖️ Phiên mua vé cuộc đua "Derby Một Dặm" đã được mở. Mua vé tham gia ngay!', date: 'Hôm qua', read: true }
]

// Chuẩn hoá response API về cùng shape
function normalizeProfile(data) {
  return {
    id: data.id ?? data.spectatorId ?? null,
    username: data.userName ?? data.username ?? '',
    name: data.fullName ?? data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? data.phoneNumber ?? '',
    balance: data.walletBalance ?? data.balance ?? data.wallet ?? 0,
    joined: data.birthDate ?? data.createdAt ?? data.joinedAt ?? data.joined ?? '',
    payosLinked: data.payosLinked ?? false,
  }
}

export default function SpectatorProfile() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  const [userPreds] = useState(initialUserPreds)
  const [apiTransactions, setApiTransactions] = useState([])
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [depositAmount, setDepositAmount] = useState('')

  // ── Trạng thái liên kết ví thanh toán ──
  const PAYMENT_METHODS = [
    { id: 'payos', label: 'Cổng PayOS', icon: '💳', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.3)' },
  ]
  const [linkedPayment, setLinkedPayment] = useState(() => {
    try { return JSON.parse(localStorage.getItem('linked_payment') || 'null') } catch { return null }
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [linkingMethod, setLinkingMethod] = useState(null)   // method đang trong quá trình liên kết
  const [linkingStep, setLinkingStep] = useState('choose')   // 'choose' | 'confirm' | 'processing' | 'done'
  const [linkAccountInput, setLinkAccountInput] = useState('')

  // ── Tải thông tin cá nhân từ API khi mount ──
  useEffect(() => {
    let cancelled = false

    async function fetchProfile() {
      setLoading(true)
      setApiError(null)

      // ── Bước 1: Hiển thị ngay từ pending_profile nếu khớp với user đang đăng nhập ──
      const pending = localStorage.getItem('pending_profile')
      let pendingLoaded = false
      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          // Xác thực thông tin đăng ký có thuộc về người dùng đang đăng nhập hay không
          const isMatch =
            (parsed.email && parsed.email === user?.email) ||
            (parsed.userName && parsed.userName === user?.username) ||
            (parsed.id && parsed.id === user?.id)

          if (isMatch) {
            if (!cancelled) {
              setProfile(normalizeProfile(parsed))
              setFormData(normalizeProfile(parsed))
              setLoading(false) // Hiển thị ngay
              pendingLoaded = true
            }
          } else {
            // Không khớp -> dữ liệu cũ của tài khoản đăng ký trước đó, dọn dẹp đi
            localStorage.removeItem('pending_profile')
          }
        } catch (_) { /* ignore */ }
      }

      // ── Bước 2: Gọi API để lấy data mới nhất (làm mới nền) ──
      try {
        const data = await spectatorService.getSpectatorProfile(user?.id)
        let walletInfo = null
        const rawId = data?.id || data?.spectatorId || user?.id
        const specId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : null
        if (specId) {
          try {
            const walletRes = await spectatorService.getSpectatorWallet(specId)
            walletInfo = walletRes?.data || walletRes
          } catch (wErr) {
            console.warn('API getSpectatorWallet error:', wErr?.response?.status ?? wErr?.message)
          }

          try {
            const txRes = await spectatorService.getSpectatorTransactions(specId)
            const txList = Array.isArray(txRes) ? txRes : (txRes?.data || [])
            if (!cancelled && txList.length > 0) {
              setApiTransactions(txList)
            }
          } catch (txErr) {
            console.warn('API getSpectatorTransactions error:', txErr?.response?.status ?? txErr?.message)
          }
        }
        if (!cancelled) {
          const mergedData = {
            ...data,
            balance: walletInfo?.balance ?? data?.walletBalance ?? data?.balance ?? 0,
            spectatorName: walletInfo?.spectatorName ?? data?.fullName ?? data?.name
          }
          const normalized = normalizeProfile(mergedData)
          setProfile(normalized)
          setFormData(normalized)
          setApiError(null)
          // API thành công → xóa snapshot đăng ký cũ
          localStorage.removeItem('pending_profile')
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('API profile lỗi, dùng dữ liệu cục bộ:', err?.response?.status ?? err?.message)

          // Nếu chưa có gì hiển thị (do pending_profile không khớp/không có) -> dùng thông tin từ AuthContext
          if (!pendingLoaded) {
            setApiError('Không thể tải thông tin từ máy chủ. Hiển thị dữ liệu đăng ký.')
            const fallback = normalizeProfile({
              id: user?.id,
              userName: user?.username ?? '',
              name: user?.fullName ?? user?.name ?? '',
              email: user?.email ?? '',
              phone: user?.phone ?? '',
              createdAt: user?.createdAt ?? null,
            })
            setProfile(fallback)
            setFormData(fallback)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }

    }

    fetchProfile()
    return () => { cancelled = true }
  }, [user?.id])



  // ── Lưu thay đổi lên API ──
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
      }
      const updated = await spectatorService.updateSpectatorProfile(profile.id, payload)
      const normalized = normalizeProfile({ ...profile, ...updated })
      setProfile(normalized)
      setFormData(normalized)
      setIsEditing(false)
      alert('✅ Cập nhật thông tin tài khoản thành công!')
    } catch (err) {
      console.error('Cập nhật thất bại:', err)
      alert('❌ Cập nhật thất bại: ' + (err?.response?.data?.message ?? 'Lỗi máy chủ'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    const amount = Number(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Vui lòng nhập số tiền nạp hợp lệ!')
      return
    }

    const rawId = profile?.id ?? user?.id
    const specId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : null

    try {
      setSaving(true)
      // Gọi Backend tạo giao dịch payOS Checkout ➔ Nhận checkoutUrl
      const res = await createPayment(amount, specId)
      const checkoutUrl = res?.checkoutUrl || res?.payUrl || res?.data?.checkoutUrl

      if (checkoutUrl) {
        // Chuyển hướng trực tiếp sang payOS Hosted Checkout
        window.location.href = checkoutUrl
      } else {
        alert('❌ Không nhận được đường dẫn thanh toán từ payOS!')
      }
    } catch (err) {
      console.error('Khởi tạo giao dịch thất bại:', err)
      const errorMsg = err?.response?.data?.message || (typeof err?.response?.data === 'string' ? err.response.data : null) || err?.message || 'Lỗi kết nối cổng thanh toán PayOS'
      alert('❌ Khởi tạo giao dịch thất bại: ' + errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  // ── Handlers liên kết ví thanh toán ──
  function openPaymentModal() {
    setLinkingMethod(null)
    setLinkAccountInput('')
    setLinkingStep('choose')
    setShowPaymentModal(true)
  }

  function handleSelectMethod(method) {
    setLinkingMethod(method)
    setLinkAccountInput('')
    setLinkingStep('confirm')
  }

  function handleConfirmLink(e) {
    e.preventDefault()
    if (!linkAccountInput.trim()) return
    setLinkingStep('processing')
    // Sandbox: giả lập delay kết nối
    setTimeout(() => {
      const linked = {
        methodId: linkingMethod.id,
        label: linkingMethod.label,
        icon: linkingMethod.icon,
        color: linkingMethod.color,
        account: linkAccountInput.trim(),
        linkedAt: new Date().toISOString(),
      }
      setLinkedPayment(linked)
      localStorage.setItem('linked_payment', JSON.stringify(linked))
      setLinkingStep('done')
    }, 1800)
  }

  function handleCloseModal() {
    setShowPaymentModal(false)
    setLinkingStep('choose')
    setLinkingMethod(null)
    setLinkAccountInput('')
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="spectator-profile-page">
        <div className="admin-page-head">
          <div>
            <h1 className="admin-page-title">Quản Lý Tài Khoản</h1>
            <p className="admin-page-sub">Đang tải thông tin tài khoản...</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#888', fontSize: '14px' }}>
          <span>⏳ Đang kết nối đến máy chủ...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="spectator-profile-page">
        <div className="admin-page-head">
          <div>
            <h1 className="admin-page-title">Quản Lý Tài Khoản</h1>
            <p className="admin-page-sub">Xem thông tin cá nhân, số dư ví, quản lý giao dịch và lịch sử đặt vé xem đua ngựa</p>
          </div>
        </div>

        {/* Banner cảnh báo nếu API lỗi */}
        {apiError && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.3)',
            color: '#fbbf24',
            fontSize: '13px',
          }}>
            ⚠️ {apiError}
          </div>
        )}

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
                    <button
                      type="submit"
                      className="admin-btn admin-btn--gold"
                      style={{ marginTop: '10px' }}
                      disabled={saving}
                    >
                      {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </form>
                ) : (
                  <dl className="profile-info-dl" style={{ fontSize: '13px', margin: 0 }}>
                    <dt style={{ color: '#888', marginBottom: '4px' }}>Vai trò tài khoản</dt>
                    <dd style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '12px' }}>SPECTATOR (Khán giả)</dd>

                    {profile.username && (
                      <>
                        <dt style={{ color: '#888', marginBottom: '4px' }}>Tên đăng nhập</dt>
                        <dd style={{ color: '#a78bfa', fontWeight: '500', marginBottom: '12px' }}>{profile.username}</dd>
                      </>
                    )}

                    <dt style={{ color: '#888', marginBottom: '4px' }}>Họ và tên</dt>
                    <dd style={{ color: '#fff', fontSize: '15px', fontWeight: '500', marginBottom: '12px' }}>{profile.name || '—'}</dd>

                    <dt style={{ color: '#888', marginBottom: '4px' }}>Email liên hệ</dt>
                    <dd style={{ color: '#fff', marginBottom: '12px' }}>{profile.email || '—'}</dd>

                    <dt style={{ color: '#888', marginBottom: '4px' }}>Số điện thoại</dt>
                    <dd style={{ color: '#fff', marginBottom: '12px' }}>{profile.phone || '—'}</dd>

                    <dt style={{ color: '#888', marginBottom: '4px' }}>Ngày gia nhập</dt>
                    <dd style={{ color: '#fff' }}>
                      {profile.joined
                        ? new Date(profile.joined).toLocaleDateString('vi-VN')
                        : '—'}
                    </dd>
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

                {/* Số dư */}
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Số dư khả dụng</span>
                  <strong style={{ fontSize: '26px', color: '#d4af37', display: 'block' }}>{formatCurrency(profile.balance)}</strong>
                </div>

                {/* Nạp tiền */}
                <form onSubmit={handleDeposit} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginBottom: '16px' }}>
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
                {apiTransactions.length > 0 ? (
                  apiTransactions.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#fff', fontSize: '14px' }}>
                          {tx.transactionType === 'WALLET_DEPOSIT' ? `Nạp tiền ví (${tx.paymentGateway || 'Cổng thanh toán'})` : (tx.ticket?.tournament?.name || 'Giao dịch vé')}
                        </strong>
                        <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{formatCurrency(tx.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                        <span>
                          {tx.orderId ? `Mã ĐĐ: ${tx.orderId}` : `Mã GD: #${tx.id}`}
                          {tx.transactionDate ? ` · ${new Date(tx.transactionDate).toLocaleString('vi-VN')}` : ''}
                        </span>
                        <span>
                          {tx.status === 'SUCCESS' || tx.status === 'COMPLETED' || tx.status === 'won' ? (
                            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Thành công</span>
                          ) : (
                            <span style={{ color: '#e6c564' }}>Đang thực hiện</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  userPreds.map(up => (
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
                          {up.status === 'pending' && <span style={{ color: '#e6c564' }}>Chờ kết quả đua</span>}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </>
  )
}
