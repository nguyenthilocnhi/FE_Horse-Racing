import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { getRaces, getRaceResults } from '../../../services/raceService'
import { StatusBadge, computeRaceStatus } from '../../../utils/adminHelpers'
import '../../admin/Races/RaceManagement.css'

export default function SpectatorRaces() {
  const [races, setRaces] = useState([])
  const [tournaments, setTournaments] = useState([])

  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedRace, setSelectedRace] = useState(null)
  const [results, setResults] = useState([])
  const [loadingResults, setLoadingResults] = useState(false)

  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [tournamentFilter, setTournamentFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  const { searchQuery = '' } = useOutletContext() || {}

  const fetchData = async () => {
    try {
      const tourRes = await getAllTournaments()
      const fetchedTournaments = tourRes.data || tourRes || []
      setTournaments(fetchedTournaments)

      let fetchedRaces = []
      try {
        const raceRes = await getRaces()
        fetchedRaces = raceRes?.data || raceRes || []
      } catch (err) {
        console.warn('GET /races failed:', err)
      }

      if (Array.isArray(fetchedRaces) && fetchedRaces.length > 0) {
        const formatted = fetchedRaces.map(s => {
          const dateStr = s.raceDate || (s.startTime ? s.startTime.split('T')[0] : '')
          const timeStr = s.startTime ? (s.startTime.includes('T') ? s.startTime.split('T')[1].substring(0, 5) : s.startTime.substring(0, 5)) : '00:00'
          const endTimeStr = s.endTime ? (s.endTime.includes('T') ? s.endTime.split('T')[1].substring(0, 5) : s.endTime.substring(0, 5)) : ''

          const computedSt = computeRaceStatus({
            status: s.status,
            refereeId: s.refereeId,
            referee: s.refereeName,
            date: dateStr,
            time: timeStr,
            endTime: endTimeStr,
            registrationStartDate: s.registrationStartDate,
            registrationEndDate: s.registrationEndDate
          })

          return {
            id: `R-${s.id}`,
            originalId: s.id,
            name: s.name || s.raceName || 'Cuộc đua',
            tournament: s.tournamentName || s.tournament?.name || 'Giải Đấu',
            tournamentId: s.tournamentId || s.tournament?.id || 1,
            date: dateStr,
            time: timeStr,
            endTime: endTimeStr,
            distance: s.distance ? `${s.distance}m` : '1600m',
            status: computedSt,
            refereeId: s.refereeId,
            referee: s.refereeName
          }
        })
        setRaces(formatted)
        return
      }

      if (fetchedTournaments && fetchedTournaments.length > 0) {
        const allRaces = []
        for (const t of fetchedTournaments) {
          try {
            const scheduleRes = await getTournamentSchedule(t.id)
            const schedules = scheduleRes.data || scheduleRes || []
            const formattedSchedules = schedules.map(s => {
              const dateStr = s.raceDate || (s.startTime ? s.startTime.split('T')[0] : '')
              const timeStr = s.startTime ? (s.startTime.includes('T') ? s.startTime.split('T')[1].substring(0, 5) : s.startTime.substring(0, 5)) : '00:00'
              const endTimeStr = s.endTime ? (s.endTime.includes('T') ? s.endTime.split('T')[1].substring(0, 5) : s.endTime.substring(0, 5)) : ''

              const computedSt = computeRaceStatus({
                status: s.status,
                refereeId: s.refereeId,
                referee: s.refereeName,
                date: dateStr,
                time: timeStr,
                endTime: endTimeStr,
                registrationStartDate: s.registrationStartDate,
                registrationEndDate: s.registrationEndDate
              })

              return {
                id: `R-${s.id}`,
                originalId: s.id,
                name: s.name,
                tournament: t.name,
                tournamentId: t.id,
                date: dateStr,
                time: timeStr,
                endTime: endTimeStr,
                distance: '1600m',
                status: computedSt,
                refereeId: s.refereeId,
                referee: s.refereeName
              }
            })
            allRaces.push(...formattedSchedules)
          } catch (e) {
            console.error(e)
          }
        }
        setRaces(allRaces)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleViewResults = async (race) => {
    setSelectedRace(race)
    setShowResultModal(true)
    setLoadingResults(true)
    setResults([])

    try {
      const res = await getRaceResults(race.originalId)
      if (res.data) {
        setResults(res.data.sort((a, b) => a.rankPosition - b.rankPosition))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingResults(false)
    }
  }

  const activeSearchQuery = (searchQuery || localSearchQuery).toLowerCase()
  let filtered = races.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(activeSearchQuery) ||
      r.tournament.toLowerCase().includes(activeSearchQuery)
    const matchTour = tournamentFilter === 'all' || r.tournamentId.toString() === tournamentFilter

    return matchSearch && matchTour
  })

  filtered.sort((a, b) => {
    const dA = new Date(`${a.date}T${a.time}`)
    const dB = new Date(`${b.date}T${b.time}`)
    if (sortOrder === 'newest') return dB - dA
    return dA - dB
  })

  // Group by Tournament
  const grouped = filtered.reduce((acc, curr) => {
    if (!acc[curr.tournament]) acc[curr.tournament] = []
    acc[curr.tournament].push(curr)
    return acc
  }, {})

  return (
    <div className="race-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Cuộc đua</h1>
          <p className="admin-page-sub">Xem lại các cuộc đua đã hoàn thành và xem bảng thành tích chi tiết</p>
        </div>
      </div>

      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm theo tên cuộc đua..."
          className="admin-input"
          style={{ width: '260px' }}
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
        />
        <select className="admin-select" value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}>
          <option value="all">Tất cả Giải đấu</option>
          {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="admin-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="newest">Sắp xếp: Mới nhất</option>
          <option value="oldest">Sắp xếp: Cũ nhất</option>
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
          Không tìm thấy cuộc đua nào đã hoàn thành phù hợp.
        </div>
      ) : (
        Object.keys(grouped).map(tourName => {
          const raceList = grouped[tourName]
          return (
            <div key={tourName} className="tournament-race-group">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(30,41,59,0.8) 100%)',
                borderLeft: '4px solid #d4af37',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🏆</span>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                    {tourName}
                  </h2>
                </div>
                <span style={{ fontSize: '13px', color: '#d4af37', fontWeight: '600', background: 'rgba(212,175,55,0.15)', padding: '4px 12px', borderRadius: '12px' }}>
                  {raceList.length} cuộc đua
                </span>
              </div>

              <div className="race-cards-grid">
                {raceList.map((r) => (
                  <div key={r.id} className="admin-card race-card-item">
                    <div className="race-card-top">
                      <span className="race-card-id">{r.id}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <h3>{r.name}</h3>
                    <p className="race-card-tournament">{r.tournament}</p>
                    <div className="race-card-meta">
                      <span>📅 {r.date} · ⏰ {r.time}</span>
                      <span>📏 Cự ly: {r.distance}</span>
                    </div>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--gold"
                        style={{ width: '100%', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleViewResults(r)}
                      >
                        📊 Xem kết quả
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Result Modal */}
      {showResultModal && selectedRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1100
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '560px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="admin-card-head">
              <div>
                <h3 style={{ color: '#d4af37' }}>Bảng thành tích - {selectedRace.name}</h3>
                <span style={{ fontSize: '11px', color: '#888' }}>{selectedRace.date} • {selectedRace.time}</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setShowResultModal(false)}>✕</button>
            </div>
            <div className="admin-card-body">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Hạng</th>
                    <th>Chiến mã</th>
                    <th style={{ textAlign: 'right' }}>Thành tích</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingResults ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Đang tải kết quả...</td></tr>
                  ) : results.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Chưa có kết quả chính thức.</td></tr>
                  ) : (
                    results.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 'bold', color: r.rankPosition === 1 ? '#d4af37' : r.rankPosition === 2 ? '#c0c0c0' : r.rankPosition === 3 ? '#cd7f32' : '#fff' }}>
                          {r.rankPosition === 1 ? '🥇 ' : r.rankPosition === 2 ? '🥈 ' : r.rankPosition === 3 ? '🥉 ' : ''}
                          Hạng {r.rankPosition}
                        </td>
                        <td style={{ color: '#fff' }}>{r.horseName || `Ngựa #${r.horseId}`}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.finishTime}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowResultModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
