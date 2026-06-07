import React, { useState } from 'react'
import { referees as initialReferees, raceAssignments as initialAssignments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RefereeAssignment.css'

export default function RefereeAssignment() {
  const [referees, setReferees] = useState(initialReferees)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [assigningRaceId, setAssigningRaceId] = useState(null)

  const handleAssignReferee = (raceId, refereeId) => {
    if (!refereeId) {
      // Unassign
      setAssignments(assignments.map(a => 
        a.raceId === raceId ? { ...a, referee: null, status: 'unassigned', conflict: false } : a
      ))
      setAssigningRaceId(null)
      return
    }

    const selectedRef = referees.find(r => r.id === refereeId)
    if (!selectedRef) return

    // Update assignment
    const updated = assignments.map(a => {
      if (a.raceId === raceId) {
        return {
          ...a,
          referee: selectedRef.name,
          status: selectedRef.conflict ? 'conflict' : 'assigned',
          conflict: selectedRef.conflict
        }
      }
      return a
    })

    setAssignments(updated)

    // Update referee assigned races in state
    setReferees(referees.map(r => {
      if (r.id === refereeId) {
        return { ...r, assignedRaces: Array.from(new Set([...r.assignedRaces, raceId])) }
      } else {
        // Remove from previous if assigned elsewhere (for single referee assignment rules)
        return { ...r, assignedRaces: r.assignedRaces.filter(id => id !== raceId) }
      }
    }))

    setAssigningRaceId(null)

    if (selectedRef.conflict) {
      alert(`⚠️ Cảnh báo: Trọng tài ${selectedRef.name} có xung đột lợi ích đối với cuộc đua này! Hệ thống đã gắn cờ cảnh báo.`);
    } else {
      alert(`Đã phân công Trọng tài ${selectedRef.name} thành công!`);
    }
  }

  return (
    <div className="referee-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Phân công Trọng tài</h1>
          <p className="admin-page-sub">Quản lý danh sách trọng tài giám sát, kiểm tra xung đột lợi ích stables</p>
        </div>
      </div>

      <div className="referee-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Danh sách trọng tài</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Họ tên</th>
                  <th>Giấy phép</th>
                  <th>Kinh nghiệm</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {referees.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><strong style={{ color: '#fff' }}>{r.name}</strong></td>
                    <td>{r.license}</td>
                    <td>{r.experience}</td>
                    <td>
                      {r.conflict
                        ? <span className="admin-badge admin-badge--red">Xung đột</span>
                        : <span className="admin-badge admin-badge--green">Sẵn sàng</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Phân công theo Race</h3>
          </div>
          <div className="admin-card-body referee-assign-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignments.map((a) => (
              <div 
                key={a.raceId} 
                className={`referee-assign-item${a.conflict ? ' referee-assign-item--conflict' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: a.conflict ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: a.conflict ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>{a.raceName}</strong>
                  <span style={{ fontSize: '11px', color: '#666' }}>ID: {a.raceId}</span>
                </div>
                
                <div className="referee-assign-ref" style={{ flex: 1, textAlign: 'center', fontWeight: '500', color: a.referee ? '#fff' : '#666' }}>
                  👤 {a.referee || 'Chưa phân công'}
                </div>

                <div style={{ marginRight: '16px' }}>
                  <StatusBadge status={a.status === 'conflict' ? 'conflict' : a.status === 'assigned' ? 'assigned' : 'unassigned'} />
                </div>

                {assigningRaceId === a.raceId ? (
                  <select
                    className="admin-select"
                    onChange={(e) => handleAssignReferee(a.raceId, e.target.value)}
                    defaultValue=""
                    style={{ minWidth: '130px', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="" disabled>-- Chọn TT --</option>
                    <option value="unassign">Bỏ phân công</option>
                    {referees.map(r => (
                      <option key={r.id} value={r.id}>{r.name} {r.conflict ? '(Cảnh báo)' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    onClick={() => setAssigningRaceId(a.raceId)}
                  >
                    {a.referee ? 'Đổi TT' : 'Gán TT'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
