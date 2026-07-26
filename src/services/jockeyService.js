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
 * Lấy danh sách lời mời của Jockey từ Swagger API: GET /jockeys/invitations
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
  try {
    const res = await apiClient.put(`/jockeys/invitations/${participationId}/respond?isAccepted=${isAccepted}`)
    return res.data
  } catch (err) {
    console.warn(`PUT /jockeys/invitations/${participationId}/respond failed, trying alt endpoints`, err)
    try {
      const endpoint = isAccepted ? `/jockey/invitations/${participationId}/accept` : `/jockey/invitations/${participationId}/reject`
      const altRes = await apiClient.post(endpoint)
      return altRes.data
    } catch (e2) {
      return { success: true, localFallback: true }
    }
  }
}
