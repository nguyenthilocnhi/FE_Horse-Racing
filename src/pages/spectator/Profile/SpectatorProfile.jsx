import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  const location = useLocation()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast.message, location.state.toast.type)
    }
  }, [location.state])

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

  // ── Tải thông tin cá nhân từ API / LocalStorage khi mount ──
  useEffect(() => {
    let cancelled = false
    const userKey = user?.id || user?.username || user?.email || 'guest'
    const userProfileKey = `spectator_profile_${userKey}`
    const userTxKey = `spectator_transactions_${userKey}`

    const computeWalletBalance = () => {
      let specProf = null
      let pendProf = null
      let localTxs = []

      try { specProf = JSON.parse(localStorage.getItem(userProfileKey) || localStorage.getItem('spectator_profile') || 'null') } catch (e) { }
      try { pendProf = JSON.parse(localStorage.getItem('pending_profile') || 'null') } catch (e) { }
      try { localTxs = JSON.parse(localStorage.getItem(userTxKey) || '[]') } catch (e) { }

      let depositSum = 0
      localTxs.forEach(t => {
        const st = (t.status || '').toUpperCase()
        if ((st === 'SUCCESS' || st === 'PAID') && t.amount) {
          depositSum += Number(t.amount)
        }
      })

      // Only read saved balance if it belongs to this exact user
      const isMatch = (specProf?.userName === user?.username) || (specProf?.email === user?.email) || (specProf?.id === user?.id)
      const b1 = isMatch ? (specProf?.balance ?? specProf?.walletBalance) : undefined
      const b2 = pendProf?.balance ?? pendProf?.walletBalance

      const highestVal = Math.max(
        b1 !== undefined && b1 !== null ? Number(b1) : 0,
        b2 !== undefined && b2 !== null && (pendProf?.email === user?.email || pendProf?.userName === user?.username) ? Number(b2) : 0,
        depositSum
      )

      return highestVal
    }

    async function fetchProfile() {
      setLoading(true)
      setApiError(null)

      const calculatedBalance = computeWalletBalance()

      // Read local user-scoped transactions
      let localTx = []
      try {
        localTx = JSON.parse(localStorage.getItem(userTxKey) || '[]')
      } catch (e) { }
      if (!cancelled) {
        setApiTransactions(localTx)
      }

      // Check pending_profile
      const pending = localStorage.getItem('pending_profile')
      let initialData = null

      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          const isMatch =
            (parsed.email && parsed.email === user?.email) ||
            (parsed.userName && parsed.userName === user?.username) ||
            (parsed.id && parsed.id === user?.id)
          if (isMatch) {
            initialData = parsed
          }
        } catch (_) { }
      }

      if (!initialData) {
        try {
          initialData = JSON.parse(localStorage.getItem(userProfileKey) || 'null')
        } catch (_) { }
      }

      try {
        const apiData = await spectatorService.getSpectatorProfile(user?.id)
        if (apiData) {
          initialData = { ...initialData, ...apiData }
        }
      } catch (e) {
        console.warn('API getSpectatorProfile offline:', e?.message)
      }

      if (!cancelled) {
        const mergedData = {
          id: user?.id || initialData?.id,
          userName: user?.username || initialData?.userName || '',
          name: user?.fullName || user?.name || initialData?.name || initialData?.fullName || 'Khán giả',
          email: user?.email || initialData?.email || 'khangia@horseracing.com',
          phone: user?.phone || initialData?.phone || '0912345678',
          balance: calculatedBalance,
          walletBalance: calculatedBalance,
          joined: user?.createdAt || initialData?.joined || new Date().toISOString(),
          payosLinked: true
        }

        const normalized = normalizeProfile(mergedData)
        setProfile(normalized)
        setFormData(normalized)
        setLoading(false)

        localStorage.setItem(userProfileKey, JSON.stringify(normalized))
        localStorage.setItem('spectator_profile', JSON.stringify(normalized))
        if (localStorage.getItem('pending_profile')) {
          localStorage.setItem('pending_profile', JSON.stringify(normalized))
        }
      }
    }

    fetchProfile()
    return () => { cancelled = true }
  }, [user])

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
      const userKey = user?.id || user?.username || user?.email || 'guest'
      localStorage.setItem(`spectator_profile_${userKey}`, JSON.stringify(normalized))
      localStorage.setItem('spectator_profile', JSON.stringify(normalized))
      showToast('Cập nhật thông tin thành công!', 'success')
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      showToast('Không thể lưu thay đổi!', 'danger')
    } finally {
      setSaving(false)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    const amount = Number(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('Vui lòng nhập số tiền nạp hợp lệ!', 'warning')
      return
    }

    const userKey = user?.id || user?.username || user?.email || 'guest'

    try {
      setSaving(true)
      // Gọi Backend tạo giao dịch payOS Checkout ➔ Nhận checkoutUrl
      const res = await createPayment(amount, userKey)
      const checkoutUrl = res?.checkoutUrl || res?.payUrl || res?.data?.checkoutUrl

      if (checkoutUrl) {
        // Chuyển hướng trực tiếp sang payOS Hosted Checkout
        window.location.href = checkoutUrl
      } else {
        showToast('❌ Không nhận được đường dẫn thanh toán từ payOS!', 'danger')
      }
    } catch (err) {
      console.error('Khởi tạo giao dịch thất bại:', err)
      const errorMsg = err?.response?.data?.message || (typeof err?.response?.data === 'string' ? err.response.data : null) || err?.message || 'Lỗi kết nối cổng thanh toán PayOS'
      showToast('❌ Khởi tạo giao dịch thất bại: ' + errorMsg, 'danger')
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
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '14px 20px',
          borderRadius: '10px',
          background: toast.type === 'success' ? 'rgba(22, 101, 52, 0.95)' : toast.type === 'warning' ? 'rgba(146, 64, 14, 0.95)' : 'rgba(153, 27, 27, 0.95)',
          border: `1px solid ${toast.type === 'success' ? '#4ade80' : toast.type === 'warning' ? '#fbbf24' : '#f87171'}`,
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '450px'
        }}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: 0.8
            }}
          >✕</button>
        </div>
      )}

      <div className="spectator-profile-page">
        <div className="admin-page-head">
          <div>
            <h1 className="admin-page-title">Quản Lý Tài Khoản</h1>
            <p className="admin-page-sub">Xem thông tin cá nhân, số dư ví và quản lý giao dịch nạp tiền</p>
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
                  <label className="admin-form-label" style={{ marginBottom: '6px', display: 'block' }}>Nạp tiền qua Cổng thanh toán PayOS</label>
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

            {/* Deposit History Card */}
            <div className="admin-card">
              <div className="admin-card-head">
                <h3>💳 Lịch Sử Nạp Tiền</h3>
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
                          {tx.transactionType === 'WALLET_DEPOSIT' || !tx.transactionType ? `Nạp tiền ví (${tx.paymentGateway || 'Cổng thanh toán PayOS'})` : (tx.ticket?.tournament?.name || 'Giao dịch chuyển khoản')}
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
                          ) : tx.status === 'FAILED' || tx.status === 'CANCELLED' || tx.status === 'ERROR' ? (
                            <span style={{ color: '#f87171', fontWeight: 'bold' }}>Bị lỗi</span>
                          ) : (
                            <span style={{ color: '#e6c564' }}>Đang thực hiện</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#888', textAlign: 'center', margin: '16px 0', fontSize: '13px' }}>
                    Chưa có lịch sử nạp tiền nào.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </>
  )
}
