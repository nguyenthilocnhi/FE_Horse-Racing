import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function getLoginErrorMessage(error) {
  if (!error.response) {
    return 'Không thể kết nối máy chủ. Hãy chạy backend tại http://localhost:4000.'
  }

  if (error.response.status >= 500) {
    return 'Máy chủ backend chưa sẵn sàng. Hãy khởi động backend tại http://localhost:4000.'
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
      await login({ email, password })
      navigate('/')
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
          <p>Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
