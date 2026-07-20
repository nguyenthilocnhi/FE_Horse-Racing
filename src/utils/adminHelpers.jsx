import React from 'react'

const STATUS_MAP = {
  active: 'green',
  locked: 'red',
  pending: 'gold',
  pending_payment: 'gold',
  approved: 'green',
  rejected: 'red',
  upcoming: 'blue',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
  scheduled: 'blue',
  delayed: 'gold',
  running: 'green',
  investigating: 'gold',
  resolved: 'green',
  reviewing: 'gold',
  paid: 'green',
  sent: 'green',
  draft: 'gray',
  completed_pay: 'green',
  published: 'purple',
  conflict: 'red',
  assigned: 'green',
  unassigned: 'gray',
  high: 'red',
  medium: 'gold',
  low: 'gray',
  vip: 'purple',
  standard: 'gray',
  premium: 'gold',
  retired: 'gray',
  injured: 'red',
}

const STATUS_LABELS = {
  active: 'Hoạt động',
  locked: 'Đã khóa',
  pending: 'Chờ duyệt',
  pending_payment: 'Chờ thanh toán',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  upcoming: 'Sắp diễn ra',
  ongoing: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  scheduled: 'Đã lên lịch',
  delayed: 'Bị hoãn',
  running: 'Đang chạy',
  investigating: 'Đang điều tra',
  resolved: 'Đã xử lý',
  reviewing: 'Đang xem xét',
  paid: 'Đã thanh toán',
  sent: 'Đã gửi',
  draft: 'Nháp',
  published: 'Đã công bố',
  conflict: 'Xung đột',
  assigned: 'Đã phân công',
  unassigned: 'Chưa phân công',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
  retired: 'Giải nghệ',
  injured: 'Chấn thương',
}

export function StatusBadge({ status }) {
  const normalizedStatus = status ? status.toString().toLowerCase() : ''
  const variant = STATUS_MAP[normalizedStatus] || 'gray'
  const label = STATUS_LABELS[normalizedStatus] || status
  return <span className={`admin-badge admin-badge--${variant}`}>{label}</span>
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}
