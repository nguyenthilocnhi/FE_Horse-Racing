/**
 * predictionService.js
 * Service quản lý Dự đoán kết quả cuộc đua (Prediction) kết nối Backend API.
 * Endpoints Backend Spring Boot (PredictionController):
 *   POST /api/predictions
 *   GET  /api/predictions/spectators/{spectatorId}
 *   POST /api/predictions/{predictionId}/cancel
 */
import apiClient from './apiClient'

/**
 * Tạo dự đoán mới.
 * @param {{ spectatorId: number, raceId: number, horseId: number, stakeAmount: number }} payload
 */
export async function createPrediction(payload) {
  const res = await apiClient.post('/predictions', payload)
  return res.data?.data || res.data
}

/**
 * Lấy lịch sử dự đoán của khán giả theo spectatorId.
 * @param {number|string} spectatorId
 */
export async function getPredictionHistory(spectatorId) {
  const res = await apiClient.get(`/predictions/spectators/${spectatorId}`)
  return res.data?.data || res.data
}

/**
 * Hủy dự đoán và hoàn cọc ví.
 * @param {number|string} predictionId
 * @param {number|string} spectatorId
 */
export async function cancelPrediction(predictionId, spectatorId) {
  const res = await apiClient.post(`/predictions/${predictionId}/cancel`, { spectatorId: Number(spectatorId) })
  return res.data?.data || res.data
}
