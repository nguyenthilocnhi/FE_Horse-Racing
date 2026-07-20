/**
 * authService.js
 * Xác thực và đăng ký tài khoản.
 *
 * Endpoints:
 *   POST /auth/login
 *   POST /auth/logout
 *   POST /auth/forgot-password
 *   POST /auth/reset-password
 *   POST /register
 *   GET  /check-email
 */
import apiClient from './apiClient'

/** Đăng nhập — trả về { token, role, fullName, email, phone, ... } */
export async function login(credentials) {
  const res = await apiClient.post('/auth/login', credentials)
  return res.data
}

/** Đăng xuất (huỷ token phía server nếu backend hỗ trợ) */
export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } catch (_) { /* ignore, dọn localStorage ở AuthContext */ }
}

/** Gửi email đặt lại mật khẩu */
export async function forgotPassword(email) {
  const res = await apiClient.post('/auth/forgot-password', { email })
  return res.data
}

/**
 * Đặt lại mật khẩu bằng token từ email.
 * @param {{ token: string, newPassword: string }} payload
 */
export async function resetPassword(payload) {
  const res = await apiClient.post('/auth/reset-password', payload)
  return res.data
}

/** Đăng ký tài khoản mới (tất cả role) */
export async function register(payload) {
  const res = await apiClient.post('/register', payload)
  return res.data
}

/** Kiểm tra email đã tồn tại chưa — { exists: boolean } */
export async function checkEmail(email) {
  const res = await apiClient.get(`/check-email?email=${encodeURIComponent(email)}`)
  return res.data
}

/** Lấy thông tin user hiện tại */
export async function getMe() {
  const res = await apiClient.get('/auth/me')
  return res.data
}
