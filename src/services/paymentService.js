/**
 * paymentService.js
 * Service nạp tiền / mua vé kết nối trực tiếp tới Backend PayOS Controller.
 * Endpoints Backend:
 *   POST /api/v1/payment/create
 *   GET  /api/v1/payment/status/{orderCode}
 *   DELETE /api/v1/payment/{orderCode}
 */
import apiClient from './apiClient'

/**
 * Khởi tạo giao dịch PayOS thông qua Backend.
 * @param {number|string} amount
 * @param {number|string} [spectatorId]
 * @param {number|string} [tournamentId]
 * @returns {Promise<{ checkoutUrl: string, orderCode: number|string, ticket?: object }>}
 */
export async function createPayment(amount, spectatorId, tournamentId = 1) {
  const numericAmount = Number(amount)
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Số tiền nạp phải lớn hơn 0!')
  }

  const payload = {
    spectatorId: spectatorId && !isNaN(Number(spectatorId)) ? Number(spectatorId) : 1,
    tournamentId: tournamentId && !isNaN(Number(tournamentId)) ? Number(tournamentId) : 1,
    gateway: 'PAYOS',
    price: numericAmount
  }

  try {
    const res = await apiClient.post('/v1/payment/create', payload)
    return res.data?.data || res.data
  } catch (err) {
    const serverMessage = err?.response?.data?.message || (typeof err?.response?.data === 'string' ? err.response.data : null) || err?.message || 'Lỗi khởi tạo giao dịch PayOS (400 Bad Request)'
    console.error('Lỗi API /v1/payment/create:', serverMessage)
    throw new Error(serverMessage)
  }
}

/**
 * Lấy trạng thái giao dịch thực tế từ Backend theo orderCode.
 * @param {string|number} orderCode
 * @returns {Promise<{ status: 'SUCCESS'|'PENDING'|'FAILED', amount: number, transactionCode: string, message: string }>}
 */
export async function getPaymentStatus(orderCode) {
  if (!orderCode) {
    throw new Error('Mã giao dịch orderCode không hợp lệ')
  }

  try {
    const res = await apiClient.get(`/v1/payment/status/${orderCode}`)
    return res.data?.data || res.data
  } catch (err) {
    const serverMessage = err?.response?.data?.message || (typeof err?.response?.data === 'string' ? err.response.data : null) || err?.message || 'Lỗi lấy trạng thái giao dịch'
    throw new Error(serverMessage)
  }
}

/**
 * Hủy liên kết thanh toán PayOS trên Backend theo orderCode.
 * @param {string|number} orderCode
 */
export async function cancelPayment(orderCode) {
  if (!orderCode) return
  try {
    const res = await apiClient.delete(`/v1/payment/${orderCode}`)
    return res.data
  } catch (err) {
    const serverMessage = err?.response?.data?.message || (typeof err?.response?.data === 'string' ? err.response.data : null) || err?.message || 'Lỗi hủy giao dịch'
    throw new Error(serverMessage)
  }
}
