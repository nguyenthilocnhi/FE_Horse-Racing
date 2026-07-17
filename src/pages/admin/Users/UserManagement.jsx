import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { StatusBadge } from '../../../utils/adminHelpers'
import * as adminAccountService from '../../../services/adminAccountService'
import './UserManagement.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { searchQuery: search = '', setSearchQuery: setSearch = () => { } } = useOutletContext() || {}
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Sorting State
  const [sortOption, setSortOption] = useState('NEWEST')

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const data = await adminAccountService.getAllAccounts()
      const list = data || []

      // Load registration history from localStorage
      const historyList = JSON.parse(localStorage.getItem('registered_users_history') || '[]')

      const normalized = list.map(u => {
        // Find in history by email, userName, or phone
        const matched = historyList.find(h =>
          (h.email && u.email && h.email.toLowerCase() === u.email.toLowerCase()) ||
          (h.userName && u.userName && h.userName.toLowerCase() === u.userName.toLowerCase()) ||
          (h.phone && u.phone && h.phone === u.phone)
        )

        // Map date of birth and joined date
        const dobVal = u.birthDate || u.dob || matched?.dob || ''
        const rawJoinedVal = matched?.joined || u.joined || new Date(0).toISOString()
        const joinedVal = matched?.joined
          ? new Date(matched.joined).toLocaleDateString('vi-VN')
          : (u.joined || new Date().toLocaleDateString('vi-VN'))

        let statusVal = u.status || 'ACTIVE'
        if (statusVal.toUpperCase() === 'APPROVED') {
          statusVal = 'ACTIVE'
        } else if (statusVal.toUpperCase() === 'REJECTED') {
          statusVal = 'LOCKED'
        }

        return {
          ...u,
          dob: dobVal,
          joined: joinedVal,
          rawJoined: rawJoinedVal,
          status: statusVal
        }
      })

      // Sort by rawJoined ascending (oldest first) to assign unique sequential display IDs
      normalized.sort((a, b) => {
        const timeA = new Date(a.rawJoined || 0).getTime()
        const timeB = new Date(b.rawJoined || 0).getTime()
        if (timeA !== timeB) return timeA - timeB
        return a.id - b.id
      })

      // Assign sequential displayId starting from 1
      const mappedWithDisplayIds = normalized.map((u, index) => ({
        ...u,
        displayId: index + 1
      }))

      setUsers(mappedWithDisplayIds)
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
  }, [search, roleFilter, statusFilter, sortOption])

  // Sort users based on selected option
  const sortedUsers = [...users].sort((a, b) => {
    if (sortOption === 'NEWEST') {
      const timeA = new Date(a.rawJoined || 0).getTime()
      const timeB = new Date(b.rawJoined || 0).getTime()
      if (timeB !== timeA) return timeB - timeA
      return b.displayId - a.displayId
    }
    if (sortOption === 'OLDEST') {
      const timeA = new Date(a.rawJoined || 0).getTime()
      const timeB = new Date(b.rawJoined || 0).getTime()
      if (timeA !== timeB) return timeA - timeB
      return a.displayId - b.displayId
    }
    return 0
  })

  const filtered = sortedUsers.filter((u) => {
    // 1. Exclude ADMIN accounts
    if (u.role === 'ADMIN') return false

    const nameVal = u.fullName || u.name
    const matchSearch =
      (nameVal && nameVal.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search))
    
    // Normalize role string comparison
    const searchRole = roleFilter === 'REFEREE' ? 'RACE_REFEREE' : roleFilter
    const matchRole = roleFilter === 'ALL' || u.role === searchRole

    const userStatus = u.status?.toLowerCase() || ''
    const matchStatus =
      statusFilter === 'ALL' ||
      userStatus === statusFilter.toLowerCase()

    return matchSearch && matchRole && matchStatus
  })

  // Pagination Slice
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Handlers
  const handleToggleLock = async (displayId) => {
    const userToUpdate = users.find(u => u.displayId === displayId)
    if (!userToUpdate) return
    const isLocked = userToUpdate.status?.toLowerCase() === 'locked' || userToUpdate.status?.toLowerCase() === 'rejected'
    const nextStatus = isLocked ? 'APPROVED' : 'REJECTED'

    try {
      const updated = await adminAccountService.updateAccount(userToUpdate.role, userToUpdate.id, {
        ...userToUpdate,
        status: nextStatus
      })
      const nextUser = updated
        ? {
          ...updated,
          dob: updated.birthDate || updated.dob || userToUpdate.dob,
          joined: userToUpdate.joined,
          displayId: displayId,
          status: updated.status === 'APPROVED' ? 'ACTIVE' : (updated.status === 'REJECTED' ? 'LOCKED' : updated.status)
        }
        : { ...userToUpdate, status: nextStatus === 'APPROVED' ? 'ACTIVE' : (nextStatus === 'REJECTED' ? 'LOCKED' : nextStatus) }
      setUsers(users.map(u => u.displayId === displayId ? nextUser : u))
      if (selectedUser && selectedUser.displayId === displayId) {
        setSelectedUser(nextUser)
      }
    } catch (err) {
      alert("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  const handleApproveUser = async (displayId) => {
    const userToUpdate = users.find(u => u.displayId === displayId)
    if (!userToUpdate) return

    try {
      const updated = await adminAccountService.updateAccount(userToUpdate.role, userToUpdate.id, {
        ...userToUpdate,
        status: 'APPROVED'
      })

      const approvalDate = new Date().toISOString()
      const approvalDateString = new Date(approvalDate).toLocaleDateString('vi-VN')

      try {
        const historyList = JSON.parse(localStorage.getItem('registered_users_history') || '[]')
        const matchedIdx = historyList.findIndex(h =>
          (h.id && h.id === userToUpdate.id && h.role === userToUpdate.role) ||
          (h.email && userToUpdate.email && h.email.toLowerCase() === userToUpdate.email.toLowerCase())
        )
        if (matchedIdx !== -1) {
          historyList[matchedIdx].joined = approvalDate
          historyList[matchedIdx].approved = true
        } else {
          historyList.push({
            id: userToUpdate.id,
            email: userToUpdate.email,
            userName: userToUpdate.userName,
            name: userToUpdate.fullName || userToUpdate.name,
            joined: approvalDate,
            approved: true
          })
        }
        localStorage.setItem('registered_users_history', JSON.stringify(historyList))
      } catch (_) {}

      const nextUser = updated
        ? {
          ...updated,
          dob: updated.birthDate || updated.dob || userToUpdate.dob,
          joined: approvalDateString,
          rawJoined: approvalDate,
          displayId: displayId,
          status: 'ACTIVE'
        }
        : { ...userToUpdate, status: 'ACTIVE', joined: approvalDateString, rawJoined: approvalDate }

      setUsers(users.map(u => u.displayId === displayId ? nextUser : u))
      if (selectedUser && selectedUser.displayId === displayId) {
        setSelectedUser(nextUser)
      }
      alert("Phê duyệt tài khoản thành công!")
    } catch (err) {
      alert("Phê duyệt thất bại: " + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteUser = async (displayId) => {
    const userToDelete = users.find(u => u.displayId === displayId)
    if (!userToDelete) return
    const nameVal = userToDelete.fullName || userToDelete.name || ''
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${nameVal}" không?`)) return

    try {
      await adminAccountService.deleteAccount(userToDelete.role, userToDelete.id)
      setUsers(users.filter(u => u.displayId !== displayId))
      if (selectedUser && selectedUser.displayId === displayId) {
        setSelectedUser(null)
      }
      alert("Xóa tài khoản thành công!")
    } catch (err) {
      alert("Xóa tài khoản thất bại: " + (err.response?.data || err.message))
    }
  }

  return (
    <div className="user-mgmt-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Tài khoản</h1>
          <p className="admin-page-sub">Quản lý danh sách tài khoản người dùng, khóa và đổi vai trò trực tuyến</p>
        </div>
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
          <option value="HORSE_OWNER">HORSE OWNER</option>
          <option value="JOCKEY">JOCKEY</option>
          <option value="REFEREE">REFEREE</option>
          <option value="SPECTATOR">SPECTATOR</option>
        </select>
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Tất cả Trạng thái</option>
          <option value="pending">Chờ phê duyệt</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
        <select className="admin-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="NEWEST">Sắp xếp: Mới nhất</option>
          <option value="OLDEST">Sắp xếp: Cũ nhất</option>
        </select>
        <span style={{ 
          fontSize: '13px', 
          color: '#d4af37', 
          fontWeight: 600, 
          marginLeft: 'auto', 
          alignSelf: 'center', 
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.2)',
          padding: '6px 12px',
          borderRadius: '6px',
          whiteSpace: 'nowrap'
        }}>
          Tổng: {filtered.length} tài khoản
        </span>
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
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.displayId}>
                        <td>#{u.displayId}</td>
                        <td>{u.fullName || u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td><span className="admin-badge admin-badge--gold">{u.role === 'RACE_REFEREE' ? 'REFEREE' : u.role}</span></td>
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
                            {u.status?.toLowerCase() === 'pending' ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--success admin-btn--sm"
                                onClick={() => handleApproveUser(u.displayId)}
                              >
                                Duyệt
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`admin-btn admin-btn--sm ${u.status?.toLowerCase() === 'locked' ? 'admin-btn--success' : 'admin-btn--danger'}`}
                                onClick={() => handleToggleLock(u.displayId)}
                              >
                                {u.status?.toLowerCase() === 'locked' ? 'Mở khóa' : 'Khóa'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger admin-btn--sm"
                              onClick={() => handleDeleteUser(u.displayId)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                    Trang {currentPage} / {totalPages}
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
                <dd>
                  {selectedUser.dob
                    ? (() => {
                      try {
                        const d = new Date(selectedUser.dob);
                        return isNaN(d.getTime()) ? selectedUser.dob : d.toLocaleDateString('vi-VN');
                      } catch (e) {
                        return selectedUser.dob;
                      }
                    })()
                    : '—'}
                </dd>
                <dt>Role</dt>
                <dd style={{ color: '#fff', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>
                  <span className="admin-badge admin-badge--gold" style={{ display: 'inline-block', padding: '4px 10px', textTransform: 'uppercase' }}>
                    {selectedUser.role === 'RACE_REFEREE' ? 'REFEREE' : selectedUser.role}
                  </span>
                </dd>
                <dt>Trạng thái</dt>
                <dd><StatusBadge status={selectedUser.status} /></dd>
                <dt>Ngày tham gia</dt>
                <dd>{selectedUser.joined || '—'}</dd>

                {selectedUser.role === 'JOCKEY' && (
                  <>
                    <dt>Kinh nghiệm</dt>
                    <dd>{selectedUser.experienceYears !== undefined && selectedUser.experienceYears !== null ? `${selectedUser.experienceYears} năm` : '—'}</dd>
                    <dt>Số bằng lái</dt>
                    <dd>{selectedUser.licenseNumber || '—'}</dd>
                  </>
                )}

                {(selectedUser.role === 'REFEREE' || selectedUser.role === 'RACE_REFEREE') && (
                  <>
                    <dt>Kinh nghiệm</dt>
                    <dd>{selectedUser.experienceYears !== undefined && selectedUser.experienceYears !== null ? `${selectedUser.experienceYears} năm` : '—'}</dd>
                    <dt>Cấp độ chứng chỉ</dt>
                    <dd>{selectedUser.certificateLevel || '—'}</dd>
                  </>
                )}

                {(selectedUser.role === 'HORSE_OWNER' || selectedUser.role === 'HORSE OWNER' || selectedUser.role === 'OWNER') && (
                  <>
                    <dt>Địa chỉ</dt>
                    <dd>{selectedUser.address || '—'}</dd>
                  </>
                )}
              </dl>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                {selectedUser.status?.toLowerCase() === 'pending' ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--success"
                    style={{ flex: 1 }}
                    onClick={() => handleApproveUser(selectedUser.displayId)}
                  >
                    Phê duyệt
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`admin-btn ${selectedUser.status?.toLowerCase() === 'locked' ? 'admin-btn--success' : 'admin-btn--danger'}`}
                    style={{ flex: 1 }}
                    onClick={() => handleToggleLock(selectedUser.displayId)}
                  >
                    {selectedUser.status?.toLowerCase() === 'locked' ? 'Mở khóa' : 'Khóa'}
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={() => handleDeleteUser(selectedUser.displayId)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
