import React, { useState, useEffect } from 'react'
import { ownerProfile as initialProfile } from '../../../data/ownerMockData'
import { useAuth } from '../../../contexts/AuthContext'

export default function OwnerProfile() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(initialProfile)
  const [name, setName] = useState('')
  const [stableName, setStableName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [stableColor, setStableColor] = useState('#d4af37') // Gold by default
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Load Owner Profile Details from registered snapshot or AuthContext ──
  useEffect(() => {
    setLoading(true)

    // Khởi tạo các giá trị mặc định từ user AuthContext
    const defaultName = user?.fullName ?? user?.name ?? 'Chủ sở hữu'
    const defaultEmail = user?.email ?? ''
    const defaultPhone = user?.phone ?? ''

    // Kiểm tra pending_profile của owner vừa đăng ký
    const pending = localStorage.getItem('pending_profile')
    let initialized = false

    if (pending) {
      try {
        const parsed = JSON.parse(pending)
        const isMatch = parsed.email === user?.email || parsed.userName === user?.username || parsed.id === user?.id
        if (isMatch) {
          setName(parsed.name ?? defaultName)
          setStableName(parsed.stableName ?? 'My Stable')
          setEmail(parsed.email ?? defaultEmail)
          setPhone(parsed.phone ?? defaultPhone)
          setLocation(parsed.address ?? 'Hồ Chí Minh, Việt Nam')
          setBio('Stable chất lượng cao chuyên đào tạo các giống ngựa đua hàng đầu.')
          initialized = true
        }
      } catch (_) { /* ignore */ }
    }

    if (!initialized) {
      setName(defaultName)
      setStableName('Stable Demo')
      setEmail(defaultEmail)
      setPhone(defaultPhone)
      setLocation('Hồ Chí Minh, Việt Nam')
      setBio('Giới thiệu thông tin trang trại của bạn tại đây.')
    }

    setLoading(false)
  }, [user])

  const handleSave = (e) => {
    e.preventDefault()
    // Lưu tạm vào local để ghi nhớ thông tin sửa đổi của Owner
    const updated = {
      ...profile,
      name,
      stableName,
      email,
      phone,
      location,
      bio
    }
    setProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return <div style={{ color: '#aaa', padding: 20 }}>Đang tải thông tin hồ sơ...</div>
  }

  return (
    <div className="own-profile">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Hồ sơ Trang trại Stable 🏠</h1>
          <p className="owner-page-sub">Cập nhật thông tin liên hệ và nhận diện thương hiệu của Stable.</p>
        </div>
      </div>

      <div className="owner-form-grid" style={{ gridTemplateColumns: '350px 1fr', gap: 24 }}>
        {/* Left Card: Summary Card */}
        <div className="owner-card" style={{ height: 'fit-content' }}>
          <div className="owner-card-body" style={{ textAlign: 'center', paddingTop: 36, paddingBottom: 36 }}>
            <div className="owner-user-avatar" style={{ width: 80, height: 80, fontSize: 32, margin: '0 auto 16px', borderRadius: '50%' }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.2rem' }}>{name}</h2>
            <span className="owner-badge owner-badge--gold" style={{ marginBottom: 16 }}>{profile.licenseNo}</span>
            
            <div style={{ textAlign: 'left', marginTop: 24, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                <span style={{ color: '#666' }}>Trang trại</span>
                <strong style={{ color: '#fff' }}>{stableName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                <span style={{ color: '#666' }}>Năm thành lập</span>
                <strong style={{ color: '#fff' }}>2022</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                <span style={{ color: '#666' }}>Địa điểm</span>
                <strong style={{ color: '#fff', fontSize: 12 }}>{location}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Profile Form */}
        <div className="owner-card">
          <div className="owner-card-head">
            <h3>Cấu hình chi tiết</h3>
          </div>
          <div className="owner-card-body">
            {saved && (
              <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)', color: '#4ade80', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 13 }}>
                ✓ Đã lưu thông tin hồ sơ stable thành công!
              </div>
            )}
            
            <form onSubmit={handleSave}>
              <div className="owner-form-grid">
                <div className="owner-form-group">
                  <label className="owner-label">Họ và tên Chủ sở hữu</label>
                  <input
                    type="text"
                    className="owner-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="owner-form-group">
                  <label className="owner-label">Tên Trang trại (Stable Name)</label>
                  <input
                    type="text"
                    className="owner-input"
                    value={stableName}
                    onChange={(e) => setStableName(e.target.value)}
                    required
                  />
                </div>
                <div className="owner-form-group">
                  <label className="owner-label">Địa chỉ email liên hệ</label>
                  <input
                    type="email"
                    className="owner-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="owner-form-group">
                  <label className="owner-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="owner-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="owner-form-group">
                  <label className="owner-label">Vùng hoạt động chính</label>
                  <input
                    type="text"
                    className="owner-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="owner-form-group">
                  <label className="owner-label">Màu áo thi đấu chủ đạo (Stable Color)</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="color"
                      className="owner-input"
                      style={{ padding: 0, width: 45, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
                      value={stableColor}
                      onChange={(e) => setStableColor(e.target.value)}
                    />
                    <span style={{ fontSize: 13, color: '#aaa' }}>{stableColor.toUpperCase()}</span>
                  </div>
                </div>
                <div className="owner-form-group full">
                  <label className="owner-label">Mô tả giới thiệu Stable</label>
                  <textarea
                    className="owner-input"
                    style={{ minHeight: 100, resize: 'vertical' }}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
