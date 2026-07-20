export const dashboardStats = {
  tournaments: 48,
  races: 312,
  horses: 1240,
  jockeys: 328,
  ticketsSold: 18450,
  revenue: 2840000000,
  revenueLabel: '2.84 tỷ VND',
}

export const revenueChart = [
  { month: 'T1', value: 180 },
  { month: 'T2', value: 220 },
  { month: 'T3', value: 195 },
  { month: 'T4', value: 260 },
  { month: 'T5', value: 310 },
  { month: 'T6', value: 285 },
]

export const recentActivities = [
  { id: 1, action: 'Duyệt kết quả race #R-1042', user: 'Admin Nguyen', time: '5 phút trước', type: 'success' },
  { id: 2, action: 'Tạo giải đấu Cúp Hoàng Gia 2026', user: 'Admin Tran', time: '22 phút trước', type: 'info' },
  { id: 3, action: 'Từ chối đăng ký ngựa Thunder Bolt', user: 'Admin Le', time: '1 giờ trước', type: 'warning' },
  { id: 4, action: 'Phân công trọng tài cho Race Derby', user: 'Admin Pham', time: '2 giờ trước', type: 'info' },
  { id: 5, action: 'Xuất báo cáo doanh thu tháng 5', user: 'Admin Nguyen', time: '3 giờ trước', type: 'neutral' },
]

export const users = [
  { id: 1, name: 'Nguyen Van A', email: 'nguyenvana@email.com', phone: '0912345678', dob: '1990-01-15', role: 'ADMIN', status: 'active', joined: '2024-01-15' },
  { id: 2, name: 'Tran Thi B', email: 'tranthib@email.com', phone: '0987654321', dob: '1992-03-20', role: 'HORSE_OWNER', status: 'active', joined: '2024-03-20' },
  { id: 3, name: 'Le Van C', email: 'levanc@email.com', phone: '0901234567', dob: '1995-05-10', role: 'JOCKEY', status: 'locked', joined: '2024-05-10' },
  { id: 4, name: 'Pham Thi D', email: 'phamthid@email.com', phone: '0934567890', dob: '1993-06-01', role: 'REFEREE', status: 'active', joined: '2024-06-01' },
  { id: 5, name: 'Hoang Van E', email: 'hoangvane@email.com', phone: '0976543210', dob: '2000-02-14', role: 'SPECTATOR', status: 'active', joined: '2025-02-14' },
]

export const tournaments = [
  { id: 'T-001', name: 'Cúp Vàng Hoàng Gia 2026', venue: 'Ascot Grand Arena', startDate: '2026-09-12', endDate: '2026-09-14', status: 'upcoming', races: 24, prize: '12 triệu đồng' },
  { id: 'T-002', name: 'Derby Quốc Gia', venue: 'Saigon Racecourse', startDate: '2026-06-03', endDate: '2026-06-05', status: 'ongoing', races: 18, prize: '80 triệu đồng' },
  { id: 'T-003', name: 'Championship Sprint', venue: 'Hanoi Turf Club', startDate: '2026-04-20', endDate: '2026-04-22', status: 'completed', races: 12, prize: '50 triệu đồng' },
  { id: 'T-004', name: 'Winter Classic', venue: 'Da Nang Arena', startDate: '2026-11-08', endDate: '2026-11-10', status: 'cancelled', races: 0, prize: '30 triệu đồng' },
]

export const races = [
  { id: 'R-1042', name: 'Derby Một Dặm', tournament: 'Derby Quốc Gia', date: '2026-06-03', time: '15:10', distance: '1600m', horses: 12, status: 'scheduled' },
  { id: 'R-1043', name: 'Đua nước rút', tournament: 'Derby Quốc Gia', date: '2026-06-03', time: '14:30', distance: '1200m', horses: 10, status: 'ongoing' },
  { id: 'R-1044', name: 'Cúp Nhà Vô Địch', tournament: 'Cúp Vàng Hoàng Gia', date: '2026-09-12', time: '16:00', distance: '2000m', horses: 8, status: 'scheduled' },
  { id: 'R-1040', name: 'Sprint Classic', tournament: 'Championship Sprint', date: '2026-04-21', time: '14:00', distance: '1400m', horses: 14, status: 'completed' },
]

export const registrations = [
  { id: 'REG-501', horse: 'Aurelius', owner: 'Stable Alpha', race: 'Derby Một Dặm', submitted: '2026-05-28', status: 'pending' },
  { id: 'REG-502', horse: 'Midnight Star', owner: 'Blue Ridge Farm', race: 'Đua nước rút', submitted: '2026-05-27', status: 'approved' },
  { id: 'REG-503', horse: 'Velvet Thunder', owner: 'Golden Hooves', race: 'Cúp Nhà Vô Địch', submitted: '2026-05-26', status: 'rejected' },
  { id: 'REG-504', horse: 'Storm Rider', owner: 'Wind Valley', race: 'Derby Một Dặm', submitted: '2026-05-29', status: 'pending' },
]

export const referees = [
  { id: 'REF-01', name: 'Dr. James Wilson', license: 'FIA-HR-2024', experience: '15 năm', assignedRaces: ['R-1042'], conflict: false },
  { id: 'REF-02', name: 'Sarah Chen', license: 'FIA-HR-2023', experience: '10 năm', assignedRaces: ['R-1043'], conflict: true },
  { id: 'REF-03', name: 'Michael Brown', license: 'FIA-HR-2022', experience: '8 năm', assignedRaces: [], conflict: false },
]

export const raceAssignments = [
  { raceId: 'R-1042', raceName: 'Derby Một Dặm', date: '2026-06-03', time: '15:10', referee: 'Dr. James Wilson', status: 'assigned', conflict: false },
  { raceId: 'R-1043', raceName: 'Đua nước rút', date: '2026-06-03', time: '14:30', referee: 'Sarah Chen', status: 'conflict', conflict: true },
  { raceId: 'R-1044', raceName: 'Cúp Nhà Vô Địch', date: '2026-09-12', time: '16:00', referee: null, status: 'unassigned', conflict: false },
]

export const resultReports = [
  { id: 'RES-801', race: 'Sprint Classic', referee: 'Dr. James Wilson', submitted: '2026-04-21', winner: 'Aurelius', status: 'pending' },
  { id: 'RES-802', race: 'Derby Một Dặm', referee: 'Sarah Chen', submitted: '2026-06-03', winner: 'Midnight Star', status: 'approved' },
  { id: 'RES-803', race: 'Đua nước rút', referee: 'Michael Brown', submitted: '2026-06-03', winner: 'Velvet Thunder', status: 'published' },
]

export const horseRankings = [
  { rank: 1, name: 'Aurelius', points: 2450, wins: 12, races: 18, owner: 'Stable Alpha' },
  { rank: 2, name: 'Midnight Star', points: 2280, wins: 9, races: 16, owner: 'Blue Ridge Farm' },
  { rank: 3, name: 'Velvet Thunder', points: 2150, wins: 15, races: 22, owner: 'Golden Hooves' },
]

export const jockeyRankings = [
  { rank: 1, name: 'L. Anderson', points: 3200, wins: 320, races: 450 },
  { rank: 2, name: 'M. Rodriguez', points: 2890, wins: 289, races: 410 },
  { rank: 3, name: 'S. Nakamura', points: 2700, wins: 270, races: 395 },
]

export const violations = [
  { id: 'VIO-101', type: 'Doping', entity: 'Horse: Storm Rider', race: 'Derby Một Dặm', date: '2026-05-20', status: 'investigating', severity: 'high' },
  { id: 'VIO-102', type: 'Late Start', entity: 'Jockey: Hoang Van E', race: 'Sprint Classic', date: '2026-04-21', status: 'resolved', severity: 'low' },
  { id: 'VIO-103', type: 'Equipment', entity: 'Stable: Wind Valley', race: 'Đua nước rút', date: '2026-06-01', status: 'pending', severity: 'medium' },
]

export const complaints = [
  { id: 'CMP-201', subject: 'Kết quả race không chính xác', from: 'Stable Alpha', race: 'Sprint Classic', date: '2026-04-22', status: 'pending' },
  { id: 'CMP-202', subject: 'Trọng tài thiên vị', from: 'Blue Ridge Farm', race: 'Derby Một Dặm', date: '2026-06-04', status: 'reviewing' },
  { id: 'CMP-203', subject: 'Hoàn tiền vé VIP', from: 'Nguyen Van A', race: 'Winter Classic', date: '2026-03-15', status: 'resolved' },
]

export const tickets = [
  { id: 'TKT-9001', buyer: 'Nguyen Van A', email: 'nguyenvana@email.com', race: 'Derby Một Dặm', type: 'VIP', quantity: 2, amount: 300000, paymentStatus: 'paid' },
  { id: 'TKT-9002', buyer: 'Tran Thi B', email: 'tranthib@email.com', race: 'Đua nước rút', type: 'Standard', quantity: 4, amount: 100000, paymentStatus: 'paid' },
  { id: 'TKT-9003', buyer: 'Le Van C', email: 'levanc@email.com', race: 'Cúp Nhà Vô Địch', type: 'Standard', quantity: 1, amount: 100000, paymentStatus: 'pending' },
]

export const payments = [
  { id: 'PAY-7001', transactionId: 'TXN-20260603-001', buyer: 'Nguyen Van A', amount: 300000, method: 'VNPay', status: 'completed', date: '2026-06-01 10:30' },
  { id: 'PAY-7002', transactionId: 'TXN-20260602-045', buyer: 'Tran Thi B', amount: 100000, method: 'MoMo', status: 'completed', date: '2026-06-02 14:15' },
  { id: 'PAY-7003', transactionId: 'TXN-20260603-012', buyer: 'Le Van C', amount: 100000, method: 'Bank Transfer', status: 'pending', date: '2026-06-03 09:00' },
]

export const notifications = [
  { id: 'NOT-601', title: 'Giải Derby Quốc Gia sắp bắt đầu', audience: 'All Users', sent: '2026-06-01', status: 'sent' },
  { id: 'NOT-602', title: 'Cập nhật lịch race tuần 23', audience: 'Organizers', sent: null, status: 'draft' },
  { id: 'NOT-603', title: 'Kết quả Sprint Classic đã công bố', audience: 'All Users', sent: '2026-04-22', status: 'sent' },
]

export const monthlyReports = [
  { month: 'T1/2026', revenue: 42000000, races: 28, participants: 340 },
  { month: 'T2/2026', revenue: 51000000, races: 32, participants: 385 },
  { month: 'T3/2026', revenue: 48000000, races: 30, participants: 360 },
  { month: 'T4/2026', revenue: 62000000, races: 38, participants: 420 },
  { month: 'T5/2026', revenue: 71000000, races: 42, participants: 480 },
  { month: 'T6/2026', revenue: 68000000, races: 40, participants: 465 },
]


export const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: '◈' },
  { path: '/admin/users', label: 'Quản lý User', icon: '◎' },
  { path: '/admin/race-tracks', label: 'Trường đua', icon: '⛖' },
  { path: '/admin/tournaments', label: 'Giải đấu', icon: '◆' },
  { path: '/admin/races', label: 'Cuộc đua', icon: '▶' },
  { path: '/admin/horses', label: 'Quản lý Ngựa', icon: '♞' },
  { path: '/admin/jockeys', label: 'Quản lý Jockey', icon: '♏' },
  { path: '/admin/registrations', label: 'Duyệt đăng ký', icon: '◉' },
  { path: '/admin/referees', label: 'Phân công TT', icon: '◐' },
  { path: '/admin/results', label: 'Duyệt kết quả', icon: '✓' },
  { path: '/admin/predictions', label: 'Quản lý Dự đoán', icon: '⚖' },
  { path: '/admin/rankings', label: 'Xếp hạng', icon: '▲' },
  { path: '/admin/violations', label: 'Vi phạm', icon: '⚠' },
  { path: '/admin/complaints', label: 'Khiếu nại', icon: '✉' },
  { path: '/admin/tickets', label: 'Vé', icon: '◫' },
  { path: '/admin/payments', label: 'Thanh toán', icon: '$' },
  { path: '/admin/notifications', label: 'Thông báo', icon: '◔' },
  { path: '/admin/reports', label: 'Báo cáo', icon: '▤' },
]

export const breadcrumbLabels = {
  '/admin': 'Dashboard',
  '/admin/users': 'Quản lý User',
  '/admin/race-tracks': 'Quản lý Trường đua',
  '/admin/tournaments': 'Quản lý Giải đấu',
  '/admin/races': 'Quản lý Cuộc đua',
  '/admin/horses': 'Quản lý Ngựa',
  '/admin/jockeys': 'Quản lý Jockey',
  '/admin/registrations': 'Duyệt Đăng ký',
  '/admin/referees': 'Phân công Trọng tài',
  '/admin/results': 'Duyệt Kết quả',
  '/admin/predictions': 'Quản lý Dự đoán',
  '/admin/rankings': 'Quản lý Xếp hạng',
  '/admin/violations': 'Quản lý Vi phạm',
  '/admin/complaints': 'Quản lý Khiếu nại',
  '/admin/tickets': 'Quản lý Vé',
  '/admin/payments': 'Quản lý Thanh toán',
  '/admin/notifications': 'Quản lý Thông báo',
  '/admin/reports': 'Báo cáo & Phân tích',
}

export const mockJockeys = [
  { id: 1, name: 'L. Anderson', license: 'JOC-2024-001', experience: 12, points: 3200, wins: 320, races: 450, status: 'active' },
  { id: 2, name: 'M. Rodriguez', license: 'JOC-2023-089', experience: 8, points: 2890, wins: 289, races: 410, status: 'active' },
  { id: 3, name: 'S. Nakamura', license: 'JOC-2022-114', experience: 10, points: 2700, wins: 270, races: 395, status: 'active' },
  { id: 4, name: 'K. McEvoy', license: 'JOC-2025-023', experience: 5, points: 1850, wins: 120, races: 250, status: 'injured' },
  { id: 5, name: 'Hoang Van E', license: 'JOC-2026-004', experience: 2, points: 670, wins: 15, races: 48, status: 'suspended' },
]

export const mockPredictions = [
  { id: 'PRED-001', raceId: 'R-1042', raceName: 'Derby Một Dặm', totalPool: 245000000, participants: 128, status: 'open', endDate: '2026-06-03 15:00' },
  { id: 'PRED-002', raceId: 'R-1043', raceName: 'Đua nước rút', totalPool: 182000000, participants: 95, status: 'closed', endDate: '2026-06-03 14:15' },
  { id: 'PRED-003', raceId: 'R-1044', raceName: 'Cúp Nhà Vô Địch', totalPool: 580000000, participants: 340, status: 'open', endDate: '2026-09-12 15:50' },
  { id: 'PRED-004', raceId: 'R-1040', raceName: 'Sprint Classic', totalPool: 120000000, participants: 75, status: 'distributed', endDate: '2026-04-21 13:50', winner: 'Aurelius' }
]

export const mockUserPredictions = [
  { id: 'UPRED-701', user: 'Nguyen Van A', race: 'Derby Một Dặm', horse: 'Aurelius', amount: 5000000, odds: 2.5, status: 'pending' },
  { id: 'UPRED-702', user: 'Hoang Van E', race: 'Derby Một Dặm', horse: 'Midnight Star', amount: 2000000, odds: 3.1, status: 'pending' },
  { id: 'UPRED-703', user: 'Tran Thi B', race: 'Sprint Classic', horse: 'Aurelius', amount: 10000000, odds: 1.8, status: 'won', payout: 18000000 },
  { id: 'UPRED-704', user: 'Le Van C', race: 'Sprint Classic', horse: 'Midnight Star', amount: 3000000, odds: 4.2, status: 'lost', payout: 0 }
]

