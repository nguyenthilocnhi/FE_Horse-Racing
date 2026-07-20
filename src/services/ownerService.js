/**
 * ownerService.js
 * Chức năng dành cho Horse Owner:
 *   - Quản lý ngựa (GET / POST / PUT)
 *   - Đăng ký tham gia đua (register horse + assign jockey)
 *
 * Endpoints:
 *   GET  /owner/horses
 *   POST /owner/horses
 *   PUT  /owner/horses/{horseId}
 *   POST /owner/race-participations/register-horse
 *   POST /owner/race-participations/{id}/register-jockey
 *   GET /owner/race-participations
 */
import apiClient from './apiClient'

// ─────────────────────────────────────────
// NGỰA
// ─────────────────────────────────────────

/** Lấy danh sách ngựa của owner đang đăng nhập */
export async function getOwnerHorses() {
  const res = await apiClient.get('/owner/horses')
  return res.data
}

/**
 * Tạo ngựa mới.
 * @param {{ name, breed, age, weight, color, ... }} payload
 */
export async function createOwnerHorse(payload) {
  const res = await apiClient.post('/owner/horses', payload)
  return res.data
}

/**
 * Cập nhật thông tin ngựa.
 * @param {string|number} horseId
 * @param {object} payload
 */
export async function updateOwnerHorse(horseId, payload) {
  const res = await apiClient.put(`/owner/horses/${horseId}`, payload)
  return res.data
}

/**
 * Xóa ngựa.
 * @param {string|number} horseId
 */
export async function deleteOwnerHorse(horseId) {
  const res = await apiClient.delete(`/owner/horses/${horseId}`)
  return res.data
}

// ─────────────────────────────────────────
// ĐĂNG KÝ THAM GIA ĐUA
// ─────────────────────────────────────────

/**
 * Đăng ký ngựa vào một cuộc đua / lịch đua.
 * @param {{ horseId, raceScheduleId, ... }} payload
 * @returns {{ participationId, ... }}
 */
export async function registerHorseToRace(payload) {
  const res = await apiClient.post('/owner/race-participations/register-horse', payload)
  return res.data
}

/**
 * Gán jockey cho một đăng ký tham gia đua.
 * @param {string|number} participationId
 * @param {{ jockeyId, ... }} payload
 */
export async function assignJockeyToParticipation(participationId, payload) {
  const res = await apiClient.post(
    `/owner/race-participations/${participationId}/register-jockey`,
    payload
  )
  return res.data
}

/**
 * Lấy lịch sử đăng ký tham gia cuộc đua của owner
 */
export async function getMyParticipations() {
  const res = await apiClient.get('/owner/race-participations')
  return res.data
}
