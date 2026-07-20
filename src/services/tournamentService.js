/**
 * tournamentService.js
 * Quản lý giải đấu, lịch đua, bảng xếp hạng, báo cáo và xuất dữ liệu.
 *
 * Endpoints:
 *   POST /tournaments
 *   PUT  /tournaments/{id}
 *   PUT  /tournaments/{id}/cancel
 *   PUT  /tournaments/{id}/registration
 *   POST /tournaments/{tournamentId}/race-schedules
 *   PUT  /tournaments/{tournamentId}/race-schedules/{scheduleId}/schedule
 *   GET  /tournaments/{tournamentId}/schedule
 *   GET  /tournaments/{tournamentId}/report
 *   POST /tournaments/{tournamentId}/export
 *   GET  /tournaments/{tournamentId}/export
 *   GET  /tournaments/{tournamentId}/rankings
 *   POST /tournaments/{tournamentId}/rankings/recalculate
 *   PUT  /tournaments/{tournamentId}/rankings/update
 */
import apiClient from './apiClient'

// ─────────────────────────────────────────
// GIẢI ĐẤU
// ─────────────────────────────────────────

/**
 * Lấy danh sách toàn bộ giải đấu
 */
export async function getAllTournaments() {
  const res = await apiClient.get('/tournaments')
  return res.data
}

/**
 * Tạo giải đấu mới.
 * @param {{ name, startDate, endDate, location, description, ... }} payload
 */
export async function createTournament(payload) {
  const res = await apiClient.post('/tournaments', payload)
  return res.data
}

/**
 * Cập nhật thông tin giải đấu.
 * @param {string|number} id
 * @param {object} payload
 */
export async function updateTournament(id, payload) {
  const res = await apiClient.put(`/tournaments/${id}`, payload)
  return res.data
}

/**
 * Hủy giải đấu.
 * @param {string|number} id
 * @param {object} payload
 */
export async function cancelTournament(id, payload = { reason: 'Hủy giải đấu', forceCancel: true }) {
  const res = await apiClient.put(`/tournaments/${id}/cancel`, payload)
  return res.data
}

/**
 * Mở / đóng đăng ký tham gia giải đấu.
 * @param {string|number} id
 * @param {{ open: boolean }} payload
 */
export async function updateTournamentRegistration(id, payload) {
  const res = await apiClient.put(`/tournaments/${id}/registration`, payload)
  return res.data
}

// ─────────────────────────────────────────
// LỊCH ĐUA
// ─────────────────────────────────────────

/**
 * Tạo lịch đua trong giải đấu.
 * @param {string|number} tournamentId
 * @param {{ raceDate, raceTrackId, raceName, ... }} payload
 */
export async function createRaceSchedule(tournamentId, payload) {
  const res = await apiClient.post(
    `/tournaments/${tournamentId}/race-schedules`,
    payload
  )
  return res.data
}

/**
 * Cập nhật lịch đua cụ thể.
 * @param {string|number} tournamentId
 * @param {string|number} scheduleId
 * @param {object} payload
 */
export async function updateRaceSchedule(tournamentId, scheduleId, payload) {
  const res = await apiClient.put(
    `/tournaments/${tournamentId}/race-schedules/${scheduleId}/schedule`,
    payload
  )
  return res.data
}

/**
 * Xem lịch thi đấu của giải đấu.
 * @param {string|number} tournamentId
 */
export async function getTournamentSchedule(tournamentId) {
  const res = await apiClient.get(`/tournaments/${tournamentId}/schedule`)
  return res.data
}

// ─────────────────────────────────────────
// BÁO CÁO & XUẤT DỮ LIỆU
// ─────────────────────────────────────────

/**
 * Lấy báo cáo tổng kết giải đấu.
 * @param {string|number} tournamentId
 */
export async function getTournamentReport(tournamentId) {
  const res = await apiClient.get(`/tournaments/${tournamentId}/report`)
  return res.data
}

/**
 * Tạo yêu cầu xuất dữ liệu giải đấu (async job).
 * @param {string|number} tournamentId
 * @param {{ format: 'pdf'|'excel', ... }} payload
 */
export async function exportTournament(tournamentId, payload) {
  const res = await apiClient.post(`/tournaments/${tournamentId}/export`, payload)
  return res.data
}

/**
 * Lấy file xuất dữ liệu giải đấu đã tạo.
 * @param {string|number} tournamentId
 */
export async function downloadTournamentExport(tournamentId) {
  const res = await apiClient.get(`/tournaments/${tournamentId}/export`, {
    responseType: 'blob',
  })
  return res.data // Blob
}

// ─────────────────────────────────────────
// BẢNG XẾP HẠNG
// ─────────────────────────────────────────

/**
 * Lấy bảng xếp hạng giải đấu.
 * @param {string|number} tournamentId
 */
export async function getTournamentRankings(tournamentId) {
  const res = await apiClient.get(`/tournaments/${tournamentId}/rankings`)
  return res.data
}

/**
 * Tính lại bảng xếp hạng.
 * @param {string|number} tournamentId
 */
export async function recalculateRankings(tournamentId) {
  const res = await apiClient.post(
    `/tournaments/${tournamentId}/rankings/recalculate`
  )
  return res.data
}

/**
 * Cập nhật thủ công bảng xếp hạng.
 * @param {string|number} tournamentId
 * @param {object} payload
 */
export async function updateRankings(tournamentId, payload) {
  const res = await apiClient.put(
    `/tournaments/${tournamentId}/rankings/update`,
    payload
  )
  return res.data
}
