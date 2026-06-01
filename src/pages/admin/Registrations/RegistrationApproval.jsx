import React, { useState } from 'react'
import { registrations } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RegistrationApproval.css'

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function RegistrationApproval() {
  const [tab, setTab] = useState('pending')

  const filtered = tab === 'all'
    ? registrations
    : registrations.filter((r) => r.status === tab)

  return (
    <div className="registration-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Duyệt Đăng ký</h1>
          <p className="admin-page-sub">Phê duyệt đăng ký ngựa tham gia cuộc đua</p>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã ĐK</th>
                <th>Ngựa</th>
                <th>Chủ stables</th>
                <th>Race</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td><strong>{r.horse}</strong></td>
                  <td>{r.owner}</td>
                  <td>{r.race}</td>
                  <td>{r.submitted}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === 'pending' && (
                      <div className="admin-table-actions">
                        <button type="button" className="admin-btn admin-btn--success admin-btn--sm">Approve</button>
                        <button type="button" className="admin-btn admin-btn--danger admin-btn--sm">Reject</button>
                      </div>
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
