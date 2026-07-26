import React, { useState, useEffect } from 'react'
import { users as initialUsers } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as adminAccountService from '../../../services/adminAccountService'
import './UserManagement.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Sorting State
  const [sortOption, setSortOption] = useState('NEWEST')

  // Edit User modal
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const data = await adminAccountService.getAllAccounts()
      const list = Array.isArray(data) ? data : (data?.data || [])
      setUsers(list)
    } catch (err) {
      console.error("Failed to fetch accounts from API:", err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  // Reset page to 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1)
  }, [localSearch, roleFilter, statusFilter, sortOption])

  // Sort users based on selected option
  const sortedUsers = [...users].sort((a, b) => {
    if (sortOption === 'NEWEST') {
      return b.id - a.id
    }
    if (sortOption === 'OLDEST') {
      return a.id - b.id
    }
    return 0
  })

  const filtered = sortedUsers.filter((u) => {
    // Exclude ADMIN accounts
    if (u.role === 'ADMIN') return false

    const nameVal = u.fullName || u.name
    const matchSearch =
      (nameVal && nameVal.toLowerCase().includes(localSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(localSearch.toLowerCase())) ||
      (u.phone && u.phone.includes(localSearch))
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchStatus = statusFilter === 'ALL' ||
      (statusFilter === 'APPROVED' && (u.status === 'APPROVED' || u.status === 'ACTIVE')) ||
      (statusFilter === 'LOCKED' && u.status === 'LOCKED') ||
      (statusFilter === 'PENDING' && u.status === 'PENDING')

    return matchSearch && matchRole && matchStatus
  })

  // Pagination Slice
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Handlers
  const handleToggleLock = async (userId, userRole) => {
    const userToUpdate = users.find(u => u.id === userId && u.role === userRole)
    if (!userToUpdate) return
    const nextStatus = userToUpdate.status === 'LOCKED' ? 'APPROVED' : 'LOCKED'
    
    try {
      const updated = await adminAccountService.updateAccount(userToUpdate.role, userId, {
        ...userToUpdate,
        status: nextStatus
      })
      const nextUser = updated || { ...userToUpdate, status: nextStatus }
      setUsers(users.map(u => u.id === userId ? nextUser : u))
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(nextUser)
      }
    } catch (err) {
      alert("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  const handleApproveUser = async (userId, userRole) => {
    const userToUpdate = users.find(u => u.id === userId && u.role === userRole)
    if (!userToUpdate) return
    
    try {
      const updated = await adminAccountService.updateAccount(userToUpdate.role, userId, {
        ...userToUpdate,
        status: 'APPROVED'
      })
      const nextUser = updated || { ...userToUpdate, status: 'APPROVED' }
      setUsers(users.map(u => u.id === userId ? nextUser : u))
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(nextUser)
      }
      alert("Phê duyệt tài khoản thành công!")
    } catch (err) {
      alert("Phê duyệt thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  const handleRejectUser = async (userId, userRole) => {
    const userToUpdate = users.find(u => u.id === userId && u.role === userRole)
    if (!userToUpdate) return
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối tài khoản "${userToUpdate.fullName || userToUpdate.name}" không?`)) return
    
    try {
      const updated = await adminAccountService.updateAccount(userToUpdate.role, userId, {
        ...userToUpdate,
        status: 'REJECTED'
      })
      const nextUser = updated || { ...userToUpdate, status: 'REJECTED' }
      setUsers(users.map(u => u.id === userId ? nextUser : u))
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(nextUser)
      }
      alert("Đã từ chối tài khoản!")
    } catch (err) {
      alert("Từ chối thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const payload = {
        fullName: editingUser.fullName || editingUser.name,
        phone: editingUser.phone,
        birthDate: editingUser.dob,
        status: editingUser.status,
      }
      const updated = await adminAccountService.updateAccount(editingUser.role, editingUser.id, payload)
      const nextUser = updated || { ...editingUser }
      setUsers(users.map(u => u.id === editingUser.id ? nextUser : u))
      if (selectedUser && selectedUser.id === editingUser.id) {
        setSelectedUser(nextUser)
      }
      setShowEditForm(false)
      setEditingUser(null)
      alert("Cập nhật tài khoản thành công!")
    } catch (err) {
      alert("Cập nhật tài khoản thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteUser = async (userId, userRole) => {
    const userToDelete = users.find(u => u.id === userId && u.role === userRole)
    if (!userToDelete) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete.name || userToDelete.fullName}" không?`)) return
    
    try {
      await adminAccountService.deleteAccount(userToDelete.role, userId)
      setUsers(users.filter(u => u.id !== userId))
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null)
      }
      alert("Xóa tài khoản thành công!")
    } catch (err) {
      alert("Xóa tài khoản thất bại: " + (err.response?.data || err.message))
    }
  }

  const handleAssignRole = async (userId, userRole, nextRole) => {
    const userToUpdate = users.find(u => u.id === userId && u.role === userRole)
    if (!userToUpdate) return
    const confirmChange = window.confirm(`Bạn có chắc chắn muốn thay đổi vai trò của người dùng từ ${userToUpdate.role} thành ${nextRole}?`)
    if (!confirmChange) return

    try {
      const updated = await adminAccountService.assignRole(userToUpdate.role, userId, {
        newRole: nextRole
      })
      const nextUser = updated || { ...userToUpdate, role: nextRole }
      setSelectedUser(nextUser)
      setUsers(users.map(u => u.id === userId ? nextUser : u))
      alert("Gán vai trò thành công!")
    } catch (err) {
      alert("Gán vai trò thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  return (
    <div className="user-mgmt-page">
      <div className="admin-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="admin-page-title">Quản lý Tài khoản</h1>
          <p className="admin-page-sub">Quản lý danh sách tài khoản người dùng cả 4 vai trò (HORSE OWNER, JOCKEY, REFEREE, SPECTATOR)</p>
        </div>
        <div style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '10px',
          padding: '10px 20px',
          textAlign: 'center',
          minWidth: '150px'
        }}>
          <span style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng số tài khoản</span>
          <strong style={{ fontSize: '22px', color: '#d4af37', fontWeight: '700' }}>
            {users.filter(u => u.role !== 'ADMIN').length}
          </strong>
        </div>
      </div>

      <div className="admin-filter-bar" style={{ marginTop: '16px' }}>
        <input
          className="admin-input"
          placeholder="Tìm theo tên hoặc email..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">Tất cả Role</option>
          <option value="HORSE_OWNER">HORSE OWNER</option>
          <option value="JOCKEY">JOCKEY</option>
          <option value="RACE_REFEREE">REFEREE</option>
          <option value="SPECTATOR">SPECTATOR</option>
        </select>
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Tất cả Trạng thái</option>
          <option value="APPROVED">Đang hoạt động</option>
          <option value="LOCKED">Bị khóa</option>
          <option value="PENDING">Chờ duyệt</option>
        </select>
        <select className="admin-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="NEWEST">Sắp xếp: Mới nhất</option>
          <option value="OLDEST">Sắp xếp: Cũ nhất</option>
        </select>
      </div>

      <div className="user-mgmt-layout">
        <div className="admin-card user-mgmt-table-card">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>Đang tải dữ liệu...</div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Role</th>
                      <th>Trạng thái</th>
                      <th>Phê duyệt</th>
                      <th>Từ chối</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#aaa', fontSize: '14px' }}>
                          Không có tài khoản
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u, index) => (
                        <tr key={`${u.role}-${u.id || index}-${index}`}>
                          <td>#{u.id}</td>
                          <td>{u.fullName || u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.phone || '—'}</td>
                          <td><span className="admin-badge admin-badge--gold">{u.role}</span></td>
                          <td><StatusBadge status={u.status} /></td>
                          <td>
                            {u.status === 'PENDING' ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--success admin-btn--sm"
                                onClick={() => handleApproveUser(u.id, u.role)}
                              >
                                ✓ Duyệt
                              </button>
                            ) : (
                              <span style={{ color: '#666', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td>
                            {u.status === 'PENDING' ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => handleRejectUser(u.id, u.role)}
                              >
                                ✕ Từ chối
                              </button>
                            ) : (
                              <span style={{ color: '#666', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div className="admin-table-actions">
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                onClick={() => setSelectedUser(u)}
                              >
                                Chi tiết
                              </button>
                              {u.status !== 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    className={`admin-btn admin-btn--sm ${u.status === 'LOCKED' ? 'admin-btn--success' : 'admin-btn--danger'}`}
                                    onClick={() => handleToggleLock(u.id, u.role)}
                                  >
                                    {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn--danger admin-btn--sm"
                                    onClick={() => handleDeleteUser(u.id, u.role)}
                                  >
                                    Xóa
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(0, 0, 0, 0.1)'
                }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    style={{ minWidth: '40px', padding: '4px 8px' }}
                  >
                    ◀
                  </button>
                  <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>
                    Trang {currentPage} / {totalPages} ({filtered.length} tài khoản)
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    style={{ minWidth: '40px', padding: '4px 8px' }}
                  >
                    ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedUser && (
          <div className="admin-card user-detail-panel">
            <div className="admin-card-head">
              <h3>Chi tiết User</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className="admin-card-body user-detail-body">
              <div className="user-detail-avatar">{(selectedUser.fullName || selectedUser.name || 'U').charAt(0)}</div>
              <h4>{selectedUser.fullName || selectedUser.name}</h4>
              <p>{selectedUser.email}</p>
              <dl className="user-detail-dl">
                <dt>Số điện thoại</dt>
                <dd>{selectedUser.phone || '—'}</dd>
                <dt>Ngày sinh</dt>
                <dd>{selectedUser.birthDate || selectedUser.dob || '—'}</dd>
                
                {selectedUser.role === 'HORSE_OWNER' && (
                  <>
                    <dt>Địa chỉ</dt>
                    <dd>{selectedUser.address || '—'}</dd>
                  </>
                )}

                {selectedUser.role === 'JOCKEY' && (
                  <>
                    <dt>Số năm kinh nghiệm</dt>
                    <dd>{selectedUser.experienceYears !== undefined && selectedUser.experienceYears !== null ? selectedUser.experienceYears + ' năm' : '—'}</dd>
                    <dt>Số bằng lái</dt>
                    <dd>{selectedUser.licenseNumber || '—'}</dd>
                  </>
                )}

                {selectedUser.role === 'RACE_REFEREE' && (
                  <>
                    <dt>Số năm kinh nghiệm</dt>
                    <dd>{selectedUser.experienceYears !== undefined && selectedUser.experienceYears !== null ? selectedUser.experienceYears + ' năm' : '—'}</dd>
                    <dt>Cấp độ chứng chỉ</dt>
                    <dd>{selectedUser.certificateLevel || '—'}</dd>
                  </>
                )}

                <dt>Role</dt>
                <dd><span className="admin-badge admin-badge--gold">{selectedUser.role}</span></dd>
                <dt>Trạng thái</dt>
                <dd><StatusBadge status={selectedUser.status} /></dd>
                <dt>Ngày tham gia</dt>
                <dd>{selectedUser.joined || '—'}</dd>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditForm && editingUser && (
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
              <h3>Chỉnh sửa thông tin</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => { setShowEditForm(false); setEditingUser(null); }}>✕</button>
            </div>
            <form onSubmit={handleUpdateUser} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Họ và tên</label>
                <input
                  required
                  className="admin-input"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Số điện thoại</label>
                <input
                  type="tel"
                  className="admin-input"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày sinh</label>
                <input
                  required
                  type="date"
                  className="admin-input"
                  value={editingUser.dob || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, dob: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setShowEditForm(false); setEditingUser(null); }}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--gold">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
