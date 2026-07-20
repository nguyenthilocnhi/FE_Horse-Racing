import React, { useState, useEffect } from 'react'
import { jockeyProfile } from '../../../data/jockeyMockData'
import { auth, jockey } from '../../../services'
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
        <span>Tôi đồng ý với <a href="#!" style={{ color: '#00d4aa' }}>Điều khoản sử dụng</a> và <a href="#!" style={{ color: '#00d4aa' }}>Chính sách bảo mật</a> của HORSIE.</span>
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
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingLicense, setEditingLicense] = useState(false)
  const [personalErrors, setPersonalErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    phone: '',
    weight: '',
    height: '',
    experience: '',
  })

  const [licenseForm, setLicenseForm] = useState({
    licenseNo: '',
    licenseExpiry: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await auth.getMe()
      setProfileData(data)
      setForm({
        name: data.fullName || '',
        nickname: data.userName || '',
        phone: data.phone || '',
        weight: '60', // Mock data since not in DB
        height: '170', // Mock data since not in DB
        experience: data.experienceYears || ''
      })
      setLicenseForm({
        licenseNo: data.licenseNumber || '',
        licenseExpiry: data.licenseExpiryDate || ''
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSavePersonal(e) {
    e.preventDefault()
    setPersonalErrors({})
    let errs = {}
    if (!form.name || form.name.trim().length < 4) {
      errs.name = "Full name phải có ít nhất 4 ký tự"
    }
    if (!form.phone || !/^0\d{9}$/.test(form.phone)) {
      errs.phone = "sai định dạng số điện thoại"
    }
    if (form.experience && parseInt(form.experience) < 1) {
      errs.experience = "phải có ít nhất 1 năm kinh nghiệm"
    }

    if (Object.keys(errs).length > 0) {
      setPersonalErrors(errs)
      return
    }

    try {
      await jockey.updateJockeyProfile(profileData.id, {
        fullName: form.name,
        phone: form.phone,
        birthDate: profileData.birthDate || '2000-01-01',
        experienceYears: form.experience || 0,
        licenseNumber: licenseForm.licenseNo,
        licenseExpiryDate: licenseForm.licenseExpiry || null
      })
      alert('✅ Cập nhật thông tin thành công!')
      setEditingPersonal(false)
      loadProfile()
    } catch (err) {
      alert('❌ Lỗi cập nhật: ' + (err.response?.data?.message || err.message))
    }
  }

  async function handleSaveLicense(e) {
    e.preventDefault()
    try {
      await jockey.updateLicense(profileData.id, {
        licenseNumber: licenseForm.licenseNo,
        licenseExpiryDate: licenseForm.licenseExpiry || null
      })
      alert('✅ Cập nhật giấy phép thành công!')
      setEditingLicense(false)
      loadProfile()
    } catch (err) {
      alert('❌ Lỗi cập nhật giấy phép: ' + (err.response?.data?.message || err.message))
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>Đang tải hồ sơ...</div>
  if (!profileData) return <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>Không thể tải hồ sơ.</div>

  const isLicenseActive = profileData.accountStatus === 'ACTIVE'
  
  return (
    <div className="profile-view">
      {/* hero card */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {(profileData.fullName || 'J').charAt(0)}
          </div>
          <span className={`jockey-badge ${isLicenseActive ? 'jockey-badge--green' : 'jockey-badge--gray'}`}>
            {isLicenseActive ? '✓ Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{profileData.fullName}</h2>
          <div className="profile-hero-nick">"{profileData.userName}"</div>
          <div className="profile-hero-meta">
            <span>🪪 {profileData.id}</span>
            <span>📋 {profileData.licenseNumber}</span>
            <span>📅 Sinh ngày {profileData.birthDate || 'N/A'}</span>
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
              <strong style={{ color: '#00d4aa' }}>{jockeyProfile.stats.winRate}%</strong>
              <span>Tỷ lệ thắng</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#c084fc' }}>{jockeyProfile.stats.totalPoints.toLocaleString()}</strong>
              <span>Điểm</span>
            </div>
          </div>
        </div>
      </div>

      {/* details */}
      <div className="profile-detail-grid">
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Thông tin cá nhân</h3>
            {!editingPersonal && (
              <button
                type="button"
                className="jockey-btn jockey-btn--ghost jockey-btn--sm"
                onClick={() => setEditingPersonal(true)}
              >
                ✎ Sửa
              </button>
            )}
          </div>
          <div className="jockey-card-body">
            {editingPersonal ? (
              <form onSubmit={handleSavePersonal}>
                <div className="jockey-form-grid">
                  <div className="jockey-form-group">
                    <label className="jockey-label">Tên hiển thị</label>
                    <input className="jockey-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                    {personalErrors.name && <span className="profile-err">{personalErrors.name}</span>}
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Biệt danh (Username)</label>
                    <input className="jockey-input" value={form.nickname} disabled style={{opacity: 0.5}} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Số điện thoại</label>
                    <input className="jockey-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                    {personalErrors.phone && <span className="profile-err">{personalErrors.phone}</span>}
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Năm kinh nghiệm</label>
                    <input className="jockey-input" type="number" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
                    {personalErrors.experience && <span className="profile-err">{personalErrors.experience}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="submit" className="jockey-btn jockey-btn--teal jockey-btn--sm">✓ Lưu thay đổi</button>
                  <button type="button" className="jockey-btn jockey-btn--ghost jockey-btn--sm" onClick={() => setEditingPersonal(false)}>Hủy</button>
                </div>
              </form>
            ) : (
              <>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Họ tên</span><span className="jockey-detail-value">{profileData.fullName}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Biệt danh</span><span className="jockey-detail-value">"{profileData.userName}"</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Email</span><span className="jockey-detail-value">{profileData.email}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Điện thoại</span><span className="jockey-detail-value">{profileData.phone}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Kinh nghiệm</span><span className="jockey-detail-value">{profileData.experienceYears} năm</span></div>
              </>
            )}
          </div>
        </div>

        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Thông tin giấy phép</h3>
            {!editingLicense && (
              <button
                type="button"
                className="jockey-btn jockey-btn--ghost jockey-btn--sm"
                onClick={() => setEditingLicense(true)}
              >
                ✎ Cập nhật
              </button>
            )}
          </div>
          <div className="jockey-card-body">
            {editingLicense ? (
               <form onSubmit={handleSaveLicense}>
                 <div className="jockey-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                   <div className="jockey-form-group">
                     <label className="jockey-label">Số giấy phép</label>
                     <input className="jockey-input" value={licenseForm.licenseNo} onChange={(e) => setLicenseForm({...licenseForm, licenseNo: e.target.value})} required />
                   </div>
                   <div className="jockey-form-group">
                     <label className="jockey-label">Ngày hết hạn</label>
                     <input className="jockey-input" type="date" value={licenseForm.licenseExpiry} onChange={(e) => setLicenseForm({...licenseForm, licenseExpiry: e.target.value})} />
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                   <button type="submit" className="jockey-btn jockey-btn--teal jockey-btn--sm">✓ Lưu giấy phép</button>
                   <button type="button" className="jockey-btn jockey-btn--ghost jockey-btn--sm" onClick={() => setEditingLicense(false)}>Hủy</button>
                 </div>
               </form>
            ) : (
              <>
                <div className="profile-license-badge">
                  <span className="plb-icon">🪪</span>
                  <div>
                    <div className="plb-number">{profileData.licenseNumber}</div>
                    <div className="plb-sub">Giấy phép thi đấu chính thức</div>
                  </div>
                  <span className="jockey-badge jockey-badge--green">Còn hiệu lực</span>
                </div>
                <div className="jockey-detail-row">
                  <span className="jockey-detail-label">Số hiệu</span>
                  <span className="jockey-detail-value">{profileData.licenseNumber}</span>
                </div>
                <div className="jockey-detail-row">
                  <span className="jockey-detail-label">Ngày hết hạn</span>
                  <span className="jockey-detail-value">{profileData.licenseExpiryDate || 'Chưa cập nhật'}</span>
                </div>
                <div className="jockey-detail-row">
                  <span className="jockey-detail-label">Mã jockey</span>
                  <span className="jockey-detail-value">{profileData.id}</span>
                </div>
              </>
            )}
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
