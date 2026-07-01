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
 * Lấy tất cả tài khoản từ hệ thống
 */
export async function getAllAccounts() {
  const res = await apiClient.get('/admin/accounts')
  return Array.isArray(res.data) 
    ? res.data 
    : res.data?.content ?? res.data?.data ?? []
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
