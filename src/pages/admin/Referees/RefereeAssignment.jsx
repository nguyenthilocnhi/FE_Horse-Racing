import React from 'react'
import { referees, raceAssignments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RefereeAssignment.css'

export default function RefereeAssignment() {
  return (
    <div className="referee-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Phân công Trọng tài</h1>
          <p className="admin-page-sub">Gán trọng tài cho race và kiểm tra xung đột lợi ích</p>
        </div>
        <button type="button" className="admin-btn admin-btn--gold">+ Phân công mới</button>
      </div>

      <div className="referee-grid">
        <div className="admin-card">
          <div className="admin-card-head"><h3>Danh sách trọng tài</h3></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Họ tên</th>
                  <th>Giấy phép</th>
                  <th>Kinh nghiệm</th>
                  <th>Xung đột</th>
                </tr>
              </thead>
              <tbody>
                {referees.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.license}</td>
                    <td>{r.experience}</td>
                    <td>
                      {r.conflict
                        ? <StatusBadge status="conflict" />
                        : <StatusBadge status="approved" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head"><h3>Phân công theo Race</h3></div>
          <div className="admin-card-body referee-assign-list">
            {raceAssignments.map((a) => (
              <div key={a.raceId} className={`referee-assign-item${a.conflict ? ' referee-assign-item--conflict' : ''}`}>
                <div>
                  <strong>{a.raceName}</strong>
                  <span>{a.raceId}</span>
                </div>
                <div className="referee-assign-ref">
                  {a.referee || 'Chưa phân công'}
                </div>
                <StatusBadge status={a.status === 'conflict' ? 'conflict' : a.status === 'assigned' ? 'assigned' : 'unassigned'} />
                <button type="button" className="admin-btn admin-btn--outline admin-btn--sm">Gán TT</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
