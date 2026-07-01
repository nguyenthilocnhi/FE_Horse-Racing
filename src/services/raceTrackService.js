/**
 * raceTrackService.js
 * Quản lý trường đua.
 *
 * Endpoints:
 *   GET  /race-tracks
 *   POST /race-tracks
 *   PUT  /race-tracks/{trackId}
 */
import apiClient from './apiClient'

/** Lấy danh sách tất cả trường đua */
export async function getRaceTracks() {
  const res = await apiClient.get('/race-tracks')
  return res.data
}

/**
 * Tạo trường đua mới.
 * @param {{ name, location, surface, length, capacity, ... }} payload
 */
export async function createRaceTrack(payload) {
  const res = await apiClient.post('/race-tracks', payload)
  return res.data
}

/**
 * Cập nhật thông tin trường đua.
 * @param {string|number} trackId
 * @param {object} payload
 */
export async function updateRaceTrack(trackId, payload) {
  const res = await apiClient.put(`/race-tracks/${trackId}`, payload)
  return res.data
}
