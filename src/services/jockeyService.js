/**
 * jockeyService.js
 * Chức năng dành cho Jockey.
 *
 * Endpoints:
 *   PUT /jockeys/{id}/profile
 */
import apiClient from './apiClient'

/**
 * Cập nhật hồ sơ Jockey.
 * @param {string|number} id - ID jockey
 * @param {{ fullName, phone, weight, height, experienceYears, licenseNumber, ... }} payload
 */
export async function updateJockeyProfile(id, payload) {
  const res = await apiClient.put(`/jockeys/${id}/profile`, payload)
  return res.data
}

/**
 * Lấy thông tin hồ sơ Jockey theo ID.
 * @param {string|number} id
 */
export async function getJockeyProfile(id) {
  const res = await apiClient.get(`/jockeys/${id}`)
  return res.data
}
