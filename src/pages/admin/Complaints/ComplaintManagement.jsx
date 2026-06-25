import React, { useState } from 'react'
import { complaints as initialComplaints } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './ComplaintManagement.css'

export default function ComplaintManagement() {
  const [complaintList, setComplaintList] = useState(() => {
    const stored = localStorage.getItem('mock_complaints')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    localStorage.setItem('mock_complaints', JSON.stringify(initialComplaints))
    return initialComplaints
  })
  const [selected, setSelected] = useState(null)

  const handleUpdateStatus = (id, newStatus) => {
    const updated = complaintList.map(c => 
      c.id === id ? { ...c, status: newStatus } : c
    )
    setComplaintList(updated)
    localStorage.setItem('mock_complaints', JSON.stringify(updated))
    if (selected && selected.id === id) {
      setSelected({ ...selected, status: newStatus })
    }
    alert(newStatus === 'resolved' ? 'Đã duyệt/giải quyết khiếu nại!' : 'Đã từ chối khiếu nại!')
  }

  return (
    <div className="complaint-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Khiếu nại</h1>
          <p className="admin-page-sub">Xử lý khiếu nại từ người tham gia và khán giả</p>
        </div>
      </div>

      <div className="complaint-list">
        {complaintList.map((c) => (
          <div key={c.id} className={`admin-card complaint-card${selected?.id === c.id ? ' complaint-card--active' : ''}`}>
            <div className="complaint-card-main" onClick={() => setSelected(c)} role="button" tabIndex={0} onKeyDown={() => setSelected(c)}>
              <div className="complaint-card-top">
                <span>{c.id}</span>
                <StatusBadge status={c.status} />
              </div>
              <h3>{c.subject}</h3>
              <p>Từ: {c.from} · Race: {c.race} · {c.date}</p>
            </div>
            {selected?.id === c.id && c.status !== 'resolved' && c.status !== 'rejected' && c.status !== 'dismissed' && (
              <div className="complaint-actions">
                <button 
                  type="button" 
                  className="admin-btn admin-btn--success admin-btn--sm"
                  onClick={() => handleUpdateStatus(c.id, 'resolved')}
                >
                  Giải quyết (Approve)
                </button>
                <button 
                  type="button" 
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  onClick={() => handleUpdateStatus(c.id, 'rejected')}
                >
                  Từ chối (Reject)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
