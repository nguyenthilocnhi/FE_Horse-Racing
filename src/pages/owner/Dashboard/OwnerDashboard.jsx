import React from 'react'
import { Link } from 'react-router-dom'
import {
  ownerStats,
  ownerProfile,
  ownerRaces,
  ownerHorses,
  ownerJockeys,
  financialLog
} from '../../../data/ownerMockData'

function StatCard({ stat }) {
  return (
    <div className="owner-stat-card">
      <span>{stat.label}</span>
      <strong>
        {stat.value}
        {stat.unit && <small style={{ fontSize: '0.9rem', marginLeft: 2, color: '#aaa' }}>{stat.unit}</small>}
      </strong>
    </div>
  )
}

export default function OwnerDashboard() {
  const upcomingRace = ownerRaces.find((r) => r.status === 'pending_confirmation' || r.status === 'registered' || r.status === 'upcoming')
  const completedRacesCount = ownerRaces.filter((r) => r.status === 'completed').length

  const chartMonths = ['T2', 'T3', 'T4', 'T5', 'T6']
  const chartEarnings = [120, 220, 180, 450, 820] // mock progression in Million VND
  const maxChart = Math.max(...chartEarnings)

  return (
    <div className="own-dashboard">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Xin chào, {ownerProfile.name} 👋</h1>
          <p className="owner-page-sub">
            Chủ trang trại <strong style={{ color: '#d4af37' }}>{ownerProfile.stableName}</strong> · Giấy phép {ownerProfile.licenseNo}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/owner/horses" className="owner-btn owner-btn--outline">
            🐴 Thêm Ngựa mới
          </Link>
          <Link to="/owner/jockeys" className="owner-btn owner-btn--gold">
            🏇 Thuê Jockey
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="owner-stat-grid">
        {ownerStats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* Upcoming Race Banner */}
      {upcomingRace && (
        <div className="own-upcoming-banner">
          <div>
            <div className="own-upcoming-label">🏁 CUỘC ĐUA TIẾP THEO</div>
            <div className="own-upcoming-name">{upcomingRace.name}</div>
            <div className="own-upcoming-meta">
              <span>📍 {upcomingRace.venue}</span>
              <span>📅 {upcomingRace.date} · {upcomingRace.time}</span>
              <span>🐴 Ngựa đăng ký: <strong style={{ color: '#d4af37' }}>{upcomingRace.registeredHorse || 'Chưa đăng ký'}</strong></span>
              <span>🏇 Jockey assigned: <strong>{upcomingRace.assignedJockey || 'Chưa chỉ định'}</strong></span>
              <span>💰 Giải thưởng: <span style={{ color: '#4ade80' }}>{upcomingRace.prizePool}</span></span>
            </div>
          </div>
          <div className="own-upcoming-countdown">
            <span className="own-countdown-num">3</span>
            <span className="own-countdown-label">ngày nữa</span>
          </div>
          <div>
            <Link to="/owner/races" className="owner-btn owner-btn--gold owner-btn--sm">
              Chi tiết →
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="own-dashboard-grid">
        {/* Earnings chart */}
        <div className="owner-card">
          <div className="owner-card-head">
            <h3>Tổng thu nhập tích lũy (Triệu VND)</h3>
            <Link to="/owner/finances" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none' }}>
              Chi tiết tài chính →
            </Link>
          </div>
          <div className="owner-card-body">
            <div className="own-chart">
              {chartMonths.map((m, i) => (
                <div key={m} className="own-chart-col">
                  <div className="own-chart-value">{chartEarnings[i]}M</div>
                  <div
                    className="own-chart-bar"
                    style={{ height: `${(chartEarnings[i] / maxChart) * 100}%` }}
                  />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="owner-card">
          <div className="owner-card-head">
            <h3>Giao dịch gần đây</h3>
            <Link to="/owner/finances" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none' }}>
              Tất cả giao dịch →
            </Link>
          </div>
          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Mô tả</th>
                  <th>Phân loại</th>
                  <th>Số tiền</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {financialLog.slice(0, 3).map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ color: '#fff' }}>{txn.description}</td>
                    <td>
                      <span className={`owner-badge owner-badge--${txn.type === 'income' ? 'green' : 'red'}`}>
                        {txn.category === 'prize_money' ? 'Tiền thưởng' : txn.category === 'jockey_fee' ? 'Phí Jockey' : 'Khác'}
                      </span>
                    </td>
                    <td style={{ color: txn.type === 'income' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {txn.type === 'income' ? '+' : '-'}{txn.amount.toLocaleString()} đ
                    </td>
                    <td style={{ color: '#555' }}>{txn.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="own-quick-grid">
        <Link to="/owner/horses" className="own-quick-card">
          <span className="own-quick-icon">🐴</span>
          <strong>Đội hình ngựa</strong>
          <p>{ownerHorses.length} chiến mã đã đăng ký</p>
        </Link>
        <Link to="/owner/jockeys" className="own-quick-card">
          <span className="own-quick-icon">🏇</span>
          <strong>Jockey liên kết</strong>
          <p>{ownerJockeys.filter(j => j.status === 'hired').length} nài ngựa đang thuê</p>
        </Link>
        <Link to="/owner/races" className="own-quick-card">
          <span className="own-quick-icon">🏁</span>
          <strong>Đăng ký giải đấu</strong>
          <p>{ownerRaces.filter(r => r.status !== 'completed').length} giải sắp diễn ra</p>
        </Link>
        <Link to="/owner/profile" className="own-quick-card">
          <span className="own-quick-icon">🏠</span>
          <strong>Thông tin Stable</strong>
          <p>Quản lý tên, màu áo thi đấu</p>
        </Link>
      </div>
    </div>
  )
}
