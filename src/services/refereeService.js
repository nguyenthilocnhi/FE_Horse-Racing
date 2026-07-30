import apiClient from './apiClient'

/**
 * Lấy danh sách đăng ký / lượt thi đấu trong trận đua cho trọng tài
 * GET /races/{raceId}/participants (hoặc /referee/races/{raceId}/participants)
 */
export async function getRaceParticipations(raceId) {
  try {
    const res = await apiClient.get(`/races/${raceId}/participations`)
    return res.data
  } catch (err) {
    throw err
  }
}

/**
 * Kiểm tra tiền trận đấu (Pre-race inspection)
 * POST /races/{raceId}/pre-inspection
 */
export async function inspectRaceParticipants(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/inspection`, payload)
  return res.data
}

/**
 * Nộp báo cáo trước trận
 * POST /races/{raceId}/reports/pre-race
 */
export async function submitPreRaceReport(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/reports/pre-race`, payload)
  return res.data
}

/**
 * Nộp báo cáo sau trận
 * POST /races/{raceId}/post-report
 */
export async function submitPostRaceReport(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/reports/post-race`, payload)
  return res.data
}

/**
 * Ghi nhận kết quả đua
 * POST /races/{raceId}/results
 */
export async function recordRaceResult(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/results`, payload)
  return res.data
}

/**
 * Xử lý vi phạm quy định trận đua
 * POST /races/{raceId}/violations
 */
export async function handleRuleViolation(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/violations`, payload)
  return res.data
}
