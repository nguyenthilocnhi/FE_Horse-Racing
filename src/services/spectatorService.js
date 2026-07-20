/**
 * spectatorService.js
 * Chức năng dành cho Spectator: xem và cập nhật hồ sơ cá nhân.
 *
 * Endpoints:
 *   GET /spectators/me   (hoặc fallback /spectators/{id})
 *   PUT /spectators/{id}
 */
import apiClient from './apiClient'

/**
 * Lấy thông tin hồ sơ spectator đang đăng nhập.
 * @param {string|number|null} id - fallback khi không có /me endpoint
 */
export async function getSpectatorProfile(id) {
  try {
    const res = await apiClient.get('/auth/me')
    return res.data
  } catch (err) {
    throw err
  }
}

/**
 * Cập nhật thông tin hồ sơ spectator.
 * @param {string|number} id
 * @param {{ fullName, email, phone }} payload
 */
export async function updateSpectatorProfile(id, payload) {
  const res = await apiClient.put(`/spectators/${id}`, payload)
  return res.data
}
