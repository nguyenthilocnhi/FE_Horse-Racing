/**
 * predictionService.js
 * Dự đoán kết quả cuộc đua (Spectator).
 *
 * Endpoints (dự kiến backend mở rộng thêm):
 *   GET  /predictions?raceId=
 *   POST /predictions
 *   GET  /predictions/my
 */
import apiClient from './apiClient'

/** Lấy danh sách tất cả dự đoán (admin) hoặc theo race */
export async function getPredictions(params) {
  const res = await apiClient.get('/predictions', { params })
  return res.data
}

/**
 * Tạo dự đoán mới.
 * @param {{ raceId, horseId, amount, ticketType }} payload
 */
export async function createPrediction(payload) {
  const res = await apiClient.post('/predictions', payload)
  return res.data
}

/** Lấy danh sách dự đoán của người dùng đang đăng nhập */
export async function getMyPredictions() {
  const res = await apiClient.get('/predictions/my')
  return res.data
}
