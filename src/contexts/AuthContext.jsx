import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(212, 175, 55, 0.2)',
        borderRadius: '12px',
        padding: '30px 40px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(212, 175, 55, 0.05)',
        textAlign: 'center',
      }}>
        <h3 style={{ color: '#d4af37', margin: '0 0 15px 0', fontSize: '20px', fontWeight: '600' }}>
          Xác nhận đăng xuất
        </h3>
        <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', margin: '0 0 25px 0' }}>
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Đua Ngựa?
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 22px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#aaa',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 22px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #e6c564, #d4af37)',
              color: '#111',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
              transition: 'all 0.2s',
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token')
    // Nếu là token dev cũ -> xóa sạch
    if (t === 'dev-token') {
      localStorage.removeItem('token')
      return null
    }
    return t
  })
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try {
        const parsed = JSON.parse(u)
        // Nếu là user dev cũ -> xóa sạch
        if (parsed?.id === 'DEV-ADMIN') {
          localStorage.removeItem('user')
          return null
        }
        return parsed
      } catch (_) {
        return null
      }
    }
    return null
  })
  const [showLogoutModal, setShowLogoutModal] = useState(false)


  // Đã bỏ tự động đăng nhập tài khoản DEV để tránh tự ý vào portal khi vào trang chủ /


  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  async function login(credentials) {
    const data = await authService.login(credentials)
    // Gộp tất cả thông tin từ data.user và response gốc để không bỏ sót field
    const raw = data.user ? { ...data, ...data.user } : data
    const userObj = raw.role ? {
      id:        raw.id        ?? raw.userId      ?? null,
      username:  raw.userName  ?? raw.username    ?? '',
      name:      raw.fullName  ?? raw.name        ?? '',
      email:     raw.email     ?? '',
      phone:     raw.phone     ?? raw.phoneNumber ?? '',
      role:      raw.role,
      createdAt: raw.createdAt ?? raw.joinedAt    ?? raw.joined ?? null,
    } : null
    setToken(data.token)
    setUser(userObj)
    return { ...data, user: userObj }
  }

  function logout() {
    setShowLogoutModal(true)
  }

  function handleConfirmLogout() {
    if (import.meta.env.DEV) {
      localStorage.setItem('disableDevAutoLogin', '1')
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setShowLogoutModal(false)
    window.location.href = '/'
  }

  function handleCancelLogout() {
    setShowLogoutModal(false)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
      {showLogoutModal && (
        <LogoutModal 
          onConfirm={handleConfirmLogout} 
          onCancel={handleCancelLogout} 
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
