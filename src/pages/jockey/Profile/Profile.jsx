import React, { useState } from 'react'
import { jockeyProfile } from '../../../data/jockeyMockData'
import { useAuth } from '../../../contexts/AuthContext'
import * as jockeyService from '../../../services/jockeyService'
import './Profile.css'

/* ── Registration Form (for new Jockey) ── */
function RegisterForm({ onDone }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    nationality: '',
    weight: '',
    height: '',
    experience: '',
    licenseNo: '',
    licenseExpiry: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên.'
    if (!form.email.includes('@')) e.email = 'Email không hợp lệ.'
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.'
    if (!form.dob) e.dob = 'Vui lòng chọn ngày sinh.'
    if (!form.nationality.trim()) e.nationality = 'Vui lòng nhập quốc tịch.'
    if (!form.weight) e.weight = 'Nhập cân nặng.'
    if (!form.height) e.height = 'Nhập chiều cao.'
    if (!form.licenseNo.trim()) e.licenseNo = 'Nhập số giấy phép.'
    if (!form.licenseExpiry) e.licenseExpiry = 'Chọn ngày hết hạn.'
    if (form.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp.'
    if (!form.agreeTerms) e.agreeTerms = 'Bạn phải đồng ý điều khoản.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="profile-register-success">
        <div className="prs-icon">✅</div>
        <h2>Đăng ký thành công!</h2>
        <p>Tài khoản Jockey của bạn đang chờ Admin xét duyệt.<br />Chúng tôi sẽ thông báo kết quả qua email <strong>{form.email}</strong>.</p>
        <button type="button" className="jockey-btn jockey-btn--teal" onClick={onDone}>
          Về trang đăng nhập
        </button>
      </div>
    )
  }

  return (
    <form className="profile-register-form" onSubmit={handleSubmit} noValidate>
      <div className="profile-section-title">Thông tin cá nhân</div>
      <div className="jockey-form-grid">
        <div className="jockey-form-group">
          <label className="jockey-label">Họ và tên *</label>
          <input className="jockey-input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" />
          {errors.fullName && <span className="profile-err">{errors.fullName}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Email *</label>
          <input className="jockey-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jockey@email.com" />
          {errors.email && <span className="profile-err">{errors.email}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Số điện thoại *</label>
          <input className="jockey-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09xx xxx xxx" />
          {errors.phone && <span className="profile-err">{errors.phone}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Ngày sinh *</label>
          <input className="jockey-input" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
          {errors.dob && <span className="profile-err">{errors.dob}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Quốc tịch *</label>
          <input className="jockey-input" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="Việt Nam" />
          {errors.nationality && <span className="profile-err">{errors.nationality}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Kinh nghiệm</label>
          <input className="jockey-input" value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="3 năm, 5 năm…" />
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Cân nặng (kg) *</label>
          <input className="jockey-input" type="number" step="0.1" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="54.5" />
          {errors.weight && <span className="profile-err">{errors.weight}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Chiều cao (cm) *</label>
          <input className="jockey-input" type="number" value={form.height} onChange={(e) => set('height', e.target.value)} placeholder="162" />
          {errors.height && <span className="profile-err">{errors.height}</span>}
        </div>
      </div>

      <div className="profile-section-title" style={{ marginTop: 24 }}>Thông tin giấy phép</div>
      <div className="jockey-form-grid">
        <div className="jockey-form-group">
          <label className="jockey-label">Số giấy phép *</label>
          <input className="jockey-input" value={form.licenseNo} onChange={(e) => set('licenseNo', e.target.value)} placeholder="VN-JOC-2024-XXX" />
          {errors.licenseNo && <span className="profile-err">{errors.licenseNo}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Ngày hết hạn *</label>
          <input className="jockey-input" type="date" value={form.licenseExpiry} onChange={(e) => set('licenseExpiry', e.target.value)} />
          {errors.licenseExpiry && <span className="profile-err">{errors.licenseExpiry}</span>}
        </div>
      </div>

      <div className="profile-section-title" style={{ marginTop: 24 }}>Mật khẩu tài khoản</div>
      <div className="jockey-form-grid">
        <div className="jockey-form-group">
          <label className="jockey-label">Mật khẩu *</label>
          <input className="jockey-input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Tối thiểu 8 ký tự" />
          {errors.password && <span className="profile-err">{errors.password}</span>}
        </div>
        <div className="jockey-form-group">
          <label className="jockey-label">Xác nhận mật khẩu *</label>
          <input className="jockey-input" type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Nhập lại mật khẩu" />
          {errors.confirmPassword && <span className="profile-err">{errors.confirmPassword}</span>}
        </div>
      </div>

      <label className="profile-agree-row">
        <input
          type="checkbox"
          checked={form.agreeTerms}
          onChange={(e) => set('agreeTerms', e.target.checked)}
          className="profile-checkbox"
        />
        <span>Tôi đồng ý với <a href="#!" style={{ color: '#d4af37' }}>Điều khoản sử dụng</a> và <a href="#!" style={{ color: '#d4af37' }}>Chính sách bảo mật</a> của HORSIE.</span>
      </label>
      {errors.agreeTerms && <span className="profile-err">{errors.agreeTerms}</span>}

      <div style={{ marginTop: 28 }}>
        <button type="submit" className="jockey-btn jockey-btn--teal" style={{ width: '100%', padding: '14px 20px', fontSize: 13 }}>
          🏇 Đăng ký tài khoản Jockey
        </button>
      </div>
    </form>
  )
}

/* ── Profile View (for existing jockey) ── */
function ProfileView() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => {
    const defaultName = user?.fullName ?? user?.name ?? jockeyProfile.name
    const defaultPhone = user?.phone ?? jockeyProfile.phone
    const defaultEmail = user?.email ?? jockeyProfile.email

    const pending = localStorage.getItem('pending_profile')
    if (pending) {
      try {
        const parsed = JSON.parse(pending)
        const isMatch = parsed.email === user?.email || parsed.userName === user?.username || parsed.id === user?.id || (parsed.name && parsed.name === user?.name)
        if (isMatch) {
          return {
            name: parsed.name ?? defaultName,
            nickname: parsed.nickname ?? 'Nài ngựa mới',
            phone: parsed.phone ?? defaultPhone,
            weight: parsed.weight ?? '54',
            height: parsed.height ?? '162',
            experience: parsed.experienceYears ? `${parsed.experienceYears} năm` : 'Chưa cập nhật',
            email: parsed.email ?? defaultEmail,
            licenseNo: parsed.licenseNumber ?? 'VN-JOC-PENDING',
            licenseExpiry: parsed.licenseExpiryDate ?? 'Chưa rõ',
            dob: parsed.dob ?? jockeyProfile.dob,
            nationality: parsed.nationality ?? jockeyProfile.nationality
          }
        }
      } catch (_) {}
    }

    return {
      name: defaultName,
      nickname: jockeyProfile.nickname,
      phone: defaultPhone,
      weight: jockeyProfile.weight,
      height: jockeyProfile.height,
      experience: jockeyProfile.experience,
      email: defaultEmail,
      licenseNo: jockeyProfile.licenseNo,
      licenseExpiry: jockeyProfile.licenseExpiry,
      dob: jockeyProfile.dob,
      nationality: jockeyProfile.nationality
    }
  })

  React.useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const data = await jockeyService.getJockeyProfile(user?.id)
        if (!cancelled && data) {
          setForm({
            name: data.fullName ?? user?.fullName ?? user?.name ?? jockeyProfile.name,
            nickname: data.nickname ?? 'Nài ngựa mới',
            phone: data.phone ?? user?.phone ?? jockeyProfile.phone,
            weight: data.weight ?? '54',
            height: data.height ?? '162',
            experience: data.experienceYears ? `${data.experienceYears} năm` : 'Chưa cập nhật',
            email: data.email ?? user?.email ?? jockeyProfile.email,
            licenseNo: data.licenseNumber ?? 'VN-JOC-PENDING',
            licenseExpiry: data.licenseExpiryDate ?? 'Chưa rõ',
            dob: data.birthDate ?? data.dob ?? jockeyProfile.dob,
            nationality: data.nationality ?? jockeyProfile.nationality
          })
        }
      } catch (err) {
        console.warn("Failed to load jockey profile from API:", err.message)
      }
    }
    if (user?.id) {
      loadData()
    }
    return () => { cancelled = true }
  }, [user?.id])

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSave(e) {
    e.preventDefault()
    
    // Parse experienceYears (e.g. "5 năm" -> 5)
    const expNum = parseInt(form.experience, 10) || 0

    const payload = {
      fullName: form.name,
      phone: form.phone,
      birthDate: form.dob,
      experienceYears: expNum,
      licenseNumber: form.licenseNo,
      licenseExpiryDate: form.licenseExpiry
    }

    try {
      await jockeyService.updateJockeyProfile(user?.id, payload)
      alert('✅ Cập nhật hồ sơ thành công!')
      setEditing(false)
    } catch (err) {
      alert('❌ Cập nhật hồ sơ thất bại: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <div className="profile-view">
      {/* hero card */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {form.name.charAt(0)}
          </div>
          <span className={`jockey-badge ${jockeyProfile.status === 'active' ? 'jockey-badge--green' : 'jockey-badge--gray'}`}>
            {jockeyProfile.status === 'active' ? '✓ Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{form.name}</h2>
          <div className="profile-hero-nick">"{form.nickname}"</div>
          <div className="profile-hero-meta">
            <span>🪪 {user?.id || jockeyProfile.id}</span>
            <span>📋 {form.licenseNo}</span>
            <span>📅 Tham gia {jockeyProfile.joinedDate}</span>
          </div>
          <div className="profile-hero-stats">
            <div className="profile-hero-stat">
              <strong>{jockeyProfile.stats.totalRaces}</strong>
              <span>Cuộc đua</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#d4af37' }}>{jockeyProfile.stats.wins}</strong>
              <span>Chiến thắng</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#d4af37' }}>{jockeyProfile.stats.winRate}%</strong>
              <span>Tỷ lệ thắng</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#c084fc' }}>{jockeyProfile.stats.totalPoints.toLocaleString()}</strong>
              <span>Điểm</span>
            </div>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            className="jockey-btn jockey-btn--outline jockey-btn--sm"
            onClick={() => setEditing(true)}
            style={{ alignSelf: 'flex-start' }}
          >
            ✎ Chỉnh sửa
          </button>
        )}
      </div>

      {/* details */}
      <div className="profile-detail-grid">
        <div className="jockey-card">
          <div className="jockey-card-head"><h3>Thông tin cá nhân</h3></div>
          <div className="jockey-card-body">
            {editing ? (
              <form onSubmit={handleSave}>
                <div className="jockey-form-grid">
                  <div className="jockey-form-group">
                    <label className="jockey-label">Tên hiển thị</label>
                    <input className="jockey-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Biệt danh</label>
                    <input className="jockey-input" value={form.nickname} onChange={(e) => set('nickname', e.target.value)} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Số điện thoại</label>
                    <input className="jockey-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Kinh nghiệm</label>
                    <input className="jockey-input" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Cân nặng (kg)</label>
                    <input className="jockey-input" type="number" step="0.1" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Chiều cao (cm)</label>
                    <input className="jockey-input" type="number" value={form.height} onChange={(e) => set('height', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="submit" className="jockey-btn jockey-btn--teal jockey-btn--sm">✓ Lưu thay đổi</button>
                  <button type="button" className="jockey-btn jockey-btn--ghost jockey-btn--sm" onClick={() => setEditing(false)}>Hủy</button>
                </div>
              </form>
            ) : (
              <>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Họ tên</span><span className="jockey-detail-value">{form.name}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Biệt danh</span><span className="jockey-detail-value">"{form.nickname}"</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Email</span><span className="jockey-detail-value">{form.email}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Điện thoại</span><span className="jockey-detail-value">{form.phone}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Ngày sinh</span><span className="jockey-detail-value">{form.dob}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Quốc tịch</span><span className="jockey-detail-value">{form.nationality}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Kinh nghiệm</span><span className="jockey-detail-value">{form.experience}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Cân nặng</span><span className="jockey-detail-value">{form.weight} kg</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Chiều cao</span><span className="jockey-detail-value">{form.height} cm</span></div>
              </>
            )}
          </div>
        </div>

        <div className="jockey-card">
          <div className="jockey-card-head"><h3>Thông tin giấy phép</h3></div>
          <div className="jockey-card-body">
            <div className="profile-license-badge">
              <span className="plb-icon">🪪</span>
              <div>
                <div className="plb-number">{form.licenseNo}</div>
                <div className="plb-sub">Giấy phép thi đấu chính thức</div>
              </div>
              <span className="jockey-badge jockey-badge--green">Còn hiệu lực</span>
            </div>
            <div className="jockey-detail-row">
              <span className="jockey-detail-label">Số hiệu</span>
              <span className="jockey-detail-value">{form.licenseNo}</span>
            </div>
            <div className="jockey-detail-row">
              <span className="jockey-detail-label">Ngày hết hạn</span>
              <span className="jockey-detail-value">{form.licenseExpiry}</span>
            </div>
            <div className="jockey-detail-row">
              <span className="jockey-detail-label">Mã jockey</span>
              <span className="jockey-detail-value">{user?.id || jockeyProfile.id}</span>
            </div>
            <div className="jockey-detail-row">
              <span className="jockey-detail-label">Ngày tham gia</span>
              <span className="jockey-detail-value">{jockeyProfile.joinedDate}</span>
            </div>
            <div className="jockey-detail-row">
              <span className="jockey-detail-label">Trạng thái</span>
              <span className="jockey-badge jockey-badge--green">Hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function Profile() {
  const [mode, setMode] = useState('profile') // 'profile' | 'register'

  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">
            {mode === 'register' ? 'Đăng ký tài khoản Jockey' : 'Hồ sơ Jockey'}
          </h1>
          <p className="jockey-page-sub">
            {mode === 'register'
              ? 'Điền đầy đủ thông tin để đăng ký tài khoản jockey thi đấu'
              : 'Quản lý thông tin hồ sơ cá nhân và giấy phép thi đấu'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`jockey-btn jockey-btn--sm ${mode === 'profile' ? 'jockey-btn--teal' : 'jockey-btn--ghost'}`}
            onClick={() => setMode('profile')}
          >
            ◎ Hồ sơ
          </button>
          <button
            type="button"
            className={`jockey-btn jockey-btn--sm ${mode === 'register' ? 'jockey-btn--teal' : 'jockey-btn--outline'}`}
            onClick={() => setMode('register')}
          >
            ＋ Đăng ký mới
          </button>
        </div>
      </div>

      {mode === 'register' ? (
        <div className="jockey-card">
          <div className="jockey-card-body">
            <RegisterForm onDone={() => setMode('profile')} />
          </div>
        </div>
      ) : (
        <ProfileView />
      )}
    </div>
  )
}
