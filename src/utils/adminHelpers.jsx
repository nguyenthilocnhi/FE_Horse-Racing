import React from 'react'

const STATUS_MAP = {
  active: 'green',
  locked: 'red',
  pending: 'gold',
  pending_payment: 'gold',
  approved: 'green',
  rejected: 'red',
  upcoming: 'blue',
  ongoing: 'gold',
  completed: 'gray',
  cancelled: 'red',
  scheduled: 'blue',
  pending_start: 'blue',
  delayed: 'red',
  running: 'green',
  investigating: 'gold',
  resolved: 'green',
  reviewing: 'gold',
  pending_results: 'gold',
  assigned: 'green',
  unassigned: 'purple',
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
  active: 'Đang hoạt động',
  locked: 'Bị khóa',
  pending: 'Chờ duyệt',
  pending_payment: 'Chờ thanh toán',
  approved: 'Đang hoạt động',
  rejected: 'Từ chối',
  upcoming: 'Chờ diễn ra',
  ongoing: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  scheduled: 'Chờ diễn ra',
  pending_start: 'Chờ diễn ra',
  delayed: 'Bị hoãn',
  running: 'Đang chạy',
  reviewing: 'Chờ duyệt kết quả',
  pending_results: 'Chờ duyệt kết quả',
  assigned: 'Đã phân công trọng tài',
  unassigned: 'Chờ phân công trọng tài',
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

/**
 * Tính toán tự động trạng thái cuộc đua theo đúng vòng đời chuẩn:
 * 1. Mới tạo: "Chờ phân công trọng tài" (unassigned)
 * 2. Phân công trọng tài xong: "Chờ diễn ra" (scheduled)
 * 3. Đến ngày diễn ra: "Đang diễn ra" (ongoing)
 * 4. Đến giờ bắt đầu đua: "Đang chạy" (running)
 * 5. Hết giờ đua: "Chờ duyệt kết quả" (reviewing)
 * 6. Duyệt/Công bố kết quả: "Hoàn thành" (completed - Không được sửa)
 */
export function computeRaceStatus(race) {
  if (!race) return 'unassigned'
  const rawStatus = (race.status || '').toLowerCase()

  // Các trạng thái đã chốt cố định
  if (rawStatus === 'completed' || rawStatus === 'cancelled' || rawStatus === 'delayed') {
    return rawStatus
  }

  if (rawStatus === 'reviewing' || rawStatus === 'pending_results') {
    return 'reviewing'
  }

  // Kiểm tra đã gán trọng tài chưa
  const hasReferee = !!race.refereeId || (race.referee && race.referee !== 'Chưa phân công')
  if (!hasReferee) {
    return 'unassigned'
  }

  // Đã gán trọng tài, kiểm tra theo Ngày & Giờ
  if (race.date) {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const raceDateStr = race.date

    // Ngày đua ở tương lai -> Chờ diễn ra
    if (raceDateStr > todayStr) {
      return 'scheduled'
    }

    // Đúng ngày đua
    if (raceDateStr === todayStr) {
      if (race.time) {
        const raceStartDateTime = new Date(`${raceDateStr}T${race.time}:00`)
        let raceEndDateTime = race.endTime ? new Date(`${raceDateStr}T${race.endTime}:00`) : null

        if (!raceEndDateTime || isNaN(raceEndDateTime.getTime())) {
          raceEndDateTime = new Date(raceStartDateTime.getTime() + 30 * 60 * 1000)
        }

        if (now < raceStartDateTime) {
          // Cùng ngày nhưng chưa đến giờ xuất phát -> Đang diễn ra
          return 'ongoing'
        } else if (now >= raceStartDateTime && now <= raceEndDateTime) {
          // Đúng giờ xuất phát -> Đang chạy
          return 'running'
        } else if (now > raceEndDateTime) {
          // Đã hết giờ đua -> Chờ duyệt kết quả
          return 'reviewing'
        }
      }
      return 'ongoing'
    }

    // Ngày đua trong quá khứ -> Chờ duyệt kết quả
    if (raceDateStr < todayStr) {
      return 'reviewing'
    }
  }

  return 'scheduled'
}
