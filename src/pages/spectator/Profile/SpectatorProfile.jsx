import React, { useState, useEffect } from 'react'
import { mockUserPredictions as initialUserPreds } from '../../../data/adminMockData'
import { formatCurrency } from '../../../utils/adminHelpers'
import { useAuth } from '../../../contexts/AuthContext'
import * as spectatorService from '../../../services/spectatorService'
import './SpectatorProfile.css'

const MOCK_NOTIFICATIONS = [
  { id: 1, text: '🎉 Chúc mừng! Dự đoán của bạn cho "Sprint Classic" chính xác. Nhận thưởng +18,000,000 VND.', date: 'Hôm nay 10:20', read: false },
  { id: 2, text: '💰 Tiền thưởng dự đoán đã được chuyển vào tài khoản ví MoMo liên kết.', date: 'Hôm nay 10:21', read: false },
  { id: 3, text: '⚖️ Phiên mua vé cuộc đua "Derby Một Dặm" đã được mở. Mua vé tham gia ngay!', date: 'Hôm qua', read: true }
]

// Chuẩn hoá response API về cùng shape
function normalizeProfile(data) {
  return {
    id:         data.id         ?? data.spectatorId ?? null,
    username:   data.userName   ?? data.username    ?? '',
    name:       data.fullName   ?? data.name        ?? '',
    email:      data.email      ?? '',
    phone:      data.phone      ?? data.phoneNumber ?? '',
    balance:    data.walletBalance ?? data.balance ?? data.wallet ?? 0,
    joined:     data.birthDate  ?? data.createdAt  ?? data.joinedAt ?? data.joined ?? '',
    momoLinked: data.momoLinked ?? false,
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [depositAmount, setDepositAmount] = useState('')

  // ── Trạng thái liên kết ví thanh toán ──
  const PAYMENT_METHODS = [
    { id: 'momo',   label: 'Ví MoMo',  icon: '💜', color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.3)' },
    { id: 'vnpay',  label: 'VNPay',    icon: '💙', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)' },
    { id: 'zalopay',label: 'ZaloPay',  icon: '💛', color: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.3)'  },
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
        if (!cancelled) {
          const normalized = normalizeProfile(data)
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
              id:        user?.id,
              userName:  user?.username  ?? '',
              name:      user?.fullName  ?? user?.name ?? '',
              email:     user?.email     ?? '',
              phone:     user?.phone     ?? '',
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
        email:    formData.email,
        phone:    formData.phone,
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

  const handleDeposit = (e) => {
    e.preventDefault()
    const amount = parseInt(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Vui lòng nhập số tiền nạp hợp lệ!')
      return
    }
    const updated = { ...profile, balance: profile.balance + amount }
    setProfile(updated)
    setDepositAmount('')
    alert(`💳 Nạp tiền thành công! Đã cộng ${formatCurrency(amount)} vào tài khoản.`)
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
        methodId:  linkingMethod.id,
        label:     linkingMethod.label,
        icon:      linkingMethod.icon,
        color:     linkingMethod.color,
        account:   linkAccountInput.trim(),
        linkedAt:  new Date().toISOString(),
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

              {/* Phương thức thanh toán */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Phương thức thanh toán liên kết</div>

                {linkedPayment ? (
                  /* ── Đã liên kết ── */
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.25)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>{linkedPayment.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{linkedPayment.label}</span>
                          <span style={{
                            background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                            fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                            borderRadius: '999px', border: '1px solid rgba(74,222,128,0.3)',
                            letterSpacing: '0.04em',
                          }}>● ĐÃ LIÊN KẾT</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          {linkedPayment.account}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openPaymentModal}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.05)', color: '#ccc',
                        cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      Thay đổi liên kết
                    </button>
                  </div>
                ) : (
                  /* ── Chưa liên kết ── */
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(248,113,113,0.05)',
                    border: '1px solid rgba(248,113,113,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🔗</span>
                      <div>
                        <div style={{ color: '#f87171', fontWeight: '600', fontSize: '13px' }}>Chưa liên kết</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Liên kết ví để nạp / rút tiền thưởng</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openPaymentModal}
                      style={{
                        padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f97316, #ef4444)',
                        color: '#fff', cursor: 'pointer', fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                      }}
                    >
                      Liên kết ngay
                    </button>
                  </div>
                )}
              </div>
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

    {/* ════════════════ PAYMENT MODAL ════════════════ */}
    {showPaymentModal && (
      <div
        onClick={linkingStep !== 'processing' ? handleCloseModal : undefined}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#131313',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '28px 32px',
            width: '420px', maxWidth: '94vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '700', margin: 0 }}>
              {linkingStep === 'choose'     && '🔗 Chọn phương thức thanh toán'}
              {linkingStep === 'confirm'    && `${linkingMethod?.icon} Nhập thông tin ${linkingMethod?.label}`}
              {linkingStep === 'processing' && '⏳ Đang kết nối Sandbox...'}
              {linkingStep === 'done'       && '✅ Liên kết thành công!'}
            </h3>
            {linkingStep !== 'processing' && (
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}>×</button>
            )}
          </div>

          {/* Step: choose */}
          {linkingStep === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px' }}>
                Chọn ví sandbox để liên kết với tài khoản Spectator của bạn:
              </p>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMethod(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '10px',
                    background: m.bg, border: `1px solid ${m.border}`,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '26px' }}>{m.icon}</span>
                  <div>
                    <div style={{ color: m.color, fontWeight: '700', fontSize: '15px' }}>{m.label}</div>
                    <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>Sandbox · Thanh toán nội địa</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step: confirm */}
          {linkingStep === 'confirm' && linkingMethod && (
            <form onSubmit={handleConfirmLink} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '8px',
                background: linkingMethod.bg, border: `1px solid ${linkingMethod.border}`,
              }}>
                <span style={{ fontSize: '22px' }}>{linkingMethod.icon}</span>
                <span style={{ color: linkingMethod.color, fontWeight: '600' }}>{linkingMethod.label} Sandbox</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>
                  {linkingMethod.id === 'momo' ? 'Số điện thoại MoMo' : linkingMethod.id === 'vnpay' ? 'Số tài khoản / thẻ VNPay' : 'Số điện thoại ZaloPay'}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder={linkingMethod.id === 'vnpay' ? 'VD: 9704...xxxx' : 'VD: 0901234567'}
                  value={linkAccountInput}
                  onChange={e => setLinkAccountInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setLinkingStep('choose')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#aaa', cursor: 'pointer', fontWeight: '500' }}>
                  ← Quay lại
                </button>
                <button type="submit"
                  style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${linkingMethod.color}, ${linkingMethod.color}cc)`, color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                  Xác nhận liên kết
                </button>
              </div>
            </form>
          )}

          {/* Step: processing */}
          {linkingStep === 'processing' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                border: `3px solid ${linkingMethod?.color ?? '#d4af37'}`,
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 18px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#ccc', fontSize: '14px', margin: 0 }}>Đang kết nối đến {linkingMethod?.label} Sandbox...</p>
              <p style={{ color: '#555', fontSize: '12px', marginTop: '6px' }}>Vui lòng không đóng cửa sổ này</p>
            </div>
          )}

          {/* Step: done */}
          {linkingStep === 'done' && linkedPayment && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '28px',
              }}>✓</div>
              <p style={{ color: '#4ade80', fontWeight: '700', fontSize: '16px', margin: '0 0 6px' }}>Liên kết thành công!</p>
              <p style={{ color: '#888', fontSize: '13px', margin: '0 0 18px' }}>
                {linkedPayment.icon} <strong style={{ color: '#fff' }}>{linkedPayment.label}</strong> · {linkedPayment.account}
              </p>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  padding: '10px 28px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                  color: '#0a0a0a', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  )
}
