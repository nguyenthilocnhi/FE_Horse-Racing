import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    alert('Register submitted')
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
          <h2>Gia nhập cộng đồng đua ngựa</h2>
          <p>Tạo tài khoản để theo dõi giải đấu, xếp hạng và dự đoán</p>
        </div>
      </div>

      <div className="auth-panel auth-admin">
        <div className="auth-panel-head">
          <span className="hero-label">Tài khoản</span>
          <h2>Đăng ký</h2>
          <p>Tạo tài khoản mới để bắt đầu trải nghiệm.</p>
        </div>

        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn btn-primary">
            Đăng ký
          </button>
          <p className="help-text" style={{ marginTop: 20, textAlign: 'center' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" className="help-link">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
