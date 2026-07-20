/**
 * horseService.js
 * Tìm kiếm và xem thông tin ngựa (public / admin).
 *
 * Endpoints:
 *   GET /horses/search?keyword=...
 *   GET /horses
 *   GET /horses/{id}
 *   POST /horses          (admin)
 */
import apiClient from './apiClient'

/** Lấy toàn bộ danh sách ngựa */
export async function getHorses() {
  const res = await apiClient.get('/horses')
  return res.data
}

/** Lấy thông tin một con ngựa theo ID */
export async function getHorse(id) {
  const res = await apiClient.get(`/v1/horses/${id}`)
  return res.data
}

/** Lấy lịch sử thi đấu ngựa */
export async function getHorseHistory(id) {
  const res = await apiClient.get(`/v1/horses/${id}/history`)
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
  return res.data
}

/**
 * Tạo ngựa mới (Admin).
 * @param {object} payload
 */
export async function createHorse(payload) {
  const res = await apiClient.post('/horses', payload)
  return res.data
}

/**
 * Cập nhật ngựa (Admin).
 * @param {string|number} id
 * @param {object} payload
 */
export async function updateHorse(id, payload) {
  const res = await apiClient.put(`/horses/${id}`, payload)
  return res.data
}
