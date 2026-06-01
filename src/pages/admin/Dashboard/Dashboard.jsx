import React from 'react'
import {
  dashboardStats,
  revenueChart,
  recentActivities,
} from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './Dashboard.css'

export default function Dashboard() {
  const maxChart = Math.max(...revenueChart.map((d) => d.value))

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
            <div className="dashboard-pending-item">
              <span>Đăng ký chờ duyệt</span>
              <StatusBadge status="pending" />
              <strong>12</strong>
            </div>
            <div className="dashboard-pending-item">
              <span>Kết quả chờ duyệt</span>
              <StatusBadge status="pending" />
              <strong>3</strong>
            </div>
            <div className="dashboard-pending-item">
              <span>Khiếu nại mới</span>
              <StatusBadge status="reviewing" />
              <strong>5</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
