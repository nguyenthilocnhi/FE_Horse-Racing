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

const SURFACE_ICONS = {
  'Cỏ (Turf)': '🌱',
  'Cát (Dirt)': '🏜️',
  'Tổng hợp (Synthetic)': '⚡',
  'Trong nhà (Indoor)': '🏢'
}

export default function RaceTrackManagement() {
  const { searchQuery = '' } = useOutletContext() || {}

  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  // Filters & Search
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [surfaceFilter, setSurfaceFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = viewMode === 'grid' ? 6 : 10

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [editingTrack, setEditingTrack] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null)
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
    try {
      const res = await getAllRaceTracks()
      const data = res?.data || res
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          id: item.id,
          name: item.name,
          location: item.location,
          surface: item.surface || item.surfaceType || 'Cỏ (Turf)',
          surfaceType: item.surfaceType || item.surface || 'Cỏ (Turf)',
          length: item.length || item.lengthMeters || 1500,
          lengthMeters: item.lengthMeters || item.length || 1500,
          capacity: Number(item.capacity) || 10000,
          status: item.status || 'active',
          description: item.description || ''
        }))
        setTracks(formatted)
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

  useEffect(() => {
    setCurrentPage(1)
  }, [localSearch, searchQuery, statusFilter, surfaceFilter, viewMode])

  // Combined search term
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()

  // Filtered tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      !effectiveSearch ||
      (track.name && track.name.toLowerCase().includes(effectiveSearch)) ||
      (track.location && track.location.toLowerCase().includes(effectiveSearch)) ||
      (track.surface && track.surface.toLowerCase().includes(effectiveSearch))

    const matchesStatus = statusFilter === 'all' || track.status === statusFilter

    const matchesSurface =
      surfaceFilter === 'all' ||
      (track.surface && track.surface.toLowerCase().includes(surfaceFilter.toLowerCase()))

    return matchesSearch && matchesStatus && matchesSurface
  })

  // Pagination Slice
  const totalPages = Math.ceil(filteredTracks.length / pageSize)
  const paginatedTracks = filteredTracks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
      name: formData.name,
      location: formData.location,
      surfaceType: formData.surface,
      lengthMeters: Number(formData.length),
      description: formData.description || ''
    }

    try {
      if (editingTrack) {
        try {
          const res = await updateRaceTrack(editingTrack.id, payload)
          const updatedData = res?.data || res
          if (updatedData && (updatedData.id || updatedData.name)) {
            setTracks((prev) =>
              prev.map((t) =>
                t.id === editingTrack.id
                  ? {
                      ...t,
                      name: updatedData.name || formData.name,
                      location: updatedData.location || formData.location,
                      surface: updatedData.surfaceType || formData.surface,
                      surfaceType: updatedData.surfaceType || formData.surface,
                      length: updatedData.lengthMeters || Number(formData.length),
                      lengthMeters: updatedData.lengthMeters || Number(formData.length),
                      description: updatedData.description ?? formData.description,
                      capacity: Number(formData.capacity),
                      status: formData.status
                    }
                  : t
              )
            )
          } else {
            setTracks((prev) =>
              prev.map((t) => (t.id === editingTrack.id ? { ...t, ...formData, length: Number(formData.length), capacity: Number(formData.capacity) } : t))
            )
          }
        } catch (err) {
          console.warn('API update failed, updating locally', err)
          setTracks((prev) =>
            prev.map((t) => (t.id === editingTrack.id ? { ...t, ...formData, length: Number(formData.length), capacity: Number(formData.capacity) } : t))
          )
        }

        showToast(`Đã cập nhật trường đua "${formData.name}" thành công!`)
      } else {
        let newTrack = {
          id: Date.now(),
          ...formData,
          length: Number(formData.length),
          capacity: Number(formData.capacity)
        }
        try {
          const res = await createRaceTrack(payload)
          const trackData = res?.data || res
          if (trackData && (trackData.id || trackData.name)) {
            newTrack = {
              id: trackData.id || Date.now(),
              name: trackData.name || formData.name,
              location: trackData.location || formData.location,
              surface: trackData.surfaceType || formData.surface,
              length: trackData.lengthMeters || Number(formData.length),
              capacity: Number(formData.capacity) || 10000,
              status: formData.status || 'active',
              description: trackData.description ?? formData.description
            }
          }
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
      <div className="admin-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="admin-page-title">Quản lý Trường đua</h1>
          <p className="admin-page-sub">
            Quản lý cơ sở vật chất, mặt sân, sức chứa và trạng thái hoạt động các trường đua đua ngựa
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
      <div className="racetrack-stat-grid">
        <div className="racetrack-stat-card">
          <div className="racetrack-stat-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}>
            🏟️
          </div>
          <div>
            <div className="racetrack-stat-val">{totalTracks}</div>
            <div className="racetrack-stat-lbl">Tổng trường đua</div>
          </div>
        </div>

        <div className="racetrack-stat-card">
          <div className="racetrack-stat-icon" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>
            🟢
          </div>
          <div>
            <div className="racetrack-stat-val">{activeTracks}</div>
            <div className="racetrack-stat-lbl">Đang hoạt động</div>
          </div>
        </div>

        <div className="racetrack-stat-card">
          <div className="racetrack-stat-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
            🛠️
          </div>
          <div>
            <div className="racetrack-stat-val">{maintenanceTracks}</div>
            <div className="racetrack-stat-lbl">Đang bảo trì</div>
          </div>
        </div>

        <div className="racetrack-stat-card">
          <div className="racetrack-stat-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
            👥
          </div>
          <div>
            <div className="racetrack-stat-val">{totalCapacity.toLocaleString('vi-VN')}</div>
            <div className="racetrack-stat-lbl">Tổng sức chứa (khán đài)</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Control Bar */}
      <div className="racetrack-filter-bar">
        <div className="racetrack-search-box">
          <span className="racetrack-search-icon">🔍</span>
          <input
            type="text"
            className="racetrack-input"
            placeholder="Tìm theo tên trường đua, địa điểm, loại mặt sân..."
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

        <div className="racetrack-filters-group">
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

          <select
            className="racetrack-select"
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value)}
          >
            <option value="all">Tất cả mặt sân</option>
            <option value="Turf">Cỏ (Turf)</option>
            <option value="Dirt">Cát (Dirt)</option>
            <option value="Synthetic">Tổng hợp (Synthetic)</option>
            <option value="Indoor">Trong nhà (Indoor)</option>
          </select>

          <div className="racetrack-view-switch">
            <button
              type="button"
              className={`racetrack-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Dạng Thẻ"
            >
              🎴 Thẻ
            </button>
            <button
              type="button"
              className={`racetrack-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dạng Bảng"
            >
              📄 Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Loading / Empty / Grid / Table */}
      {loading ? (
        <div className="racetrack-loading">
          <div className="racetrack-spinner"></div>
          <span>Đang tải dữ liệu trường đua...</span>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="racetrack-empty">
          <div className="racetrack-empty-icon">🏟️</div>
          <h3>Không tìm thấy trường đua nào</h3>
          <p>Thử tìm kiếm với từ khóa khác hoặc lập lại bộ lọc.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <>
          <div className="racetrack-cards-grid">
            {paginatedTracks.map((track) => (
              <div className="racetrack-card" key={track.id}>
                <div className="racetrack-card-header">
                  <div>
                    <h3
                      className="racetrack-card-title"
                      onClick={() => setSelectedTrack(track)}
                    >
                      {track.name}
                    </h3>
                    <div className="racetrack-card-location">
                      📍 {track.location || 'Chưa cập nhật địa điểm'}
                    </div>
                  </div>
                  <StatusBadge status={track.status || 'active'} />
                </div>

                <div className="racetrack-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="racetrack-surface-tag">
                      {SURFACE_ICONS[track.surface] || '🌱'} {track.surface || 'Cỏ (Turf)'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#d4af37', fontWeight: 600 }}>
                      #{track.id}
                    </span>
                  </div>

                  <div className="racetrack-card-specs">
                    <div className="racetrack-spec-item">
                      <span className="racetrack-spec-label">Chiều Dài</span>
                      <span className="racetrack-spec-val">{track.length ? `${track.length} m` : '1,500 m'}</span>
                    </div>
                    <div className="racetrack-spec-item">
                      <span className="racetrack-spec-label">Sức Chứa</span>
                      <span className="racetrack-spec-val">
                        {track.capacity ? `${Number(track.capacity).toLocaleString('vi-VN')} chỗ` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {track.description && (
                    <p className="racetrack-card-desc">{track.description}</p>
                  )}
                </div>

                <div className="racetrack-card-footer">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--sm"
                    onClick={() => setSelectedTrack(track)}
                  >
                    👁 Xem
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--sm"
                    onClick={() => handleOpenEditModal(track)}
                  >
                    ✏ Sửa
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={() => setDeleteConfirmId(track.id)}
                  >
                    🗑 Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="admin-btn admin-btn--outline admin-btn--sm"
              >
                ◀ Trước
              </button>
              <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>
                Trang {currentPage} / {totalPages} ({filteredTracks.length} trường đua)
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="admin-btn admin-btn--outline admin-btn--sm"
              >
                Sau ▶
              </button>
            </div>
          )}
        </>
      ) : (
        /* TABLE LIST VIEW */
        <>
          <div className="racetrack-table-wrapper">
            <table className="racetrack-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Trường Đua</th>
                  <th>Địa Điểm</th>
                  <th>Loại Mặt Sân</th>
                  <th>Chiều Dài (m)</th>
                  <th>Sức Chứa Khán Đài</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTracks.map((track) => (
                  <tr key={track.id}>
                    <td className="racetrack-id">#{track.id}</td>
                    <td>
                      <strong
                        onClick={() => setSelectedTrack(track)}
                        className="racetrack-clickable-title"
                      >
                        {track.name}
                      </strong>
                    </td>
                    <td>{track.location || 'Chưa cập nhật'}</td>
                    <td>
                      <span className="racetrack-surface-tag" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        {SURFACE_ICONS[track.surface] || '🌱'} {track.surface || 'Cỏ (Turf)'}
                      </span>
                    </td>
                    <td>
                      <strong>{track.length ? `${track.length}m` : '1500m'}</strong>
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
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => setSelectedTrack(track)}
                        >
                          👁 Xem
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => handleOpenEditModal(track)}
                        >
                          ✏ Sửa
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          onClick={() => setDeleteConfirmId(track.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px'
            }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="admin-btn admin-btn--outline admin-btn--sm"
              >
                ◀ Trước
              </button>
              <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>
                Trang {currentPage} / {totalPages} ({filteredTracks.length} trường đua)
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="admin-btn admin-btn--outline admin-btn--sm"
              >
                Sau ▶
              </button>
            </div>
          )}
        </>
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
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
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
                      <option value="Cỏ (Turf)">🌱 Cỏ (Turf)</option>
                      <option value="Cát (Dirt)">🏜️ Cát (Dirt)</option>
                      <option value="Tổng hợp (Synthetic)">⚡ Tổng hợp (Synthetic)</option>
                      <option value="Trong nhà (Indoor)">🏢 Trong nhà (Indoor)</option>
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
              <h3 className="racetrack-detail-title">{selectedTrack.name}</h3>
              <div className="racetrack-detail-grid">
                <div>
                  <span className="racetrack-detail-lbl">Địa điểm:</span>
                  <strong>{selectedTrack.location || 'Chưa cập nhật'}</strong>
                </div>
                <div>
                  <span className="racetrack-detail-lbl">Mặt sân:</span>
                  <strong>{SURFACE_ICONS[selectedTrack.surface] || '🌱'} {selectedTrack.surface || 'Cỏ (Turf)'}</strong>
                </div>
                <div>
                  <span className="racetrack-detail-lbl">Chiều dài đường đua:</span>
                  <strong>{selectedTrack.length ? `${selectedTrack.length}m` : 'N/A'}</strong>
                </div>
                <div>
                  <span className="racetrack-detail-lbl">Sức chứa khán đài:</span>
                  <strong>{selectedTrack.capacity ? `${Number(selectedTrack.capacity).toLocaleString('vi-VN')} chỗ` : 'N/A'}</strong>
                </div>
                <div>
                  <span className="racetrack-detail-lbl">Trạng thái:</span>
                  <StatusBadge status={selectedTrack.status || 'active'} />
                </div>
              </div>

              {selectedTrack.description && (
                <div className="racetrack-detail-desc">
                  <span className="racetrack-detail-lbl">Mô tả chi tiết:</span>
                  <p style={{ margin: '4px 0 0' }}>{selectedTrack.description}</p>
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
              <p style={{ color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa trường đua này không? Hành động này không thể hoàn tác.
              </p>
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
