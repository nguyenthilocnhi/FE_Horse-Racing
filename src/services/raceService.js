/**
 * raceService.js
 * Điều hành cuộc đua và xuất dữ liệu.
 *
 * Endpoints:
 *   PUT  /races/{raceId}/delay
 *   PUT  /races/{raceId}/predictions/reopen
 *   PUT  /races/{raceId}/start
 *   POST /races/{raceId}/results
 *   PUT  /races/{raceId}/results/publish
 *   POST /races/{raceId}/reports/pre-race
 *   POST /races/{raceId}/reports/post-race
 *   POST /races/{raceId}/violations
 *   GET  /races/export?tournamentId=&dataType=&format=
 */
import apiClient from './apiClient'

// ─────────────────────────────────────────
// ĐIỀU HÀNH CUỘC ĐUA
// ─────────────────────────────────────────

/** Lấy danh sách cuộc đua (chung) */
export async function getRaces(params) {
  const res = await apiClient.get('/races', { params })
  return res.data
}

/** Lấy danh sách ngựa tham gia của một cuộc đua */
export async function getRaceParticipations(raceId) {
  const res = await apiClient.get(`/races/${raceId}/participations`)
  return res.data
}

/**
 * Hoãn cuộc đua.
 * @param {string|number} raceId
 * @param {{ reason, newDate }} payload
 */
export async function delayRace(raceId, payload) {
  const res = await apiClient.put(`/races/${raceId}/delay`, payload)
  return res.data
}

/**
 * Mở lại dự đoán cho cuộc đua (sau khi bị đóng).
 * @param {string|number} raceId
 */
export async function reopenPredictions(raceId) {
  const res = await apiClient.put(`/races/${raceId}/predictions/reopen`)
  return res.data
}

/**
 * Bắt đầu cuộc đua.
 * @param {string|number} raceId
 */
export async function startRace(raceId) {
  const res = await apiClient.put(`/races/${raceId}/start`)
  return res.data
}

/**
 * Mở bán vé cuộc đua cho khán giả từ Swagger API.
 * Endpoint: POST /v1/tickets/races/{raceId}/open-sales
 * @param {string|number} raceId
 * @param {{ totalTickets: number }} payload
 */
export async function openRaceTicketSales(raceId, payload) {
  const res = await apiClient.post(`/v1/tickets/races/${raceId}/open-sales`, payload)
  return res.data
}

/**
 * Đóng bán vé cuộc đua cho khán giả từ Swagger API.
 * Endpoint: POST /v1/tickets/races/{raceId}/close-sales
 * Header: Authorization: Bearer <token>
 * @param {string|number} raceId
 */
export async function closeRaceTicketSales(raceId) {
  const res = await apiClient.post(`/v1/tickets/races/${raceId}/close-sales`)
  return res.data
}

/**
 * Lấy danh sách các cuộc đua đang MỞ BÁN VÉ cho khán giả từ Swagger API.
 * Endpoint: GET /v1/tickets/races/open-sales
 */
export async function getOpenTicketRaces() {
  const res = await apiClient.get('/v1/tickets/races/open-sales')
  return res.data
}

/**
 * Lấy danh sách khán giả mua vé của một cuộc đua từ Swagger API.
 * Endpoint: GET /v1/tickets/races/{raceId}/buyers
 * Header: Authorization: Bearer <token>
 * @param {string|number} raceId
 * @returns {Promise<Array>}
 */
export async function getRaceTicketBuyers(raceId) {
  const res = await apiClient.get(`/v1/tickets/races/${raceId}/buyers`)
  return res.data
}

/**
 * Mua vé dự đoán cuộc đua cho khán giả từ Swagger API.
 * Endpoint: POST /v1/tickets/races/{raceId}/purchase
 * Header: Authorization: Bearer <token>
 * @param {string|number} raceId
 * @param {{ spectatorId: number, horseId: number }} payload
 */
export async function purchaseRaceTicket(raceId, payload) {
  const res = await apiClient.post(`/v1/tickets/races/${raceId}/purchase`, payload)
  return res.data
}

// ─────────────────────────────────────────
// KẾT QUẢ
// ─────────────────────────────────────────

/**
 * Ghi kết quả cuộc đua.
 * @param {string|number} raceId
 * @param {{ results: Array<{ horseId, rank, time, ... }> }} payload
 */
export async function submitRaceResults(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/results`, payload)
  return res.data
}

/**
 * Xuất bản (publish) kết quả cuộc đua.
 * @param {string|number} raceId
 */
export async function publishRaceResults(raceId) {
  const res = await apiClient.put(`/races/${raceId}/results/publish`)
  return res.data
}

// ─────────────────────────────────────────
// BÁO CÁO CUỘC ĐUA
// ─────────────────────────────────────────

/**
 * Gửi báo cáo trước cuộc đua.
 * @param {string|number} raceId
 * @param {object} payload
 */
export async function submitPreRaceReport(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/reports/pre-race`, payload)
  return res.data
}

/**
 * Gửi báo cáo sau cuộc đua.
 * @param {string|number} raceId
 * @param {object} payload
 */
export async function submitPostRaceReport(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/reports/post-race`, payload)
  return res.data
}

// ─────────────────────────────────────────
// VI PHẠM
/**
 * Lấy danh sách báo cáo sau cuộc đua.
 */
export async function getPostRaceReports() {
  const res = await apiClient.get(`/races/reports/post-race`)
  return res.data
}

/**
 * Lấy danh sách kết quả của một cuộc đua.
 * @param {string|number} raceId
 */
export async function getRaceResults(raceId) {
  const res = await apiClient.get(`/races/${raceId}/results`)
  return res.data
}

// ─────────────────────────────────────────

/**
 * Xử lý vi phạm trong cuộc đua.
 * @param {string|number} raceId
 * @param {{ participantId, type, description, penalty, ... }} payload
 */
export async function submitViolation(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/violations`, payload)
  return res.data
}

// ─────────────────────────────────────────
// XUẤT DỮ LIỆU CUỘC ĐUA
// ─────────────────────────────────────────

/**
 * Xuất dữ liệu cuộc đua theo giải đấu.
 * @param {{ tournamentId, dataType, format: 'pdf'|'excel'|'csv' }} params
 * @returns {Blob}
 */
export async function exportRaceData(params) {
  const res = await apiClient.get('/races/export', {
    params,
    responseType: 'blob',
  })
  return res.data
}
