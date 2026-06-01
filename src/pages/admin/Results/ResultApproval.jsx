import React from 'react'
import { resultReports } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './ResultApproval.css'

export default function ResultApproval() {
  return (
    <div className="result-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Duyệt Kết quả</h1>
          <p className="admin-page-sub">Xem xét báo cáo từ trọng tài và công bố kết quả</p>
        </div>
      </div>

      <div className="result-cards">
        {resultReports.map((r) => (
          <div key={r.id} className="admin-card result-card">
            <div className="result-card-head">
              <div>
                <span className="result-id">{r.id}</span>
                <h3>{r.race}</h3>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="result-card-body">
              <div className="result-meta">
                <div><label>Trọng tài</label><span>{r.referee}</span></div>
                <div><label>Ngày gửi</label><span>{r.submitted}</span></div>
                <div><label>Ngựa về nhất</label><span className="result-winner">{r.winner}</span></div>
              </div>
              <div className="admin-table-actions">
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm">Xem chi tiết</button>
                {r.status === 'pending' && (
                  <>
                    <button type="button" className="admin-btn admin-btn--success admin-btn--sm">Duyệt</button>
                    <button type="button" className="admin-btn admin-btn--danger admin-btn--sm">Từ chối</button>
                  </>
                )}
                {r.status === 'approved' && (
                  <button type="button" className="admin-btn admin-btn--gold admin-btn--sm">Publish</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
