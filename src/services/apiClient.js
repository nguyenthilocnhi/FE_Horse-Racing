/**
 * apiClient.js
 * Base axios instance dùng chung cho toàn bộ service layer.
 * Tự động gắn Bearer token và redirect về login khi 401.
 */
import axios from 'axios'
import { API_BASE_URL } from '../constants/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: gắn token ──
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: xử lý lỗi toàn cục ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ → về trang login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
