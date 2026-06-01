import React, { useState } from 'react'
import { users } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './UserManagement.css'

export default function UserManagement() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="user-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý User</h1>
          <p className="admin-page-sub">Danh sách tài khoản và phân quyền hệ thống</p>
        </div>
        <button type="button" className="admin-btn admin-btn--gold">+ Tạo tài khoản</button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="admin-input"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">Tất cả Role</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="JOCKEY">JOCKEY</option>
          <option value="REFEREE">REFEREE</option>
          <option value="USER">USER</option>
        </select>
      </div>

      <div className="user-mgmt-layout">
        <div className="admin-card user-mgmt-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="admin-badge admin-badge--gold">{u.role}</span></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      <div className="admin-table-actions">
                        <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedUser(u)}>Chi tiết</button>
                        <button type="button" className="admin-btn admin-btn--outline admin-btn--sm">
                          {u.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div className="admin-card user-detail-panel">
            <div className="admin-card-head">
              <h3>Chi tiết User</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className="admin-card-body user-detail-body">
              <div className="user-detail-avatar">{(selectedUser.name).charAt(0)}</div>
              <h4>{selectedUser.name}</h4>
              <p>{selectedUser.email}</p>
              <dl className="user-detail-dl">
                <dt>Role</dt><dd>{selectedUser.role}</dd>
                <dt>Trạng thái</dt><dd><StatusBadge status={selectedUser.status} /></dd>
                <dt>Ngày tham gia</dt><dd>{selectedUser.joined}</dd>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
