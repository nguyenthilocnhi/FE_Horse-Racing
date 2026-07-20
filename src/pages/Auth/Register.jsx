import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import * as authService from '../../services/authService'

export default function Register() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [role, setRole] = useState('SPECTATOR')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)

  // Jockey specific states
  const [jockeyExp, setJockeyExp] = useState('')
  const [jockeyWeight, setJockeyWeight] = useState('')
  const [jockeyHeight, setJockeyHeight] = useState('')
  const [jockeyLicense, setJockeyLicense] = useState('')

  // Referee specific states
  const [refereeCert, setRefereeCert] = useState('Quốc gia')
  const [refereeExp, setRefereeExp] = useState('')
  const [refereeAssoc, setRefereeAssoc] = useState('')

  // Spectator specific states
  const [specFavHorse, setSpecFavHorse] = useState('')
  const [specFavJockey, setSpecFavJockey] = useState('')
  const [specBudget, setSpecBudget] = useState('')
  const [specNotify, setSpecNotify] = useState('Email')

  // Horse Owner specific states
  const [ownerStableName, setOwnerStableName] = useState('')
  const [ownerHorseCount, setOwnerHorseCount] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')

  const validateAge = (birthdateString) => {
    const birthDate = new Date(birthdateString)
    if (isNaN(birthDate.getTime())) {
      return 'Ngày sinh không hợp lệ.'
    }

    // Calculate age (today's year is 2026 as per metadata)
    const today = new Date('2026-06-07')
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18) {
      return `Bạn chưa đủ tuổi tham gia thi đấu/dự đoán (Hiện tại ${age} tuổi, yêu cầu từ 18 tuổi trở lên).`
    }

    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name || !username || !email || !phone || !password || !dob || !role) {
      setError('Vui lòng nhập đầy đủ tất cả thông tin đăng ký!')
      return
    }

    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ (yêu cầu từ 10-11 chữ số).')
      return
    }

    const validationError = validateAge(dob)
    if (validationError) {
      setError(validationError)
      return
    }

    // Kiểm tra email trùng trước khi chuyển bước
    setEmailChecking(true)
    try {
      const result = await authService.checkEmail(email)
      if (result?.exists) {
        setError('Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.')
        setEmailChecking(false)
        return
      }
    } catch (err) {
      // Nếu API chưa có hoặc lỗi mạng → bỏ qua, cho phép tiếp tục
      console.warn('Không thể kiểm tra email:', err?.response?.status, err?.message)
    } finally {
      setEmailChecking(false)
    }

    // SPECTATOR: đăng ký thẳng, không cần bước 2
    if (role === 'SPECTATOR') {
      setLoading(true)
      try {
        const payload = {
          fullName: name,
          userName: username,
          email,
          phone,
          password,
          birthDate: dob,
          role: 'SPECTATOR',
          newRole: 'SPECTATOR',
        }
        const data = await authService.register(payload)
        if (data.success || data.token || data.user || data.id) {
          // Lưu thông tin đăng ký vào localStorage để Profile đọc được ngay
          const profileSnapshot = {
            id:        data.id   ?? data.user?.id   ?? null,
            userName:  username,
            name:      name,
            email:     email,
            phone:     phone,
            joined:    new Date().toISOString(),
            balance:   0,
            momoLinked: false,
          }
          localStorage.setItem('pending_profile', JSON.stringify(profileSnapshot))
          setSuccess(true)
        } else {
          setError(data.message || 'Đăng ký thất bại, vui lòng thử lại!')
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Đăng ký thất bại, vui lòng thử lại!')
      } finally {
        setLoading(false)
      }
      return
    }

    // Các role khác → chuyển sang bước 2
    setShowRoleForm(true)
  }

  async function handleRoleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        fullName: name,
        userName: username,
        email,
        phone,
        password,
        birthDate: dob,
        role: role === 'REFEREE' ? 'RACE_REFEREE' : role,
        newRole: role === 'REFEREE' ? 'RACE_REFEREE' : role,
        address: (role === 'HORSE_OWNER' || role === 'HORSE OWNER') ? ownerAddress : undefined,
        stableName: (role === 'HORSE_OWNER' || role === 'HORSE OWNER') ? ownerStableName : undefined,
        horseCount: (role === 'HORSE_OWNER' || role === 'HORSE OWNER') ? (ownerHorseCount ? parseInt(ownerHorseCount, 10) : undefined) : undefined,
        experienceYears: role === 'JOCKEY' 
          ? (jockeyExp ? parseInt(jockeyExp, 10) : undefined) 
          : role === 'REFEREE' 
            ? (refereeExp ? parseInt(refereeExp, 10) : undefined) 
            : undefined,
        licenseNumber: role === 'JOCKEY' ? jockeyLicense : undefined,
        certificateLevel: role === 'REFEREE' ? refereeCert : undefined,
        associationName: role === 'REFEREE' ? refereeAssoc : undefined,
      }
      
      const data = await authService.register(payload)
      if (data.success || data.token || data.user) {
        // Lưu thông tin đăng ký vào localStorage để Profile đọc được ngay
        const profileSnapshot = {
          id:        data.id   ?? data.user?.id   ?? null,
          userName:  username,
          name:      name,
          email:     email,
          phone:     phone,
          joined:    new Date().toISOString(),
          balance:   0,
          momoLinked: false,
        }
        localStorage.setItem('pending_profile', JSON.stringify(profileSnapshot))
        setSuccess(true)
      } else {
        setError(data.message || 'Đăng ký thất bại, vui lòng thử lại!')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại, vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const roleLabel = role === 'JOCKEY'
      ? 'Kỵ Sĩ'
      : role === 'REFEREE'
        ? 'Trọng tài'
        : (role === 'HORSE_OWNER' || role === 'HORSE OWNER')
          ? 'Chủ ngựa'
          : 'Khán giả'

    return (
      <div className="auth-shell" style={{ height: '620px', alignItems: 'stretch' }}>
        <style>{`
          .success-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 40px;
            background: radial-gradient(circle at center, rgba(74, 222, 128, 0.04) 0%, rgba(0, 0, 0, 0) 70%);
          }
          .success-icon-container {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .success-icon-circle {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background: rgba(74, 222, 128, 0.1);
            border: 2px solid rgba(74, 222, 128, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 25px rgba(74, 222, 128, 0.2);
            z-index: 2;
          }
          .success-icon-circle svg {
            width: 38px;
            height: 38px;
            stroke: #4ade80;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            filter: drop-shadow(0 0 5px rgba(74, 222, 128, 0.4));
          }
          .success-icon-pulse-1 {
            position: absolute;
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: rgba(74, 222, 128, 0.03);
            border: 1px solid rgba(74, 222, 128, 0.08);
            z-index: 1;
            animation: pulse-slow 3s infinite ease-in-out;
          }
          .success-icon-pulse-2 {
            position: absolute;
            width: 116px;
            height: 116px;
            border-radius: 50%;
            background: rgba(74, 222, 128, 0.015);
            border: 1px solid rgba(74, 222, 128, 0.04);
            z-index: 0;
            animation: pulse-fast 2s infinite ease-in-out;
          }
          @keyframes pulse-slow {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(0.9); opacity: 0.8; }
          }
          @keyframes pulse-fast {
            0% { transform: scale(0.85); opacity: 0.9; }
            50% { transform: scale(1.15); opacity: 0.2; }
            100% { transform: scale(0.85); opacity: 0.9; }
          }
          .success-title {
            background: linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
            font-size: 26px !important;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
          }
          .success-desc {
            color: #aaa;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 24px;
            max-width: 380px;
            margin-left: auto;
            margin-right: auto;
          }
          .account-details-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            padding: 18px 22px;
            margin-bottom: 28px;
            max-width: 340px;
            width: 100%;
            margin-left: auto;
            margin-right: auto;
            box-shadow: inset 0 1px 1px rgba(255,255,255,0.03);
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
          }
          .details-row:not(:last-child) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          }
          .details-label {
            color: #888;
            font-size: 13px;
          }
          .details-val {
            color: #fff;
            font-weight: 600;
            font-size: 14px;
          }
          .badge-role {
            background: rgba(212, 175, 55, 0.12);
            color: #d4af37;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .success-btn-login {
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 44px;
            width: 220px;
            background: linear-gradient(135deg, #e6c564, #d4af37);
            color: #0a0a0a !important;
            font-weight: 700;
            font-size: 14px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(212,175,55,0.22);
            transition: all 0.25s ease;
            margin-bottom: 18px;
            cursor: pointer;
            border: none;
          }
          .success-btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(212,175,55,0.32);
            background: linear-gradient(135deg, #fff, #d4af37);
          }
          .success-link-home {
            color: #888;
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: color 0.2s ease;
            display: inline-block;
          }
          .success-link-home:hover {
            color: #d4af37;
          }
        `}</style>

        <div className="auth-panel auth-image-panel" style={{ height: '100%' }}>
          <img
            src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80"
            alt="Ngựa đang phi"
            style={{ height: '100%', objectFit: 'cover' }}
          />
          <div className="auth-image-overlay">
            <span className="hero-label">HORSIE</span>
            <h2>Gia nhập cộng đồng đua ngựa</h2>
            <p>Tạo tài khoản để theo dõi giải đấu, xếp hạng và dự đoán</p>
          </div>
        </div>

        <div className="auth-panel auth-admin success-container">
          <div className="success-icon-container">
            <div className="success-icon-pulse-1"></div>
            <div className="success-icon-pulse-2"></div>
            <div className="success-icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="25" fill="none" />
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
          </div>

          <h2 className="success-title">Đăng ký thành công!</h2>
          <p className="success-desc">
            Tài khoản của bạn đã được thiết lập thành công. Chào mừng bạn gia nhập cộng đồng HORSIE!
          </p>

          <div className="account-details-card">
            <div className="details-row">
              <span className="details-label">Tên đăng nhập</span>
              <span className="details-val">{username}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Vai trò tài khoản</span>
              <span className="details-val">
                <span className="badge-role">{roleLabel}</span>
              </span>
            </div>
          </div>

          <Link to="/login" className="success-btn-login">
            Đăng nhập ngay
          </Link>
          <Link to="/" className="success-link-home">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  if (showRoleForm) {
    return (
      <div className="auth-shell" style={{ height: '620px', alignItems: 'stretch' }}>
        <div className="auth-panel auth-image-panel" style={{ height: '100%' }}>
          <img
            src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80"
            alt="Ngựa đang phi"
            style={{ height: '100%', objectFit: 'cover' }}
          />
          <div className="auth-image-overlay">
            <span className="hero-label">HORSIE</span>
            <h2>Thông tin vai trò</h2>
            <p>Bổ sung thông tin chi tiết cho vai trò bạn đã chọn để hoàn tất thủ tục đăng ký.</p>
          </div>
        </div>

        <div className="auth-panel auth-admin" style={{ height: '100%', overflowY: 'auto' }}>
          <div className="auth-panel-head">
            <span className="hero-label">
              {role === 'JOCKEY' ? 'Kỵ Sĩ' : role === 'REFEREE' ? 'Trọng Tài' : (role === 'HORSE_OWNER' || role === 'HORSE OWNER') ? 'Chủ Ngựa' : 'Khán Giả'}
            </span>
            {role !== 'SPECTATOR' && (
              <>
                <h2>Thông tin chức vụ</h2>
                <p>Vui lòng điền các thông tin dành riêng cho vai trò của bạn.</p>
              </>
            )}
          </div>

          <form onSubmit={handleRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {role === 'JOCKEY' && (
              <>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Số năm kinh nghiệm</label>
                  <input
                    type="number"
                    value={jockeyExp}
                    onChange={e => setJockeyExp(e.target.value)}
                    placeholder="Ví dụ: 3"
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={jockeyWeight}
                    onChange={e => setJockeyWeight(e.target.value)}
                    placeholder="Ví dụ: 55"
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={jockeyHeight}
                    onChange={e => setJockeyHeight(e.target.value)}
                    placeholder="Ví dụ: 165"
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Số giấy phép hành nghề</label>
                  <input
                    type="text"
                    value={jockeyLicense}
                    onChange={e => setJockeyLicense(e.target.value)}
                    placeholder="Ví dụ: LIC-12345"
                    className="input-field"
                    required
                  />
                </div>
              </>
            )}

            {role === 'REFEREE' && (
              <>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Cấp bậc chứng chỉ</label>
                  <select
                    value={refereeCert}
                    onChange={e => setRefereeCert(e.target.value)}
                    className="input-field"
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#f5f5f5', border: '1px solid rgba(255, 255, 255, 0.18)' }}
                    required
                  >
                    <option value="Quốc tế" style={{ background: '#1c1c1e', color: '#fff' }}>Quốc tế (International)</option>
                    <option value="Quốc gia" style={{ background: '#1c1c1e', color: '#fff' }}>Quốc gia (National)</option>
                    <option value="Cấp tỉnh" style={{ background: '#1c1c1e', color: '#fff' }}>Cấp tỉnh (Provincial)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Số năm kinh nghiệm trọng tài</label>
                  <input
                    type="number"
                    value={refereeExp}
                    onChange={e => setRefereeExp(e.target.value)}
                    placeholder="Ví dụ: 5"
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Hiệp hội trọng tài thành viên</label>
                  <input
                    type="text"
                    value={refereeAssoc}
                    onChange={e => setRefereeAssoc(e.target.value)}
                    placeholder="Ví dụ: Hiệp hội Trọng tài Việt Nam"
                    className="input-field"
                    required
                  />
                </div>
              </>
            )}

            {(role === 'HORSE_OWNER' || role === 'HORSE OWNER') && (
              <>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Tên trang trại / Chuồng ngựa</label>
                  <input
                    type="text"
                    value={ownerStableName}
                    onChange={e => setOwnerStableName(e.target.value)}
                    placeholder="Ví dụ: Golden Stable"
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Số lượng ngựa đang sở hữu</label>
                  <input
                    type="number"
                    value={ownerHorseCount}
                    onChange={e => setOwnerHorseCount(e.target.value)}
                    placeholder="Ví dụ: 5"
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={ownerAddress}
                    onChange={e => setOwnerAddress(e.target.value)}
                    placeholder="Ví dụ: Quận 9, TP. Hồ Chí Minh"
                    className="input-field"
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="auth-error" style={{ color: '#f87171', fontSize: '13px', background: 'rgba(248,113,113,0.08)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.15)', margin: '10px 0' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: '5px', background: 'rgba(255,255,255,0.05)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setShowRoleForm(false)}
              disabled={loading}
            >
              Quay lại bước trước
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell" style={{ height: '620px', alignItems: 'stretch' }}>
      <div className="auth-panel auth-image-panel" style={{ height: '100%' }}>
        <img
          src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80"
          alt="Ngựa đang phi"
          style={{ height: '100%', objectFit: 'cover' }}
        />
        <div className="auth-image-overlay">
          <span className="hero-label">HORSIE</span>
          <h2>Gia nhập cộng đồng đua ngựa</h2>
          <p>Tạo tài khoản để theo dõi giải đấu, xếp hạng và dự đoán</p>
        </div>
      </div>

      <div className="auth-panel auth-admin" style={{ height: '100%', overflowY: 'auto' }}>
        <div className="auth-panel-head">
          <span className="hero-label">Đăng ký</span>
          <h2>Tạo tài khoản mới</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div className="form-group">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Họ và tên"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tên đăng nhập (Username)"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Số điện thoại"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              type="password"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = 'text'
              }}
              value={dob}
              onChange={e => setDob(e.target.value)}
              placeholder="Ngày sinh (Đủ 18 tuổi trở lên)"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="input-field"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#f5f5f5', border: '1px solid rgba(255, 255, 255, 0.18)' }}
              required
            >
              <option value="SPECTATOR" style={{ background: '#1c1c1e', color: '#fff' }}>Khán giả (Spectator)</option>
              <option value="JOCKEY" style={{ background: '#1c1c1e', color: '#fff' }}>Kỵ sĩ (Jockey)</option>
              <option value="REFEREE" style={{ background: '#1c1c1e', color: '#fff' }}>Trọng tài (Referee)</option>
              <option value="HORSE_OWNER" style={{ background: '#1c1c1e', color: '#fff' }}>Chủ ngựa (Horse Owner)</option>
            </select>
          </div>

          {error && (
            <p style={{
              color: '#f87171',
              fontSize: '13px',
              background: 'rgba(248,113,113,0.08)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(248,113,113,0.25)',
              margin: '4px 0 0',
              lineHeight: '1.5'
            }}>
              ⚠️ {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }} disabled={emailChecking || loading}>
            {emailChecking ? 'Đang kiểm tra email...' : loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
          </button>

          <p className="help-text" style={{ marginTop: 14, textAlign: 'center', fontSize: '13px' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" className="help-link" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '500' }}>
              Đăng nhập
            </Link>
          </p>

          <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <Link to="/" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '500' }}>
              ← Quay về trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
