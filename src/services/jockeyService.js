/**
 * jockeyService.js
 * Chức năng dành cho Jockey.
 *   PUT /jockeys/{id}/profile
 *   GET /jockeys
 *   GET /jockeys/invitations
 *   PUT /jockeys/invitations/{participationId}/respond
 */
import apiClient from './apiClient'

/**
 * Lấy tất cả Jockeys
 */
export async function getAllJockeys() {
  const res = await apiClient.get('/jockeys')
  return res.data
}

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

/**
 * Cập nhật giấy phép Jockey.
 * @param {string|number} id
 * @param {{ licenseNumber, licenseExpiryDate }} payload
 */
export async function updateLicense(id, payload) {
  const res = await apiClient.put(`/jockeys/${id}/license`, payload)
  return res.data
}

/**
 * Lấy danh sách lời mời của Jockey
 */
export async function getMyInvitations() {
  const res = await apiClient.get('/jockeys/invitations')
  return res.data
}

/**
 * Phản hồi lời mời thi đấu
 * @param {string|number} participationId 
 * @param {boolean} isAccepted 
 */
export async function respondToInvitation(participationId, isAccepted) {
  const res = await apiClient.put(`/jockeys/invitations/${participationId}/respond?isAccepted=${isAccepted}`)
  return res.data
}
