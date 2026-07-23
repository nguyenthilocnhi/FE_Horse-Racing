import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { mockRaceTracks } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import {
  getAllRaceTracks,
  createRaceTrack,
  updateRaceTrack,
  deleteRaceTrack
} from '../../../services/adminService'
import './RaceTrackManagement.css'

export default function RaceTrackManagement() {
  const { searchQuery = '' } = useOutletContext() || {}

  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)

  // Filters & Search
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingTrack, setEditingTrack] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null) // Detail modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    surface: 'Cỏ (Turf)',
    length: 1500,
    capacity: 10000,
    status: 'active',
    description: ''
  })

  // Toast Notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  // Load Race Tracks
  const fetchTracks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllRaceTracks()
      const data = res?.data || res
      if (Array.isArray(data) && data.length > 0) {
        setTracks(data)
      } else {
        setTracks(mockRaceTracks)
      }
    } catch (err) {
      console.warn('API fetch failed, falling back to mock data:', err)
      setTracks(mockRaceTracks)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks()
  }, [])

  // Combined search term
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()

  // Filtered tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      !effectiveSearch ||
      (track.name && track.name.toLowerCase().includes(effectiveSearch)) ||
      (track.location && track.location.toLowerCase().includes(effectiveSearch)) ||
      (track.surface && track.surface.toLowerCase().includes(effectiveSearch))

    const matchesStatus =
      statusFilter === 'all' || track.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handlers for Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingTrack(null)
    setFormData({
      name: '',
      location: '',
      surface: 'Cỏ (Turf)',
      length: 1500,
      capacity: 10000,
      status: 'active',
      description: ''
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (track) => {
    setEditingTrack(track)
    setFormData({
      name: track.name || '',
      location: track.location || '',
      surface: track.surface || 'Cỏ (Turf)',
      length: track.length || 1500,
      capacity: track.capacity || 10000,
      status: track.status || 'active',
      description: track.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên trường đua')
      return
    }

    const payload = {
      ...formData,
      length: Number(formData.length),
      capacity: Number(formData.capacity)
    }

    try {
      if (editingTrack) {
        // Update API
        try {
          await updateRaceTrack(editingTrack.id, payload)
        } catch (err) {
          console.warn('API update failed, updating locally', err)
        }

        setTracks((prev) =>
          prev.map((t) => (t.id === editingTrack.id ? { ...t, ...payload } : t))
        )
        showToast(`Đã cập nhật trường đua "${formData.name}" thành công!`)
      } else {
        // Create API
        let newTrack = { id: Date.now(), ...payload }
        try {
          const res = await createRaceTrack(payload)
          if (res && res.id) newTrack = res
        } catch (err) {
          console.warn('API create failed, creating locally', err)
        }

        setTracks((prev) => [newTrack, ...prev])
        showToast(`Đã thêm trường đua "${formData.name}" thành công!`)
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
      showToast('Có lỗi xảy ra khi lưu trường đua', 'error')
    }
  }

  // Delete Track Handler
  const handleDelete = async (id) => {
    try {
      try {
        await deleteRaceTrack(id)
      } catch (err) {
        console.warn('API delete failed, deleting locally', err)
      }

      setTracks((prev) => prev.filter((t) => t.id !== id))
      setDeleteConfirmId(null)
      showToast('Đã xóa trường đua thành công!')
    } catch (err) {
      console.error(err)
      showToast('Có lỗi xảy ra khi xóa trường đua', 'error')
    }
  }

  // Calculate Stats
  const totalTracks = tracks.length
  const activeTracks = tracks.filter((t) => t.status === 'active').length
  const maintenanceTracks = tracks.filter((t) => t.status === 'maintenance').length
  const totalCapacity = tracks.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0)

  return (
    <div className="racetrack-management">
      {/* Toast Notification */}
      {notification && (
        <div className={`admin-toast admin-toast--${notification.type}`}>
          {notification.type === 'error' ? '❌' : '✅'} {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Trường đua</h1>
          <p className="admin-page-sub">
            Quản lý thông tin, mặt sân, sức chứa và trạng thái hoạt động của các trường đua
          </p>
        </div>
        <button
          className="admin-btn admin-btn--gold"
          onClick={handleOpenAddModal}
        >
          <span>+</span> Thêm trường đua mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}>
            ⛖
          </div>
          <div>
            <div className="admin-stat-card__val">{totalTracks}</div>
            <div className="admin-stat-card__lbl">Tổng trường đua</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>
            ✓
          </div>
          <div>
            <div className="admin-stat-card__val">{activeTracks}</div>
            <div className="admin-stat-card__lbl">Đang hoạt động</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
            🛠
          </div>
          <div>
            <div className="admin-stat-card__val">{maintenanceTracks}</div>
            <div className="admin-stat-card__lbl">Đang bảo trì</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
            👥
          </div>
          <div>
            <div className="admin-stat-card__val">{totalCapacity.toLocaleString('vi-VN')}</div>
            <div className="admin-stat-card__lbl">Tổng sức chứa (chỗ)</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="racetrack-filter-bar">
        <div className="racetrack-search-box">
          <span className="racetrack-search-icon">🔍</span>
          <input
            type="text"
            className="racetrack-input"
            placeholder="Tìm theo tên trường đua, địa điểm, mặt sân..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              className="racetrack-clear-btn"
              onClick={() => setLocalSearch('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="racetrack-filters">
          <label className="racetrack-filter-label">Trạng thái:</label>
          <select
            className="racetrack-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Content Table / Loading / Empty */}
      {loading ? (
        <div className="racetrack-loading">
          <div className="racetrack-spinner"></div>
          <span>Đang tải danh sách trường đua...</span>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="racetrack-empty">
          <div className="racetrack-empty-icon">🏟</div>
          <h3>Không tìm thấy trường đua nào</h3>
          <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        </div>
      ) : (
        <div className="racetrack-table-wrapper">
          <table className="racetrack-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Trường Đua</th>
                <th>Địa Điểm</th>
                <th>Mặt Sân</th>
                <th>Chiều Dài (m)</th>
                <th>Sức Chứa</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((track) => (
                <tr key={track.id}>
                  <td className="racetrack-id">#{track.id}</td>
                  <td className="racetrack-name">
                    <strong
                      onClick={() => setSelectedTrack(track)}
                      className="racetrack-clickable-title"
                    >
                      {track.name}
                    </strong>
                    {track.description && (
                      <span className="racetrack-desc-sub">
                        {track.description}
                      </span>
                    )}
                  </td>
                  <td>{track.location || 'N/A'}</td>
                  <td>
                    <span className="racetrack-surface-pill">
                      🌱 {track.surface || 'Cỏ (Turf)'}
                    </span>
                  </td>
                  <td>
                    <strong>{track.length ? `${track.length} m` : '1500 m'}</strong>
                  </td>
                  <td>
                    {track.capacity ? `${Number(track.capacity).toLocaleString('vi-VN')} chỗ` : 'N/A'}
                  </td>
                  <td>
                    <StatusBadge status={track.status || 'active'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="racetrack-actions">
                      <button
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        onClick={() => setSelectedTrack(track)}
                        title="Xem chi tiết"
                      >
                        👁 Xem
                      </button>
                      <button
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        onClick={() => handleOpenEditModal(track)}
                        title="Sửa"
                      >
                        ✏ Sửa
                      </button>
                      <button
                        className="admin-btn admin-btn--danger admin-btn--sm"
                        onClick={() => setDeleteConfirmId(track.id)}
                        title="Xóa"
                      >
                        🗑 Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>{editingTrack ? 'Cập Nhật Trường Đua' : 'Thêm Trường Đua Mới'}</h2>
              <button
                className="admin-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal-body">
              <div className="racetrack-form-grid">
                <div className="racetrack-form-group racetrack-col-full">
                  <label className="racetrack-form-label">
                    Tên Trường Đua <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="racetrack-input"
                    placeholder="VD: Trường đua Phú Thọ"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="racetrack-form-group racetrack-col-full">
                  <label className="racetrack-form-label">Địa Điểm / Tỉnh Thành</label>
                  <input
                    type="text"
                    className="racetrack-input"
                    placeholder="VD: Quận 11, TP. Hồ Chí Minh"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div className="racetrack-form-group">
                  <label className="racetrack-form-label">Loại Mặt Sân</label>
                  <select
                    className="racetrack-select"
                    value={formData.surface}
                    onChange={(e) =>
                      setFormData({ ...formData, surface: e.target.value })
                    }
                  >
                    <option value="Cỏ (Turf)">Cỏ (Turf)</option>
                    <option value="Cát (Dirt)">Cát (Dirt)</option>
                    <option value="Tổng hợp (Synthetic)">Tổng hợp (Synthetic)</option>
                    <option value="Trong nhà (Indoor)">Trong nhà (Indoor)</option>
                  </select>
                </div>

                <div className="racetrack-form-group">
                  <label className="racetrack-form-label">Trạng Thái</label>
                  <select
                    className="racetrack-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Đang hoạt động (Active)</option>
                    <option value="maintenance">Đang bảo trì (Maintenance)</option>
                    <option value="inactive">Tạm ngưng (Inactive)</option>
                  </select>
                </div>

                <div className="racetrack-form-group">
                  <label className="racetrack-form-label">Chiều Dài (mét)</label>
                  <input
                    type="number"
                    className="racetrack-input"
                    min="500"
                    max="5000"
                    step="50"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                  />
                </div>

                <div className="racetrack-form-group">
                  <label className="racetrack-form-label">Sức Chứa Khán Đài</label>
                  <input
                    type="number"
                    className="racetrack-input"
                    min="0"
                    step="100"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>

                <div className="racetrack-form-group racetrack-col-full">
                  <label className="racetrack-form-label">Mô Tả / Ghi Chú</label>
                  <textarea
                    className="racetrack-textarea"
                    rows="3"
                    placeholder="Nhập thông tin chi tiết về cơ sở vật chất, đặc điểm..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>

              <div className="admin-modal-foot">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setShowModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn--gold">
                  {editingTrack ? 'Lưu Thay Đổi' : 'Thêm Trường Đua'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail View */}
      {selectedTrack && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTrack(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Chi Tiết Trường Đua #{selectedTrack.id}</h2>
              <button
                className="admin-modal-close"
                onClick={() => setSelectedTrack(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="racetrack-detail-card">
                <h3 className="racetrack-detail-title">{selectedTrack.name}</h3>
                <div className="racetrack-detail-grid">
                  <div>
                    <span className="racetrack-detail-lbl">Địa điểm:</span>
                    <strong>{selectedTrack.location || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span className="racetrack-detail-lbl">Mặt sân:</span>
                    <strong>{selectedTrack.surface || 'Cỏ (Turf)'}</strong>
                  </div>
                  <div>
                    <span className="racetrack-detail-lbl">Chiều dài:</span>
                    <strong>{selectedTrack.length ? `${selectedTrack.length}m` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="racetrack-detail-lbl">Sức chứa:</span>
                    <strong>{selectedTrack.capacity ? `${Number(selectedTrack.capacity).toLocaleString('vi-VN')} chỗ` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="racetrack-detail-lbl">Trạng thái:</span>
                    <StatusBadge status={selectedTrack.status || 'active'} />
                  </div>
                </div>
                {selectedTrack.description && (
                  <div className="racetrack-detail-desc">
                    <span className="racetrack-detail-lbl">Mô tả:</span>
                    <p>{selectedTrack.description}</p>
                  </div>
                )}
              </div>

              <div className="admin-modal-foot">
                <button
                  className="admin-btn admin-btn--outline"
                  onClick={() => {
                    const trk = selectedTrack
                    setSelectedTrack(null)
                    handleOpenEditModal(trk)
                  }}
                >
                  ✏ Chỉnh Sửa
                </button>
                <button
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setSelectedTrack(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {deleteConfirmId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="admin-modal admin-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Xác Nhận Xóa</h2>
              <button
                className="admin-modal-close"
                onClick={() => setDeleteConfirmId(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Bạn có chắc chắn muốn xóa trường đua này không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="admin-modal-foot">
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => setDeleteConfirmId(null)}
              >
                Hủy
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
