import React, { useState } from 'react'
import { complaints } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './ComplaintManagement.css'

export default function ComplaintManagement() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="complaint-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Khiếu nại</h1>
          <p className="admin-page-sub">Xử lý khiếu nại từ người tham gia và khán giả</p>
        </div>
      </div>

      <div className="complaint-list">
        {complaints.map((c) => (
          <div key={c.id} className={`admin-card complaint-card${selected?.id === c.id ? ' complaint-card--active' : ''}`}>
            <div className="complaint-card-main" onClick={() => setSelected(c)} role="button" tabIndex={0} onKeyDown={() => setSelected(c)}>
              <div className="complaint-card-top">
                <span>{c.id}</span>
                <StatusBadge status={c.status} />
              </div>
              <h3>{c.subject}</h3>
              <p>Từ: {c.from} · Race: {c.race} · {c.date}</p>
            </div>
            {selected?.id === c.id && (
              <div className="complaint-actions">
                <button type="button" className="admin-btn admin-btn--success admin-btn--sm">Approve</button>
                <button type="button" className="admin-btn admin-btn--danger admin-btn--sm">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
