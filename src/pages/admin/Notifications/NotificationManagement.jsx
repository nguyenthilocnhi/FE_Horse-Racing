import React, { useState } from 'react'
import { notifications } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './NotificationManagement.css'

export default function NotificationManagement() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="notification-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Thông báo</h1>
          <p className="admin-page-sub">Tạo và gửi thông báo đến người dùng</p>
        </div>
        <button type="button" className="admin-btn admin-btn--gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng' : '+ Tạo thông báo'}
        </button>
      </div>

      {showForm && (
        <div className="admin-card notification-form-card">
          <div className="admin-card-head"><h3>Tạo thông báo mới</h3></div>
          <div className="admin-card-body notification-form">
            <input className="admin-input" placeholder="Tiêu đề thông báo" />
            <textarea className="admin-input notification-textarea" placeholder="Nội dung..." rows={4} />
            <select className="admin-select">
              <option>All Users</option>
              <option>Organizers</option>
              <option>Jockeys</option>
            </select>
            <div className="notification-form-actions">
              <button type="button" className="admin-btn admin-btn--ghost">Lưu nháp</button>
              <button type="button" className="admin-btn admin-btn--gold">Gửi thông báo</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tiêu đề</th>
                <th>Đối tượng</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td><strong>{n.title}</strong></td>
                  <td>{n.audience}</td>
                  <td>{n.sent || '—'}</td>
                  <td><StatusBadge status={n.status} /></td>
                  <td>
                    {n.status === 'draft' && (
                      <button type="button" className="admin-btn admin-btn--gold admin-btn--sm">Gửi</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
