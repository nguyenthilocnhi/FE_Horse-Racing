/**
 * adminAccountService.js
 * Quản lý tài khoản Admin — kết nối trực tiếp với backend Spring Boot.
 *
 * Endpoints backend:
 *   GET    /api/admin/accounts
 *   POST   /api/admin/accounts
 *   PUT    /api/admin/accounts/{role}/{id}
 *   PUT    /api/admin/accounts/{role}/{id}/assign-role
 *   DELETE /api/admin/accounts/{role}/{id}
 */
import apiClient from './apiClient'

/**
 * Lấy danh sách tài khoản theo vai trò cụ thể
 * @param {'HORSE_OWNER' | 'JOCKEY' | 'RACE_REFEREE' | 'SPECTATOR'} role
 */
export async function getAccountsByRole(role) {
  try {
    const res = await apiClient.get(`/admin/accounts/${role}`)
    const list = Array.isArray(res.data) ? res.data : (res.data?.result ?? res.data?.content ?? res.data?.data ?? [])
    return list.map(u => ({ ...u, role: u.role || role }))
  } catch (err) {
    console.warn(`Could not fetch accounts for role ${role}:`, err?.message || err)
    return []
  }
}

/**
 * Lấy tất cả tài khoản từ hệ thống bao gồm tất cả 4 roles (HORSE_OWNER, JOCKEY, RACE_REFEREE, SPECTATOR)
 */
export async function getAllAccounts() {
  try {
    const res = await apiClient.get('/admin/accounts')
    const list = Array.isArray(res.data) ? res.data : (res.data?.result ?? res.data?.content ?? res.data?.data ?? [])
    return list
  } catch (err) {
    console.warn("GET /admin/accounts failed, fetching accounts for all 4 roles individually:", err?.message || err)
    // Tải danh sách 4 vai trò làm fallback nếu cần
    const roles = ['HORSE_OWNER', 'JOCKEY', 'RACE_REFEREE', 'SPECTATOR']
    const results = await Promise.allSettled(roles.map(role => getAccountsByRole(role)))
    const allAccounts = []
    results.forEach(item => {
      if (item.status === 'fulfilled' && Array.isArray(item.value)) {
        allAccounts.push(...item.value)
      }
    })
    return allAccounts
  }
}

/**
 * Cập nhật thông tin tài khoản (bao gồm status)
 * PUT /api/admin/accounts/{role}/{id}
 */
export async function updateAccount(role, id, payload) {
  const res = await apiClient.put(`/admin/accounts/${role}/${id}`, payload)
  return res.data
}

/**
 * Xóa tài khoản
 * DELETE /api/admin/accounts/{role}/{id}
 */
export async function deleteAccount(role, id) {
  const res = await apiClient.delete(`/admin/accounts/${role}/${id}`)
  return res.data
}

/**
 * Gán vai trò mới cho tài khoản
 * PUT /api/admin/accounts/{role}/{id}/assign-role
 */
export async function assignRole(currentRole, id, payload) {
  const res = await apiClient.put(`/admin/accounts/${currentRole}/${id}/assign-role`, payload)
  return res.data
}

/**
 * Tạo tài khoản mới
 * POST /api/admin/accounts
 */
export async function createAccount(payload) {
  const res = await apiClient.post('/admin/accounts', payload)
  return res.data
}
