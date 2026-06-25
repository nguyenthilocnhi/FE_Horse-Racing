import React, { useState } from 'react'
import { violations } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './ViolationManagement.css'

export default function ViolationManagement() {
  const [violationList, setViolationList] = useState(violations)
  const [selected, setSelected] = useState(null)

  const handleUpdateViolationStatus = (id, newStatus) => {
    const updated = violationList.map(v => 
      v.id === id ? { ...v, status: newStatus } : v
    )
    setViolationList(updated)
    if (selected && selected.id === id) {
      setSelected({ ...selected, status: newStatus })
    }
  }

  return (
    <div className="violation-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Vi phạm</h1>
          <p className="admin-page-sub">Theo dõi và xử lý các vi phạm trong giải đấu</p>
        </div>
      </div>

      <div className="violation-layout">
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Đối tượng</th>
                  <th>Race</th>
                  <th>Mức độ</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {violationList.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.type}</td>
                    <td>{v.entity}</td>
                    <td>{v.race}</td>
                    <td><StatusBadge status={v.severity} /></td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>
                      <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(v)}>Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="admin-card violation-detail">
            <div className="admin-card-head">
              <h3>Chi tiết vi phạm</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <dl className="violation-dl">
                <dt>Mã</dt><dd>{selected.id}</dd>
                <dt>Loại vi phạm</dt><dd>{selected.type}</dd>
                <dt>Đối tượng</dt><dd>{selected.entity}</dd>
                <dt>Race</dt><dd>{selected.race}</dd>
                <dt>Ngày</dt><dd>{selected.date}</dd>
                <dt>Mức độ</dt><dd><StatusBadge status={selected.severity} /></dd>
                <dt>Trạng thái</dt>
                <dd style={{ marginTop: '4px' }}>
                  <select
                    className="admin-select"
                    value={selected.status}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', minWidth: 'auto' }}
                    onChange={(e) => handleUpdateViolationStatus(selected.id, e.target.value)}
                  >
                    <option value="pending">Chờ xử lý (Pending)</option>
                    <option value="investigating">Đang điều tra (Investigating)</option>
                    <option value="resolved">Đã giải quyết (Resolved)</option>
                    <option value="dismissed">Bỏ qua (Dismissed)</option>
                  </select>
                </dd>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
