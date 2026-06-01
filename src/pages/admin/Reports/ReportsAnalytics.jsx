import React from 'react'
import { monthlyReports, revenueChart } from '../../../data/adminMockData'
import { formatCurrency } from '../../../utils/adminHelpers'
import './ReportsAnalytics.css'

export default function ReportsAnalytics() {
  const maxChart = Math.max(...revenueChart.map((d) => d.value))
  const totalRevenue = monthlyReports.reduce((s, m) => s + m.revenue, 0)
  const totalRaces = monthlyReports.reduce((s, m) => s + m.races, 0)
  const totalParticipants = monthlyReports.reduce((s, m) => s + m.participants, 0)

  return (
    <div className="reports-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Báo cáo & Phân tích</h1>
          <p className="admin-page-sub">Thống kê doanh thu, race và người tham gia</p>
        </div>
        <div className="reports-export-btns">
          <button type="button" className="admin-btn admin-btn--outline">Export Excel</button>
          <button type="button" className="admin-btn admin-btn--gold">Export PDF</button>
        </div>
      </div>

      <div className="reports-stat-row">
        <div className="admin-stat-card">
          <span>Tổng doanh thu</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Tổng race</span>
          <strong>{totalRaces}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Người tham gia</span>
          <strong>{totalParticipants.toLocaleString()}</strong>
        </div>
      </div>

      <div className="reports-grid">
        <div className="admin-card">
          <div className="admin-card-head"><h3>Doanh thu theo tháng</h3></div>
          <div className="admin-card-body">
            <div className="reports-chart">
              {revenueChart.map((item) => (
                <div key={item.month} className="reports-chart-col">
                  <div className="reports-chart-bar" style={{ height: `${(item.value / maxChart) * 100}%` }} />
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head"><h3>Chi tiết theo tháng</h3></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Doanh thu</th>
                  <th>Races</th>
                  <th>Tham gia</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReports.map((r) => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td className="reports-revenue">{formatCurrency(r.revenue)}</td>
                    <td>{r.races}</td>
                    <td>{r.participants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
