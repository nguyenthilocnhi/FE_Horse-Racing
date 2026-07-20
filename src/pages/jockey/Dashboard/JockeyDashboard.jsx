import React from 'react'
import { Link } from 'react-router-dom'
import {
  jockeyStats,
  jockeyProfile,
  upcomingSchedule,
  myRaces,
  recentResultDetails,
} from '../../../data/jockeyMockData'
import './JockeyDashboard.css'

function StatCard({ stat }) {
  return (
    <div className="jockey-stat-card">
      <span>{stat.label}</span>
      <strong>{stat.value}{stat.unit && <small style={{ fontSize: '0.9rem', marginLeft: 2 }}>{stat.unit}</small>}</strong>
    </div>
  )
}

function MiniResultRow({ r }) {
  const posClass = r.position === 1 ? 'jockey-medal--1' : r.position === 2 ? 'jockey-medal--2' : r.position === 3 ? 'jockey-medal--3' : 'jockey-medal--n'
  return (
    <tr>
      <td><span className={`jockey-medal ${posClass}`}>{r.position}</span></td>
      <td style={{ color: '#fff' }}>{r.race}</td>
      <td>{r.horse}</td>
      <td style={{ color: '#00d4aa', fontWeight: 600 }}>+{r.points} pts</td>
      <td style={{ color: '#555', fontSize: 12 }}>{r.date}</td>
    </tr>
  )
}

export default function JockeyDashboard() {
  const upcoming = upcomingSchedule[0]
  const recent3 = recentResultDetails.slice(0, 4)
  const completedRaces = myRaces.filter((r) => r.status === 'completed')

  // build bar chart from recentResultDetails grouped by month (simplified)
  const chartMonths = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']
  const chartData = [290, 215, 400, 310, 540, 420]
  const maxChart = Math.max(...chartData)

  return (
    <div className="jk-dashboard">
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Xin chào, {jockeyProfile.nickname} 👋</h1>
          <p className="jockey-page-sub">
            Hạng hiện tại <strong style={{ color: '#00d4aa' }}>#3 Toàn quốc</strong> · Giấy phép {jockeyProfile.licenseNo}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/jockey/invitations" className="jockey-btn jockey-btn--outline">
            ✉ Xem lời mời
          </Link>
          <Link to="/jockey/profile" className="jockey-btn jockey-btn--teal">
            ◎ Hồ sơ
          </Link>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="jockey-stat-grid">
        {jockeyStats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* Upcoming race banner */}
      {upcoming && (
        <div className="jk-upcoming-banner">
          <div className="jk-upcoming-label">🏁 CUỘC ĐUA SẮP TỚI</div>
          <div className="jk-upcoming-name">{upcoming.name}</div>
          <div className="jk-upcoming-meta">
            <span>📍 {upcoming.venue}</span>
            <span>📅 {upcoming.date} · {upcoming.time}</span>
            <span>🐴 {upcoming.horse}</span>
            <span>📏 {upcoming.distance}</span>
          </div>
          <div className="jk-upcoming-countdown">
            <span className="jk-countdown-num">{upcoming.daysLeft}</span>
            <span className="jk-countdown-label">ngày nữa</span>
          </div>
          <Link to="/jockey/my-races" className="jockey-btn jockey-btn--teal jockey-btn--sm">
            Chi tiết →
          </Link>
        </div>
      )}

      <div className="jk-dashboard-grid">
        {/* Chart */}
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Điểm tích lũy theo tháng</h3>
            <Link to="/jockey/results" style={{ fontSize: 12, color: '#00d4aa', textDecoration: 'none' }}>
              Chi tiết →
            </Link>
          </div>
          <div className="jockey-card-body">
            <div className="jk-chart">
              {chartMonths.map((m, i) => (
                <div key={m} className="jk-chart-col">
                  <div className="jk-chart-value">{chartData[i]}</div>
                  <div
                    className="jk-chart-bar"
                    style={{ height: `${(chartData[i] / maxChart) * 100}%` }}
                  />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Kết quả gần đây</h3>
            <Link to="/jockey/results" style={{ fontSize: 12, color: '#00d4aa', textDecoration: 'none' }}>
              Xem tất cả →
            </Link>
          </div>
          <div className="jockey-table-wrap">
            <table className="jockey-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Cuộc đua</th>
                  <th>Ngựa</th>
                  <th>Điểm</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recent3.map((r) => <MiniResultRow key={r.raceId} r={r} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="jk-quick-grid">
        <Link to="/jockey/invitations" className="jk-quick-card">
          <span className="jk-quick-icon">✉</span>
          <strong>Lời mời thi đấu</strong>
          <p>2 lời mời đang chờ phản hồi</p>
        </Link>
        <Link to="/jockey/my-races" className="jk-quick-card">
          <span className="jk-quick-icon">🏁</span>
          <strong>Lịch thi đấu</strong>
          <p>{upcomingSchedule.length} cuộc đua sắp tới</p>
        </Link>
        <Link to="/jockey/rankings" className="jk-quick-card">
          <span className="jk-quick-icon">🏆</span>
          <strong>Bảng xếp hạng</strong>
          <p>Hạng #3 · 3,480 điểm</p>
        </Link>
        <Link to="/jockey/profile" className="jk-quick-card">
          <span className="jk-quick-icon">◎</span>
          <strong>Hồ sơ jockey</strong>
          <p>Cập nhật thông tin cá nhân</p>
        </Link>
      </div>
    </div>
  )
}
