import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function getLoginErrorMessage(error) {
  if (!error.response) {
    return 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ.'
  }

  const status = error.response.status
  const response = error.response.data

  if (status >= 500) {
    return 'Máy chủ backend đang gặp sự cố (500). Vui lòng thử lại sau.'
  }

  // Backend Spring Boot trả lỗi validation 400
  if (status === 400) {
    if (response?.errors?.length > 0) {
      return response.errors[0].defaultMessage
    }

    return response?.message || 'Dữ liệu đăng nhập không hợp lệ.'
  }

  if (status === 401) {
    return 'Email hoặc mật khẩu không đúng.'
  }

  return response?.message || 'Đăng nhập thất bại.'
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


    // Validate input
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError('Vui lòng nhập email.')
      return
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }


    setLoading(true)

    try {

      // gửi email đã loại bỏ khoảng trắng
      const data = await login({
        email: cleanEmail,
        password
      })


      console.log('LOGIN RESPONSE:', data)


      // Backend có thể trả:
      // {
      //    token,
      //    role
      // }
      //
      // hoặc:
      //
      // {
      //    token,
      //    user:{
      //       role
      //    }
      // }

      let role = data.user?.role || data.role
      if (typeof role === 'string') {
        role = role.replace(/^ROLE_/i, '').toUpperCase()
      }


      switch (role) {

        case 'ADMIN':
          navigate('/admin')
          break

        case 'JOCKEY':
          navigate('/jockey')
          break

        case 'REFEREE':
        case 'RACE_REFEREE':
          navigate('/referee')
          break

        case 'SPECTATOR':
          navigate('/spectator')
          break

        case 'OWNER':
        case 'HORSE_OWNER':
        case 'HORSE OWNER':
          navigate('/owner')
          break

        default:
          navigate('/')
      }


    } catch (err) {

      console.error('LOGIN ERROR:', err)

      setError(
        getLoginErrorMessage(err)
      )

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

          <span className="hero-label">
            HORSIE
          </span>

          <h2>
            Trải nghiệm đua ngựa đỉnh cao
          </h2>

          <p>
            Tham gia cộng đồng yêu thích môn thể thao đua ngựa
          </p>

        </div>

      </div>



      <div className="auth-panel auth-admin">


        <div className="auth-panel-head">

          <span className="hero-label">
            Tài khoản
          </span>

          <h2>
            Đăng nhập
          </h2>

        </div>



        <form onSubmit={handleSubmit}>


          {
            error &&
            (
              <p className="auth-error">
                {error}
              </p>
            )
          }



          <div className="form-group">

            <input
              type="email"
              value={email}
              onChange={
                e => setEmail(e.target.value)
              }
              placeholder="Email"
              className="input-field"
              autoComplete="email"
            />

          </div>



          <div className="form-group">

            <input
              type="password"
              value={password}
              onChange={
                e => setPassword(e.target.value)
              }
              placeholder="Mật khẩu"
              className="input-field"
              autoComplete="current-password"
            />

          </div>



          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              marginBottom: '14px'
            }}
          >

            {
              loading
                ? 'Đang đăng nhập...'
                : 'Đăng nhập'
            }

          </button>




          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
              fontSize: '13px'
            }}
          >

            <Link
              to="/reset-password"
              style={{
                color: '#d4af37',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Quên mật khẩu?
            </Link>


            <Link
              to="/register"
              style={{
                color: '#aaa',
                textDecoration: 'none'
              }}
            >
              Đăng ký tài khoản
            </Link>


          </div>




          <div
            style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '14px'
            }}
          >

            <Link
              to="/"
              style={{
                color: '#d4af37',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              ← Quay về trang chủ
            </Link>

          </div>


        </form>


      </div>


    </div>
  )
}