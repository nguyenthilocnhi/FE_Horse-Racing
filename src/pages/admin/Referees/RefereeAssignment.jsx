import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllReferees, assignRefereeToRace } from '../../../services/adminService'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import './RefereeAssignment.css'

export default function RefereeAssignment() {
  const [referees, setReferees] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState('')
  const [assignments, setAssignments] = useState([])
  const [assigningRaceId, setAssigningRaceId] = useState(null)
  
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [refs, tours] = await Promise.all([
        getAllReferees(),
        getAllTournaments()
      ])
      // data.data is the payload
      setReferees(refs.data || refs || [])
      setTournaments(Array.isArray(tours) ? tours : (tours.data || tours.content || []))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (selectedTournament) {
      loadSchedule(selectedTournament)
    } else {
      setAssignments([])
    }
  }, [selectedTournament])

  const loadSchedule = async (tournamentId) => {
    try {
      const res = await getTournamentSchedule(tournamentId)
      const races = res.data || []
      
      const mapped = races.map(r => ({
        raceId: r.id,
        raceName: r.name,
        date: r.raceDate,
        time: r.startTime ? new Date(r.startTime).toLocaleTimeString() : '',
        refereeId: r.refereeId,
        referee: r.refereeName,
        status: r.refereeId ? 'assigned' : 'unassigned'
      }))
      setAssignments(mapped)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAssignReferee = async (raceId, refereeId) => {
    const isUnassign = !refereeId || refereeId === 'unassign'
    
    try {
      await assignRefereeToRace(raceId, isUnassign ? null : refereeId)
      
      const selectedRef = referees.find(r => String(r.id) === String(refereeId))
      
      setAssignments(prev => prev.map(a => {
        if (a.raceId === raceId) {
          return {
            ...a,
            refereeId: isUnassign ? null : refereeId,
            referee: isUnassign ? null : selectedRef?.fullName,
            status: isUnassign ? 'unassigned' : 'assigned'
          }
        }
        return a
      }))
      setAssigningRaceId(null)
      
      if (!isUnassign) {
        alert(`✅ Đã phân công Trọng tài thành công!`)
      }
    } catch (err) {
      // Backend conflict detection will throw error
      const msg = err.response?.data?.message || err.message
      alert(`🚫 Lỗi phân công: \n${msg}`)
      setAssigningRaceId(null)
    }
  }

  const getAssignedCount = (refId) => {
    return assignments.filter(a => String(a.refereeId) === String(refId)).length;
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
        {/* ── Left: Referee list ── */}
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
                  <th>Race đã gán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {referees.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><strong style={{ color: '#fff' }}>{r.fullName}</strong></td>
                    <td>{r.certificateLevel}</td>
                    <td>{r.experienceYears} năm</td>
                    <td>
                      {getAssignedCount(r.id) > 0 ? (
                        <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold' }}>{getAssignedCount(r.id)} race</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#555' }}>—</span>
                      )}
                    </td>
                    <td>
                      {r.accountStatus === 'ACTIVE' || r.accountStatus === 'APPROVED'
                        ? <span className="admin-badge admin-badge--green">{r.accountStatus}</span>
                        : <span className="admin-badge admin-badge--red">{r.accountStatus}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Assignment list ── */}
        <div className="admin-card">
          <div className="admin-card-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Phân công theo Race</h3>
            <select 
              className="admin-select" 
              style={{maxWidth: '200px'}}
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
            >
              <option value="">-- Chọn Giải đấu --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-card-body referee-assign-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedTournament && assignments.length === 0 && (
              <p style={{color: '#888', textAlign: 'center', marginTop: '20px'}}>Giải đấu này chưa có lịch đua nào.</p>
            )}
            {!selectedTournament && (
              <p style={{color: '#888', textAlign: 'center', marginTop: '20px'}}>Vui lòng chọn giải đấu để xem lịch đua.</p>
            )}
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
                {/* Race info */}
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>{a.raceName}</strong>
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    {a.raceId}
                    {a.date && a.time && (
                      <span style={{ marginLeft: '8px', color: '#888' }}>
                        📅 {a.date} · ⏰ {a.time}
                      </span>
                    )}
                  </span>
                </div>

                {/* Assigned referee */}
                <div className="referee-assign-ref" style={{ flex: 1, textAlign: 'center', fontWeight: '500', color: a.referee ? '#fff' : '#666' }}>
                  👤 {a.referee || 'Chưa phân công'}
                  {a.scheduleWarn && (
                    <span title="Trọng tài có race khác trong cùng ngày" style={{ marginLeft: '6px', color: '#f59e0b', fontSize: '12px' }}>⚠️</span>
                  )}
                </div>

                {/* Status badge */}
                <div style={{ marginRight: '16px' }}>
                  <StatusBadge status={a.status === 'conflict' ? 'conflict' : a.status === 'assigned' ? 'assigned' : 'unassigned'} />
                </div>

                {/* Action: dropdown or button */}
                {assigningRaceId === a.raceId ? (
                  <select
                    className="admin-select"
                    onChange={(e) => handleAssignReferee(a.raceId, e.target.value)}
                    defaultValue=""
                    style={{ minWidth: '160px', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="" disabled>-- Chọn Trọng tài --</option>
                    <option value="unassign">🚫 Bỏ phân công</option>
                    {referees.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.fullName} ({r.certificateLevel})
                        </option>
                      ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    onClick={() => setAssigningRaceId(a.raceId)}
                  >
                    {a.referee ? 'Đổi TT' : 'Phân công'}
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
