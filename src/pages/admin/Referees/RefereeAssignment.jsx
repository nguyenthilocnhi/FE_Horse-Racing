import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllReferees, assignRefereeToRace } from '../../../services/adminService'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import './RefereeAssignment.css'

const MOCK_ASSIGNMENTS = [
  { raceId: 'R-1044', originalId: 1044, raceName: 'Cúp Nhà Vô Địch', tournament: 'Cúp Vàng Hoàng Gia', date: '2026-09-12', time: '16:00', refereeId: null, referee: null, status: 'unassigned' },
  { raceId: 'R-1045', originalId: 1045, raceName: 'Vòng Loại Nước Rút 1', tournament: 'Cúp Vàng Hoàng Gia', date: '2026-09-12', time: '14:00', refereeId: null, referee: null, status: 'unassigned' },
  { raceId: 'R-1046', originalId: 1046, raceName: 'Vòng Loại Nước Rút 2', tournament: 'Derby Quốc Gia', date: '2026-06-04', time: '10:30', refereeId: null, referee: null, status: 'unassigned' },
  { raceId: 'R-1042', originalId: 1042, raceName: 'Derby Một Dặm', tournament: 'Derby Quốc Gia', date: '2026-06-03', time: '15:10', refereeId: 'REF-01', referee: 'Dr. James Wilson', status: 'scheduled' },
  { raceId: 'R-1043', originalId: 1043, raceName: 'Đua nước rút 1200m', tournament: 'Derby Quốc Gia', date: '2026-06-03', time: '14:30', refereeId: 'REF-02', referee: 'Sarah Chen', status: 'scheduled' }
]

export default function RefereeAssignment() {
  const [referees, setReferees] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState('all')
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS)
  const [assigningRaceId, setAssigningRaceId] = useState(null)
  const [filterMode, setFilterMode] = useState('unassigned')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [refs, tours] = await Promise.all([
        getAllReferees(),
        getAllTournaments()
      ])

      const refsData = refs.data || refs || []
      const toursData = Array.isArray(tours) ? tours : (tours.data || tours.content || [])

      setReferees(refsData)
      setTournaments(toursData)

      // Fetch all race schedules across tournaments
      const allMapped = []
      if (toursData && toursData.length > 0) {
        for (const t of toursData) {
          try {
            const res = await getTournamentSchedule(t.id)
            const races = res.data || res || []
            if (Array.isArray(races)) {
              const mapped = races.map(r => ({
                raceId: `R-${r.id}`,
                originalId: r.id,
                raceName: r.name || r.raceName,
                tournament: t.name,
                tournamentId: t.id,
                date: r.raceDate || (r.startTime ? r.startTime.split('T')[0] : ''),
                time: r.startTime ? (r.startTime.includes('T') ? r.startTime.split('T')[1].substring(0, 5) : r.startTime.substring(0, 5)) : '',
                refereeId: r.refereeId,
                referee: r.refereeName || r.referee,
                status: (r.status || '').toLowerCase() === 'delayed' ? 'delayed' : (r.refereeId ? 'scheduled' : 'unassigned')
              }))
              allMapped.push(...mapped)
            }
          } catch (e) {
            console.warn(`Failed to load schedules for tournament ${t.id}`, e)
          }
        }
      }

      // Read local created races from localStorage
      let localCreated = []
      try {
        localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
      } catch (e) { }

      const localMapped = localCreated.map(r => ({
        raceId: r.id,
        originalId: r.originalId || r.id,
        raceName: r.name || r.raceName,
        tournament: r.tournament,
        tournamentId: r.tournamentId,
        date: r.date,
        time: r.time,
        refereeId: r.refereeId || null,
        referee: r.referee || null,
        status: (r.status || '').toLowerCase() === 'delayed' ? 'delayed' : (r.refereeId ? 'scheduled' : 'unassigned')
      }))

      const combinedAssignments = [...localMapped]
      allMapped.forEach(a => {
        if (!combinedAssignments.some(c => String(c.raceId) === String(a.raceId) || String(c.originalId) === String(a.originalId))) {
          combinedAssignments.push(a)
        }
      })

      if (combinedAssignments.length > 0) {
        setAssignments(combinedAssignments)
      }
    } catch (err) {
      console.error('Error loading referee initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const isRefereeSuspended = (r) => {
    if (!r) return false
    const st = (r.accountStatus || r.status || '').toUpperCase()
    return st === 'INACTIVE' || st === 'SUSPENDED' || st === 'BANNED' || st === 'LOCKED'
  }

  const handleAssignReferee = async (raceId, refereeId) => {
    const isUnassign = !refereeId || refereeId === 'unassign'
    const targetRace = assignments.find(a => a.raceId === raceId)
    const targetId = targetRace?.originalId || raceId

    if (!isUnassign) {
      const selectedRef = referees.find(r => String(r.id) === String(refereeId))
      if (isRefereeSuspended(selectedRef)) {
        alert('🚫 Trọng tài này đang bị tạm ngưng / khóa tài khoản, không thể phân công!')
        setAssigningRaceId(null)
        return
      }
    }

    try {
      try {
        await assignRefereeToRace(targetId, isUnassign ? null : refereeId)
      } catch (err) {
        console.warn('API assign failed, updating locally:', err)
      }

      const selectedRef = referees.find(r => String(r.id) === String(refereeId))

      // Đồng bộ trạng thái vào created_races trong localStorage
      try {
        const localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
        const updatedLocal = localCreated.map(r => {
          if (String(r.id) === String(raceId) || String(r.originalId) === String(targetId)) {
            return {
              ...r,
              refereeId: isUnassign ? null : refereeId,
              referee: isUnassign ? null : (selectedRef?.fullName || selectedRef?.name || 'Trọng tài'),
              status: isUnassign ? 'unassigned' : 'scheduled'
            }
          }
          return r
        })
        localStorage.setItem('created_races', JSON.stringify(updatedLocal))
      } catch (e) {
        console.warn(e)
      }

      setAssignments(prev => prev.map(a => {
        if (a.raceId === raceId) {
          return {
            ...a,
            refereeId: isUnassign ? null : refereeId,
            referee: isUnassign ? null : (selectedRef?.fullName || selectedRef?.name || 'Trọng tài'),
            status: isUnassign ? 'unassigned' : 'scheduled'
          }
        }
        return a
      }))
      setAssigningRaceId(null)

      if (!isUnassign) {
        alert(`✅ Đã phân công Trọng tài thành công! Cuộc đua đã chuyển sang trạng thái "Chờ diễn ra".`)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      alert(`🚫 Lỗi phân công: \n${msg}`)
      setAssigningRaceId(null)
    }
  }

  const getAssignedCount = (refId) => {
    return assignments.filter(a => String(a.refereeId) === String(refId)).length
  }

  // Filtered assignments list
  const displayedAssignments = assignments.filter(a => {
    // Tournament Filter
    const matchesTournament = selectedTournament === 'all' ||
      String(a.tournamentId) === String(selectedTournament) ||
      a.tournament === selectedTournament

    // Status Filter
    let matchesStatus = true
    if (filterMode === 'unassigned') {
      matchesStatus = !a.refereeId || a.status === 'unassigned'
    } else if (filterMode === 'assigned') {
      matchesStatus = !!a.refereeId || a.status === 'scheduled' || a.status === 'assigned'
    }

    return matchesTournament && matchesStatus
  })

  return (
    <div className="referee-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Phân công Trọng tài</h1>
          <p className="admin-page-sub">Danh sách các cuộc đua cần phân công trọng tài giám sát và quản lý gán trọng tài</p>
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
                    <td>#{r.id}</td>
                    <td><strong style={{ color: '#fff' }}>{r.fullName || r.name}</strong></td>
                    <td>{r.certificateLevel || r.license || 'Hạng A'}</td>
                    <td>{r.experienceYears || r.experience || 0} năm</td>
                    <td>
                      {getAssignedCount(r.id) > 0 ? (
                        <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold' }}>
                          {getAssignedCount(r.id)} race
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      {r.accountStatus === 'ACTIVE' || r.accountStatus === 'APPROVED' || !r.accountStatus
                        ? <span className="admin-badge admin-badge--green">Hoạt động</span>
                        : <span className="admin-badge admin-badge--red">Tạm ngưng</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Assignment list ── */}
        <div className="admin-card">
          <div className="admin-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3>Phân công theo Race</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="admin-select"
                style={{ maxWidth: '190px', fontSize: '13px' }}
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="unassigned">Chờ phân công trọng tài</option>
                <option value="assigned">Đã phân công trọng tài</option>
                <option value="all">Tất cả cuộc đua</option>
              </select>

              <select
                className="admin-select"
                style={{ maxWidth: '180px', fontSize: '13px' }}
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
              >
                <option value="all">🏆 Tất cả Giải đấu</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-card-body referee-assign-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Đang tải danh sách cuộc đua...</p>
            ) : displayedAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏁</div>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {filterMode === 'unassigned'
                    ? 'Không có cuộc đua nào đang chờ phân công trọng tài.'
                    : filterMode === 'assigned'
                      ? 'Chưa có cuộc đua nào được phân công trọng tài.'
                      : 'Không tìm thấy cuộc đua nào.'}
                </p>
              </div>
            ) : (
              displayedAssignments.map((a) => (
                <div
                  key={a.raceId}
                  className="referee-assign-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {/* Race Info */}
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>{a.raceName}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {a.tournament ? `🏆 ${a.tournament} · ` : ''}{a.raceId}
                      {a.date && (
                        <span style={{ marginLeft: '8px', color: '#94a3b8' }}>
                          📅 {a.date} {a.time ? `· ⏰ ${a.time}` : ''}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Assigned Referee Info */}
                  <div className="referee-assign-ref" style={{ flex: 1, textAlign: 'center', fontWeight: '500', color: a.referee ? '#fff' : '#64748b' }}>
                    👤 {a.referee || 'Chưa phân công'}
                  </div>

                  {/* Status Badge */}
                  <div style={{ marginRight: '16px' }}>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Action: Select or Button */}
                  {a.status === 'delayed' ? (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', fontWeight: '600' }}>
                      ⛔ Đã bị hoãn
                    </span>
                  ) : assigningRaceId === a.raceId ? (
                    <select
                      className="admin-select"
                      onChange={(e) => handleAssignReferee(a.raceId, e.target.value)}
                      defaultValue=""
                      style={{ minWidth: '160px', padding: '6px 10px', fontSize: '12px' }}
                    >
                      <option value="" disabled>-- Chọn Trọng tài --</option>
                      <option value="unassign">🚫 Bỏ phân công</option>
                      {referees.filter(r => !isRefereeSuspended(r)).map(r => (
                        <option key={r.id} value={r.id}>
                          {r.fullName || r.name} ({r.certificateLevel || 'Hạng A'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--gold admin-btn--sm"
                      onClick={() => setAssigningRaceId(a.raceId)}
                    >
                      {a.referee ? 'Đổi TT' : 'Phân công TT'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
