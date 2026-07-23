/**
 * authService.js
 * Xác thực và đăng ký tài khoản kết nối với Backend Spring Boot.
 * Endpoints:
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *   POST /api/register
 *   GET  /api/auth/me
 */
import apiClient from './apiClient'

export const DEMO_USERS = {
  ADMIN: { username: 'admin@horseracing.com', password: '123' },
  SPECTATOR: { username: 'spectator@horseracing.com', password: '123' },
  JOCKEY: { username: 'jockey@horseracing.com', password: '123' },
  OWNER: { username: 'owner@horseracing.com', password: '123' },
  REFEREE: { username: 'referee@horseracing.com', password: '123' }
}

/** Đăng nhập gửi đến Backend */
export async function login(credentials) {
  const emailVal = (credentials.email || credentials.username || credentials.userName || '').trim()
  const payload = {
    email: emailVal,
    username: emailVal,
    userName: emailVal,
    password: credentials.password
  }
  
  try {
    const res = await apiClient.post('/auth/login', payload)
    return res.data
  } catch (err) {
    // Nếu backend trả về error message từ Spring Boot
    if (err.response?.data) {
      throw err
    }
    // Nếu backend đang offline, tạo error báo rõ ràng
    throw new Error('Không thể kết nối máy chủ backend. Vui lòng bật Backend Spring Boot (Port 6768).')
  }
}

/** Đăng xuất (huỷ token phía server nếu backend hỗ trợ) */
export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } catch (_) {
    /* ignore */
  }
}

/** Gửi email đặt lại mật khẩu */
export async function forgotPassword(email) {
  const res = await apiClient.post('/auth/forgot-password', { email })
  return res.data
}

/** Đặt lại mật khẩu bằng token từ email */
export async function resetPassword(payload) {
  const res = await apiClient.post('/auth/reset-password', payload)
  return res.data
}

/** Đăng ký tài khoản mới */
export async function register(payload) {
  const res = await apiClient.post('/register', payload)
  return res.data
}

/** Kiểm tra email đã tồn tại chưa */
export async function checkEmail(email) {
  try {
    const res = await apiClient.get(`/check-email?email=${encodeURIComponent(email)}`)
    return res.data
  } catch (_) {
    return { exists: false }
  }
}

/** Lấy thông tin user hiện tại */
export async function getMe() {
  const res = await apiClient.get('/auth/me')
  return res.data
}
