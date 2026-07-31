/**
 * spectatorService.js
 * Chức năng dành cho Spectator: xem/cập nhật hồ sơ cá nhân và ví tài khoản.
 *
 * Endpoints:
 *   GET /auth/me (hoặc /spectators/{id})
 *   PUT /spectators/{id}
 */
import apiClient from './apiClient'

/**
 * Lấy thông tin hồ sơ spectator đang đăng nhập.
 * @param {string|number|null} id
 */
export async function getSpectatorProfile(id) {
  if (id && !isNaN(Number(id))) {
    try {
      const res = await apiClient.get(`/spectators/${id}`)
      return res.data
    } catch (_) {
      /* fallback sang /auth/me bên dưới */
    }
  }

  try {
    const res = await apiClient.get('/auth/me')
    return res.data
  } catch (err) {
    if (id) {
      try {
        const res = await apiClient.get(`/spectators/${id}`)
        return res.data
      } catch (_) { }
    }
    return null
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



/**
 * Lấy danh sách giao dịch của khán giả theo spectatorId từ API Swagger.
 * Endpoint: GET /v1/tickets/spectators/{spectatorId}/transactions
 * Header: Authorization: Bearer <token>
 * @param {string|number} spectatorId
 * @returns {Promise<Array>}
 */
export async function getSpectatorTransactions(spectatorId) {
  const numId = Number(spectatorId)
  if (!spectatorId || isNaN(numId)) {
    throw new Error('spectatorId không hợp lệ')
  }
  try {
    const res = await apiClient.get(`/v1/tickets/spectators/${numId}/transactions`)
    return res.data?.data || res.data
  } catch (err) {
    if (err?.response?.status === 404) {
      const fallbackRes = await apiClient.get(`/tickets/spectators/${numId}/transactions`)
      return fallbackRes.data?.data || fallbackRes.data
    }
    throw err
  }
}

