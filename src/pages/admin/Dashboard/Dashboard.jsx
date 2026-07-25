import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  dashboardStats,
  revenueChart,
  recentActivities,
  registrations as defaultRegistrations,
  resultReports as defaultResultReports,
  complaints as defaultComplaints
} from '../../../data/adminMockData'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { getAllAdminHorses, getAllAdminJockeys, getAllRegistrations } from '../../../services/adminService'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const maxChart = Math.max(...revenueChart.map((d) => d.value))

  const [stats, setStats] = useState({
    tournaments: dashboardStats.tournaments,
    races: dashboardStats.races,
    horses: dashboardStats.horses,
    jockeys: dashboardStats.jockeys,
    ticketsSold: dashboardStats.ticketsSold,
    revenueLabel: dashboardStats.revenueLabel
  })

  const [pendingRegCount, setPendingRegCount] = useState(0)
  const [pendingResultCount, setPendingResultCount] = useState(0)
  const [pendingComplaintCount, setPendingComplaintCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [toursRes, horsesRes, jockeysRes, regsRes] = await Promise.allSettled([
        getAllTournaments(),
        getAllAdminHorses(),
        getAllAdminJockeys(),
        getAllRegistrations()
      ])

      let tourCount = dashboardStats.tournaments
      let horseCount = dashboardStats.horses
      let jockeyCount = dashboardStats.jockeys
      let raceCount = dashboardStats.races
      let pendingRegs = 0

      // 1. Tournaments & Races
      if (toursRes.status === 'fulfilled') {
        const tours = toursRes.value?.data || toursRes.value || []
        if (Array.isArray(tours) && tours.length > 0) {
          tourCount = tours.length
          let totalRaces = 0

          for (const t of tours) {
            try {
              const schedRes = await getTournamentSchedule(t.id)
              const schedList = schedRes?.data || schedRes || []
              if (Array.isArray(schedList)) {
                totalRaces += schedList.length
              }
            } catch (e) {
              console.warn(`Error fetching schedule for tour ${t.id}:`, e)
            }
          }
          if (totalRaces > 0) raceCount = totalRaces
        }
      }

      // 2. Horses
      if (horsesRes.status === 'fulfilled') {
        const horses = horsesRes.value?.data || horsesRes.value || []
        if (Array.isArray(horses) && horses.length > 0) {
          horseCount = horses.length
        }
      }

      // 3. Jockeys
      if (jockeysRes.status === 'fulfilled') {
        const jockeys = jockeysRes.value?.data || jockeysRes.value || []
        if (Array.isArray(jockeys) && jockeys.length > 0) {
          jockeyCount = jockeys.length
        }
      }

      // 4. Registrations
      if (regsRes.status === 'fulfilled') {
        const regs = regsRes.value?.data || regsRes.value || []
        if (Array.isArray(regs) && regs.length > 0) {
          pendingRegs = regs.filter(r => (r.status || '').toLowerCase() === 'pending').length
        } else {
          // Fallback to local storage count
          const storedReg = localStorage.getItem('mock_registrations')
          const localRegs = storedReg ? JSON.parse(storedReg) : defaultRegistrations
          pendingRegs = localRegs.filter(r => r.status === 'pending').length
        }
      } else {
        const storedReg = localStorage.getItem('mock_registrations')
        const localRegs = storedReg ? JSON.parse(storedReg) : defaultRegistrations
        pendingRegs = localRegs.filter(r => r.status === 'pending').length
      }

      setStats(prev => ({
        ...prev,
        tournaments: tourCount,
        races: raceCount,
        horses: horseCount,
        jockeys: jockeyCount
      }))

      setPendingRegCount(pendingRegs)
    } catch (err) {
      console.error('Lỗi khi gọi API kết nối Dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Results count (Local Storage / Mock fallback)
    const storedResults = localStorage.getItem('mock_result_reports')
    const results = storedResults ? JSON.parse(storedResults) : defaultResultReports
    if (!storedResults) {
      localStorage.setItem('mock_result_reports', JSON.stringify(defaultResultReports))
    }
    setPendingResultCount(results.filter(r => r.status === 'pending').length)

    // Complaints count (Local Storage / Mock fallback)
    const storedComplaints = localStorage.getItem('mock_complaints')
    const comps = storedComplaints ? JSON.parse(storedComplaints) : defaultComplaints
    if (!storedComplaints) {
      localStorage.setItem('mock_complaints', JSON.stringify(defaultComplaints))
    }
    setPendingComplaintCount(comps.filter(c => c.status === 'pending' || c.status === 'reviewing').length)
  }, [])

  return (
    <div className="dashboard-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Tổng quan hệ thống quản lý giải đua ngựa và chỉ số thời gian thực</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost admin-btn--sm"
          onClick={fetchDashboardData}
          title="Làm mới dữ liệu từ API"
        >
          🔄 {loading ? 'Đang tải API...' : 'Làm mới API'}
        </button>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span>Giải đấu</span>
          <strong>{stats.tournaments}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Cuộc đua</span>
          <strong>{stats.races}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Ngựa</span>
          <strong>{stats.horses.toLocaleString()}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Jockey</span>
          <strong>{stats.jockeys}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Vé đã bán</span>
          <strong>{stats.ticketsSold.toLocaleString()}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Doanh thu</span>
          <strong>{stats.revenueLabel}</strong>
          <small>6 tháng gần nhất</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="admin-card dashboard-chart-card">
          <div className="admin-card-head">
            <h3>Doanh thu theo tháng (triệu VND)</h3>
          </div>
          <div className="admin-card-body">
            <div className="dashboard-chart">
              {revenueChart.map((item) => (
                <div key={item.month} className="dashboard-chart-col">
                  <div
                    className="dashboard-chart-bar"
                    style={{ height: `${(item.value / maxChart) * 100}%` }}
                  />
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card dashboard-activity-card">
          <div className="admin-card-head">
            <h3>Hoạt động gần đây</h3>
          </div>
          <div className="admin-card-body dashboard-activity-list">
            {recentActivities.map((act) => (
              <div key={act.id} className={`dashboard-activity-item dashboard-activity-item--${act.type}`}>
                <div className="dashboard-activity-dot" />
                <div>
                  <strong>{act.action}</strong>
                  <p>{act.user} · {act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-quick-grid">
        <div className="admin-card">
          <div className="admin-card-head"><h3>Chờ xử lý</h3></div>
          <div className="admin-card-body dashboard-pending-list">
            <div 
              className="dashboard-pending-item"
              onClick={() => navigate('/admin/registrations')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s' }}
            >
              <span>Đăng ký chờ duyệt</span>
              <StatusBadge status="pending" />
              <strong>{pendingRegCount}</strong>
            </div>
            <div 
              className="dashboard-pending-item"
              onClick={() => navigate('/admin/results')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s' }}
            >
              <span>Kết quả chờ duyệt</span>
              <StatusBadge status="pending" />
              <strong>{pendingResultCount}</strong>
            </div>
            <div 
              className="dashboard-pending-item"
              onClick={() => navigate('/admin/complaints')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s' }}
            >
              <span>Khiếu nại mới</span>
              <StatusBadge status="reviewing" />
              <strong>{pendingComplaintCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
