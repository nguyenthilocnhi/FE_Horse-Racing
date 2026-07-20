/**
 * adminService.js
 * Quản lý tài khoản toàn hệ thống — dành cho Admin.
 *
 * Endpoints:
 *   GET    /admin/accounts
 *   POST   /admin/accounts
 *   PUT    /admin/accounts/{role}/{id}
 *   PUT    /admin/accounts/{role}/{id}/assign-role
 *   DELETE /admin/accounts/{role}/{id}
 */
import apiClient from './apiClient'

/**
 * Lấy danh sách tất cả tài khoản.
 */
export async function getAllAccounts() {
  const res = await apiClient.get('/admin/accounts')
  return Array.isArray(res.data)
    ? res.data
    : res.data?.content ?? res.data?.data ?? []
}

/**
 * Tạo tài khoản mới.
 * @param {object} payload - bao gồm field `role`
 */
export async function createAccount(payload) {
  const res = await apiClient.post('/admin/accounts', payload)
  return res.data
}

/**
 * Cập nhật thông tin tài khoản (bao gồm status).
 * PUT /admin/accounts/{role}/{id}
 */
export async function updateAccount(role, id, payload) {
  const res = await apiClient.put(`/admin/accounts/${role}/${id}`, payload)
  return res.data
}

// ----------------------------------------
// Registrations (Race Participation)
// ----------------------------------------
export async function getAllRegistrations() {
  const res = await apiClient.get('/admin/race-participations')
  return res.data
}

export async function approveRegistration(id) {
  const res = await apiClient.put(`/admin/race-participations/${id}/approve`)
  return res.data
}

export async function rejectRegistration(id) {
  const res = await apiClient.put(`/admin/race-participations/${id}/reject`)
  return res.data
}

/**
 * Gán vai trò mới.
 * PUT /admin/accounts/{role}/{id}/assign-role
 */
export async function assignRole(currentRole, id, payload) {
  const res = await apiClient.put(`/admin/accounts/${currentRole}/${id}/assign-role`, payload)
  return res.data
}

/**
 * Xóa tài khoản.
 * DELETE /api/admin/accounts/{role}/{id}
 */
export async function deleteAccount(role, id) {
  const res = await apiClient.delete(`/admin/accounts/${role}/${id}`)
  return res.data
}

/**
 * Lấy danh sách tất cả ngựa (Admin)
 * GET /admin/horses
 */
export async function getAllAdminHorses() {
  const res = await apiClient.get('/admin/horses')
  return res.data
}

export async function createAdminHorse(payload) {
  const res = await apiClient.post('/admin/horses', payload)
  return res.data
}

export async function updateAdminHorse(id, payload) {
  const res = await apiClient.put(`/admin/horses/${id}`, payload)
  return res.data
}

export async function deleteAdminHorse(id) {
  const res = await apiClient.delete(`/admin/horses/${id}`)
  return res.data
}

/**
 * Lấy danh sách tất cả Jockey (Admin)
 * GET /admin/jockeys
 */
export async function getAllAdminJockeys() {
  const res = await apiClient.get('/admin/jockeys')
  return res.data
}

export async function createAdminJockey(payload) {
  const res = await apiClient.post('/admin/jockeys', payload)
  return res.data
}

export async function updateAdminJockey(id, payload) {
  const res = await apiClient.put(`/admin/jockeys/${id}`, payload)
  return res.data
}

export async function deleteAdminJockey(id) {
  const res = await apiClient.delete(`/admin/jockeys/${id}`)
  return res.data
}

/**
 * Race Tracks UC-20
 */
export async function getAllRaceTracks() {
  const res = await apiClient.get('/race-tracks')
  return res.data
}

export async function createRaceTrack(payload) {
  const res = await apiClient.post('/race-tracks', payload)
  return res.data
}

export async function updateRaceTrack(id, payload) {
  const res = await apiClient.put(`/race-tracks/${id}`, payload)
  return res.data
}

export async function deleteRaceTrack(id) {
  const res = await apiClient.delete(`/race-tracks/${id}`)
  return res.data
}

// ==========================================
// Race Operations (Admin)
// ==========================================

export async function startRace(raceId, payload) {
  const res = await apiClient.put(`/races/${raceId}/start`, payload)
  return res.data
}

export async function delayRace(raceId, payload) {
  const res = await apiClient.put(`/races/${raceId}/delay`, payload)
  return res.data
}

export async function reopenPrediction(raceId, reopen = true) {
  const res = await apiClient.put(`/races/${raceId}/predictions/reopen?reopen=${reopen}`)
  return res.data
}

export async function publishRaceResult(raceId) {
  const res = await apiClient.put(`/races/${raceId}/results/publish`)
  return res.data
}

// ==========================================
// System / Referee Operations
// ==========================================
export async function getAllReferees() {
  const res = await apiClient.get('/system/referees')
  return res.data
}

export async function assignRefereeToRace(raceId, refereeId) {
  const url = refereeId 
    ? `/system/races/${raceId}/assign-referee?refereeId=${refereeId}`
    : `/system/races/${raceId}/assign-referee`
  const res = await apiClient.put(url)
  return res.data
}
