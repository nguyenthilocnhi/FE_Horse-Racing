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
