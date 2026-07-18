import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  dashboardStats,
  recentActivities,
  resultReports as defaultResultReports,
  complaints as defaultComplaints
} from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as adminAccountService from '../../../services/adminAccountService'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()

  const [pendingAccountCount, setPendingAccountCount] = useState(0)
  const [pendingResultCount, setPendingResultCount] = useState(0)
  const [pendingComplaintCount, setPendingComplaintCount] = useState(0)

  useEffect(() => {

    // Accounts count
    async function fetchAccounts() {
      try {
        const data = await adminAccountService.getAllAccounts()
        const list = data || []
        const pending = list.filter(u => u.status?.toLowerCase() === 'pending' || u.accountStatus?.toLowerCase() === 'pending')
        setPendingAccountCount(pending.length)
      } catch (err) {
        console.warn("Failed to fetch pending accounts for dashboard:", err)
      }
    }
    fetchAccounts()

    // Results count
    const storedResults = localStorage.getItem('mock_result_reports')
    const results = storedResults ? JSON.parse(storedResults) : defaultResultReports
    if (!storedResults) {
      localStorage.setItem('mock_result_reports', JSON.stringify(defaultResultReports))
    }
    setPendingResultCount(results.filter(r => r.status === 'pending').length)

    // Complaints count
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
          <p className="admin-page-sub">Tổng quan hệ thống quản lý giải đua ngựa</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span>Giải đấu</span>
          <strong>{dashboardStats.tournaments}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Cuộc đua</span>
          <strong>{dashboardStats.races}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Ngựa</span>
          <strong>{dashboardStats.horses.toLocaleString()}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Jockey</span>
          <strong>{dashboardStats.jockeys}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Vé đã bán</span>
          <strong>{dashboardStats.ticketsSold.toLocaleString()}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Doanh thu</span>
          <strong>{dashboardStats.revenueLabel}</strong>
          <small>6 tháng gần nhất</small>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="admin-card">
          <div className="admin-card-head"><h3>Chờ xử lý</h3></div>
          <div className="admin-card-body dashboard-pending-list">
            <div 
              className="dashboard-pending-item"
              onClick={() => navigate('/admin/users')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s' }}
            >
              <span>Tài khoản chờ duyệt</span>
              <StatusBadge status="pending" />
              <strong>{pendingAccountCount}</strong>
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
    </div>
  )
}
