import React, { useState } from 'react'
import { users as initialUsers } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './UserManagement.css'

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)

  // Create User modal
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'SPECTATOR', status: 'active' })

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  // Handlers
  const handleToggleLock = (userId) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'locked' ? 'active' : 'locked'
        const nextUser = { ...u, status: nextStatus }
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(nextUser)
        }
        return nextUser
      }
      return u
    })
    setUsers(updated)
  }

  const handleCreateUser = (e) => {
    e.preventDefault()
    if (!newUser.name || !newUser.email) return

    const created = {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      joined: new Date().toISOString().split('T')[0]
    }

    setUsers([created, ...users])
    setShowAddForm(false)
    setNewUser({ name: '', email: '', role: 'SPECTATOR', status: 'active' })
  }

  return (
    <div className="user-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Tài khoản</h1>
          <p className="admin-page-sub">Quản lý danh sách tài khoản người dùng, khóa và đổi vai trò trực tuyến</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--gold"
          onClick={() => setShowAddForm(true)}
        >
          + Tạo tài khoản
        </button>
      </div>

      <div className="admin-filter-bar" style={{ marginTop: '16px' }}>
        <input
          className="admin-input"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">Tất cả Role</option>
          <option value="ADMIN">ADMIN</option>
          <option value="HORSE_OWNER">HORSE OWNER</option>
          <option value="JOCKEY">JOCKEY</option>
          <option value="REFEREE">REFEREE</option>
          <option value="SPECTATOR">SPECTATOR</option>
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
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => setSelectedUser(u)}
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className={`admin-btn admin-btn--sm ${u.status === 'locked' ? 'admin-btn--success' : 'admin-btn--danger'}`}
                          onClick={() => handleToggleLock(u.id)}
                        >
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
                <dt>Role</dt>
                <dd>
                  <select
                    className="admin-select"
                    value={selectedUser.role}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', minWidth: 'auto', marginTop: '4px' }}
                    onChange={(e) => {
                      const nextRole = e.target.value
                      const nextUser = { ...selectedUser, role: nextRole }
                      setSelectedUser(nextUser)
                      setUsers(users.map(u => u.id === selectedUser.id ? nextUser : u))
                    }}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="HORSE_OWNER">HORSE OWNER</option>
                    <option value="JOCKEY">JOCKEY</option>
                    <option value="REFEREE">REFEREE</option>
                    <option value="SPECTATOR">SPECTATOR</option>
                  </select>
                </dd>
                <dt>Trạng thái</dt>
                <dd><StatusBadge status={selectedUser.status} /></dd>
                <dt>Ngày tham gia</dt>
                <dd>{selectedUser.joined}</dd>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showAddForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <h3>Tạo tài khoản người dùng</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Họ và tên</label>
                <input
                  required
                  className="admin-input"
                  placeholder="Nhập tên..."
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Email</label>
                <input
                  required
                  type="email"
                  className="admin-input"
                  placeholder="Nhập email..."
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Hệ Role</label>
                <select
                  className="admin-select"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="HORSE_OWNER">HORSE OWNER</option>
                  <option value="JOCKEY">JOCKEY</option>
                  <option value="REFEREE">REFEREE</option>
                  <option value="SPECTATOR">SPECTATOR</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trạng thái</label>
                <select
                  className="admin-select"
                  value={newUser.status}
                  onChange={(e) => setNewUser(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowAddForm(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--gold">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
