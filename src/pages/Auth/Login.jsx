import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function getLoginErrorMessage(error) {
  if (!error.response) {
    return 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ.'
  }

  if (error.response.status >= 500) {
    return 'Máy chủ backend đang gặp sự cố (500). Vui lòng thử lại sau.'
  }

  return error.response.data?.message || 'Email hoặc mật khẩu không đúng.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login({ email, password })
      const role = data.user?.role
      if (role === 'ADMIN') {
        navigate('/admin')
      } else if (role === 'JOCKEY') {
        navigate('/jockey')
      } else if (role === 'REFEREE' || role === 'RACE_REFEREE') {
        navigate('/referee')
      } else if (role === 'SPECTATOR') {
        navigate('/spectator')
      } else if (role === 'OWNER' || role === 'HORSE_OWNER' || role === 'HORSE OWNER') {
        navigate('/owner')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel auth-image-panel">
        <img
          src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80"
          alt="Ngựa đang phi"
        />
        <div className="auth-image-overlay">
          <span className="hero-label">HORSIE</span>
          <h2>Trải nghiệm đua ngựa đỉnh cao</h2>
          <p>Tham gia cộng đồng yêu thích môn thể thao đua ngựa</p>
        </div>
      </div>

      <div className="auth-panel auth-admin">
        <div className="auth-panel-head">
          <span className="hero-label">Tài khoản</span>
          <h2>Đăng nhập</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
          <div className="form-group">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field"
            />
          </div>
          <div className="form-group">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              type="password"
              className="input-field"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginBottom: '14px' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '13px' }}>
            <Link to="/reset-password" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '500' }}>
              Quên mật khẩu?
            </Link>
            <Link to="/register" style={{ color: '#aaa', textDecoration: 'none' }}>
              Đăng ký tài khoản
            </Link>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
            <Link to="/" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '500' }}>
              ← Quay về trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
