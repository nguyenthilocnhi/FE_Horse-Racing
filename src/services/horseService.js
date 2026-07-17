/**
 * horseService.js
 * Quản lý thông tin ngựa (public / admin).
 *
 * Endpoints:
 *   GET    /api/v1/horses
 *   POST   /api/v1/horses
 *   PUT    /api/v1/horses/{id}
 *   DELETE /api/v1/horses/{id}
 *   GET    /api/horses/search?keyword=...
 */
import apiClient from './apiClient'

/** Lấy toàn bộ danh sách ngựa */
export async function getHorses() {
  const res = await apiClient.get('/v1/horses')
  return res.data
}

/** Lấy thông tin một con ngựa theo ID */
export async function getHorse(id) {
  const res = await apiClient.get(`/v1/horses/${id}`)
  return res.data
}

/**
 * Tìm kiếm ngựa theo từ khoá.
 * @param {string} keyword - tên, giống, màu sắc...
 */
export async function searchHorses(keyword) {
  const res = await apiClient.get('/horses/search', {
    params: { keyword },
  })
  return res.data?.data ?? res.data ?? []
}

/**
 * Tạo ngựa mới (Admin).
 * @param {object} payload
 */
export async function createHorse(payload) {
  const res = await apiClient.post('/v1/horses', payload)
  return res.data
}

/**
 * Cập nhật ngựa (Admin).
 * @param {string|number} id
 * @param {object} payload
 */
export async function updateHorse(id, payload) {
  const res = await apiClient.put(`/v1/horses/${id}`, payload)
  return res.data
}

/**
 * Xóa ngựa (Admin).
 * @param {string|number} id
 */
export async function deleteHorse(id) {
  const res = await apiClient.delete(`/v1/horses/${id}`)
  return res.data
}
