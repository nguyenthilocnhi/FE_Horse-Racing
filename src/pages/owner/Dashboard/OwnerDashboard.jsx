import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { getOwnerHorses, getMyParticipations } from '../../../services/ownerService'
import { getAllJockeys } from '../../../services/jockeyService'
import { formatCurrency } from '../../../utils/adminHelpers'
import {
  ownerStats as initialStats,
  ownerProfile as initialProfile,
  ownerRaces as initialRaces,
  ownerHorses as initialHorses,
  ownerJockeys as initialJockeys,
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
  const { user } = useAuth()
  const [profile, setProfile] = useState(initialProfile)
  const [horses, setHorses] = useState([])
  const [participations, setParticipations] = useState([])
  const [jockeys, setJockeys] = useState([])
  const [upcomingRace, setUpcomingRace] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // 1. Owner Profile Info
        const defaultName = user?.fullName || user?.name || user?.username || 'Chủ sở hữu'
        const pending = localStorage.getItem('pending_profile') || localStorage.getItem('owner_profile')
        let profName = defaultName
        let stable = 'Phú Thọ Stable'
        let license = 'LIC-2026-OWNER'

        if (pending) {
          try {
            const parsed = JSON.parse(pending)
            if (parsed.name) profName = parsed.name
            if (parsed.stableName) stable = parsed.stableName
            if (parsed.licenseNo) license = parsed.licenseNo
          } catch (_) { }
        }
        setProfile({ name: profName, stableName: stable, licenseNo: license })

        // 2. Fetch Owner Horses from API (GET /api/owner/horses)
        let loadedHorses = []
        try {
          const horseRes = await getOwnerHorses()
          const list = Array.isArray(horseRes) ? horseRes : (horseRes?.data || horseRes?.content || [])
          if (list.length > 0) {
            loadedHorses = list
          }
        } catch (err) {
          console.warn('API getOwnerHorses error in dashboard:', err)
        }
        if (loadedHorses.length === 0) {
          // Fallback to local horses array if API empty
          const localStored = localStorage.getItem(`owner_horses_${user?.email || 'default'}`)
          if (localStored) {
            try { loadedHorses = JSON.parse(localStored) } catch (e) { }
          }
          if (!loadedHorses || loadedHorses.length === 0) loadedHorses = initialHorses
        }
        setHorses(loadedHorses)

        // 3. Fetch Race Participations from API (GET /api/owner/race-participations)
        let loadedParts = []
        try {
          const partRes = await getMyParticipations()
          const partList = Array.isArray(partRes) ? partRes : (partRes?.data || [])
          if (partList.length > 0) loadedParts = partList
        } catch (pErr) {
          console.warn('API getMyParticipations error in dashboard:', pErr)
        }
        if (loadedParts.length === 0) {
          loadedParts = initialRaces
        }
        setParticipations(loadedParts)

        // 4. Fetch Jockeys
        let loadedJockeys = []
        try {
          const jocRes = await getAllJockeys()
          const jocList = Array.isArray(jocRes) ? jocRes : (jocRes?.data || [])
          if (jocList.length > 0) loadedJockeys = jocList
        } catch (jErr) { }
        if (loadedJockeys.length === 0) loadedJockeys = initialJockeys
        setJockeys(loadedJockeys)

        // Determine upcoming race
        const found = loadedParts.find(r => r.status === 'registered' || r.status === 'scheduled' || r.status === 'upcoming' || r.status === 'pending_confirmation') || loadedParts[0]
        if (found) {
          setUpcomingRace({
            name: found.raceName || found.raceScheduleName || found.name || `Cuộc đua #${found.id}`,
            venue: found.location || found.venue || 'Trường đua Phú Thọ',
            date: found.raceDate || found.date || '2026-08-15',
            time: found.startTime || found.time || '08:00',
            registeredHorse: found.horseName || found.registeredHorse || (loadedHorses[0]?.name || 'Chưa đăng ký'),
            assignedJockey: found.jockeyName || found.assignedJockey || 'Chưa chỉ định',
            prizePool: found.prizePool ? (typeof found.prizePool === 'number' ? formatCurrency(found.prizePool) : found.prizePool) : '50.000.000 đ'
          })
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu dashboard chủ ngựa:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const chartMonths = ['T2', 'T3', 'T4', 'T5', 'T6']
  const chartEarnings = [120, 220, 180, 450, 820] // Million VND
  const maxChart = Math.max(...chartEarnings)

  const activeStats = [
    { label: 'Tổng số chiến mã', value: horses.length, unit: 'con' },
    { label: 'Lượt đua tham gia', value: participations.length, unit: 'lượt' },
    { label: 'Nài ngựa (Jockey)', value: jockeys.length, unit: 'người' },
    { label: 'Tỷ lệ thắng trung bình', value: '68%', unit: '' }
  ]

  return (
    <div className="own-dashboard">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Xin chào, {profile.name} 👋</h1>
          <p className="owner-page-sub">
            Chủ trang trại <strong style={{ color: '#d4af37' }}>{profile.stableName}</strong> · Giấy phép {profile.licenseNo}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/owner/horses" className="owner-btn owner-btn--outline">
            🐴 Đội hình Ngựa ({horses.length})
          </Link>
          <Link to="/owner/jockeys" className="owner-btn owner-btn--gold">
            🏇 Nài ngựa Jockey ({jockeys.length})
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="owner-stat-grid">
        {activeStats.map((s) => (
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
              <span>🐴 Ngựa đăng ký: <strong style={{ color: '#d4af37' }}>{upcomingRace.registeredHorse}</strong></span>
              <span>🏇 Jockey assigned: <strong>{upcomingRace.assignedJockey}</strong></span>
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
          <p>{horses.length} chiến mã đã đăng ký</p>
        </Link>
        <Link to="/owner/jockeys" className="own-quick-card">
          <span className="own-quick-icon">🏇</span>
          <strong>Jockey liên kết</strong>
          <p>{jockeys.length} nài ngựa đang hợp tác</p>
        </Link>
        <Link to="/owner/races" className="own-quick-card">
          <span className="own-quick-icon">🏁</span>
          <strong>Đăng ký giải đấu</strong>
          <p>{participations.length} giải đấu / lượt đua</p>
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
