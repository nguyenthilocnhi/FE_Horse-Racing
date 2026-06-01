import React, { useState } from 'react'
import { auditLogs } from '../../../data/adminMockData'
import './AuditLog.css'

export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState('ALL')

  const actions = ['ALL', ...new Set(auditLogs.map((l) => l.action))]
  const filtered = actionFilter === 'ALL'
    ? auditLogs
    : auditLogs.filter((l) => l.action === actionFilter)

  return (
    <div className="audit-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Audit Log</h1>
          <p className="admin-page-sub">Lịch sử hoạt động của Admin trên hệ thống</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <select className="admin-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          {actions.map((a) => (
            <option key={a} value={a}>{a === 'ALL' ? 'Tất cả Action' : a}</option>
          ))}
        </select>
      </div>

      <div className="admin-card">
        <div className="audit-timeline">
          {filtered.map((log) => (
            <div key={log.id} className="audit-item">
              <div className="audit-item-marker">
                <span className={`audit-action audit-action--${log.action.toLowerCase()}`}>{log.action}</span>
              </div>
              <div className="audit-item-content">
                <strong>{log.detail}</strong>
                <div className="audit-item-meta">
                  <span>{log.user}</span>
                  <span>{log.timestamp}</span>
                  <span>IP: {log.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
