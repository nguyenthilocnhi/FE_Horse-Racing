/**
 * systemService.js
 * Các use-case hệ thống tự động (cron-like hoặc admin trigger).
 *
 * Endpoints:
 *   POST /system/predictions/close-due
 *   POST /system/notifications
 *   POST /system/rankings/update
 */
import apiClient from './apiClient'

/**
 * Đóng tất cả dự đoán đã đến hạn (quá giờ mở).
 */
export async function closeDuePredictions() {
  const res = await apiClient.post('/system/predictions/close-due')
  return res.data
}

/**
 * Gửi thông báo hệ thống.
 * @param {{ type, targetRole, message, ... }} payload
 */
export async function sendSystemNotification(payload) {
  const res = await apiClient.post('/system/notifications', payload)
  return res.data
}

/**
 * Cập nhật bảng xếp hạng hệ thống (tất cả giải đấu).
 */
export async function updateSystemRankings() {
  const res = await apiClient.post('/system/rankings/update')
  return res.data
}
