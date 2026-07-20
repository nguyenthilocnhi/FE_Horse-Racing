import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import './SpectatorDashboard.css'

export default function SpectatorDashboard() {
  const [activeTab, setActiveTab] = useState('TOURNAMENTS') // 'TOURNAMENTS' or 'RACES'
  
  // Data
  const [tournaments, setTournaments] = useState([])
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const tourRes = await getAllTournaments()
      const fetchedTournaments = tourRes.data || tourRes || []
      
      const formattedTournaments = fetchedTournaments.map(t => ({
        id: t.id,
        name: t.name,
        venue: t.location,
        startDate: t.startDate,
        endDate: t.endDate,
        races: t.racesCount || 0,
        prize: 'Chưa cập nhật',
        status: t.status === 'ONGOING' ? 'ongoing' : 
                t.status === 'COMPLETED' ? 'completed' : 
                t.status === 'CANCELLED' ? 'cancelled' : 'upcoming'
      }))
      setTournaments(formattedTournaments)

      if (fetchedTournaments && fetchedTournaments.length > 0) {
        const allRaces = []
        for (const t of fetchedTournaments) {
          try {
            const scheduleRes = await getTournamentSchedule(t.id)
            const schedules = scheduleRes.data || []
            const formattedSchedules = schedules.map(s => ({
              id: `R-${s.id}`,
              originalId: s.id,
              name: s.name,
              tournament: t.name,
              tournamentId: t.id,
              date: s.raceDate || (s.startTime ? s.startTime.split('T')[0] : 'N/A'),
              time: s.startTime ? s.startTime.split('T')[1].substring(0, 5) : '00:00',
              distance: '1600m', // Default
              status: s.status ? s.status.toLowerCase() : 'pending',
              horses: 0
            }))
            allRaces.push(...formattedSchedules)
          } catch (err) {
            console.error(`Error fetching schedules for tournament ${t.id}`, err)
          }
        }
        setRaces(allRaces)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and Sort Tournaments
  const filteredTournaments = tournaments
    .filter(t => {
      const q = localSearchQuery.toLowerCase()
      if (q && !t.name.toLowerCase().includes(q) && !t.venue.toLowerCase().includes(q)) return false
      if (statusFilter !== 'ALL' && t.status !== statusFilter.toLowerCase()) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'NEWEST') return b.id - a.id
      if (sortOrder === 'OLDEST') return a.id - b.id
      if (sortOrder === 'NAME_AZ') return a.name.localeCompare(b.name)
      return 0
    })

  // Filter and Sort Races
  const filteredRaces = races
    .filter(race => {
      const q = localSearchQuery.toLowerCase()
      if (q && !race.name.toLowerCase().includes(q) && !race.tournament.toLowerCase().includes(q) && !race.id.toLowerCase().includes(q)) return false
      if (statusFilter !== 'ALL' && race.status !== statusFilter.toLowerCase()) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'NEWEST') return new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`)
      if (sortOrder === 'OLDEST') return new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`)
      if (sortOrder === 'NAME_AZ') return a.name.localeCompare(b.name)
      return 0
    })

  // Modal states for details
  const [selectedRace, setSelectedRace] = useState(null)
  const [selectedTournament, setSelectedTournament] = useState(null)

  return (
    <div className="spectator-dashboard">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Giải Đấu & Lịch Đua</h1>
          <p className="admin-page-sub">Theo dõi lịch trình các sự kiện, vòng đua trực tiếp và thông tin chi tiết</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`admin-btn ${activeTab === 'TOURNAMENTS' ? 'admin-btn--gold' : 'admin-btn--outline'}`}
          onClick={() => {
            setActiveTab('TOURNAMENTS')
            setLocalSearchQuery('')
            setStatusFilter('ALL')
            setSortOrder('NEWEST')
          }}
        >
          Giải Đấu
        </button>
        <button 
          className={`admin-btn ${activeTab === 'RACES' ? 'admin-btn--gold' : 'admin-btn--outline'}`}
          onClick={() => {
            setActiveTab('RACES')
            setLocalSearchQuery('')
            setStatusFilter('ALL')
            setSortOrder('NEWEST')
          }}
        >
          Cuộc Đua
        </button>
      </div>

      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="admin-input" 
          placeholder="Tìm theo tên hoặc địa điểm..." 
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          style={{ minWidth: '220px', flex: 1, maxWidth: '300px' }}
        />
        <select 
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="ALL">Tất cả Trạng thái</option>
          {activeTab === 'TOURNAMENTS' ? (
            <>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </>
          ) : (
            <>
              <option value="scheduled">Đã lên lịch</option>
              <option value="pending">Chờ xử lý</option>
              <option value="delayed">Bị hoãn</option>
              <option value="running">Đang chạy</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </>
          )}
        </select>
        <select 
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="NEWEST">Sắp xếp: Mới nhất</option>
          <option value="OLDEST">Sắp xếp: Cũ nhất</option>
          <option value="NAME_AZ">Sắp xếp: Tên A ➔ Z</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải dữ liệu...</div>
      ) : activeTab === 'TOURNAMENTS' ? (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên giải đấu</th>
                  <th>Địa điểm</th>
                  <th>Thời gian</th>
                  <th>Races</th>
                  <th>Giải thưởng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredTournaments.length > 0 ? (
                  filteredTournaments.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTournament(t)}
                      style={{ cursor: 'pointer' }}
                      className="race-item-hover"
                    >
                      <td>{t.id}</td>
                      <td><strong className="tournament-name" style={{ color: '#fff' }}>{t.name}</strong></td>
                      <td>{t.venue}</td>
                      <td>{t.startDate} → {t.endDate}</td>
                      <td>{t.races} races</td>
                      <td>{t.prize}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Không có giải đấu nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="race-cards-grid">
          {filteredRaces.length > 0 ? (
            filteredRaces.map((race) => (
              <div 
                key={race.id} 
                className="admin-card race-card-item" 
                onClick={() => setSelectedRace(race)}
                style={{ cursor: 'pointer' }}
              >
                <div className="race-card-top">
                  <span className="race-card-id">{race.id}</span>
                  <StatusBadge status={race.status} />
                </div>
                <h3>{race.name}</h3>
                <p className="race-card-tournament">{race.tournament}</p>
                <div className="race-card-meta">
                  <span>📅 {race.date} · ⏰ {race.time}</span>
                  <span>📏 Cự ly: {race.distance}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#666', gridColumn: '1 / -1' }}>
              Không có cuộc đua nào phù hợp.
            </div>
          )}
        </div>
      )}

      {/* Race Details Modal */}
      {selectedRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '600px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <div>
                <h3>Chi tiết Vòng chạy & Làn thi đấu</h3>
                <span style={{ fontSize: '11px', color: '#d4af37' }}>Mã cuộc đua: {selectedRace.id}</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedRace(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
                <div><span style={{ color: '#666' }}>Tên cuộc đua:</span> <strong style={{ color: '#fff' }}>{selectedRace.name}</strong></div>
                <div><span style={{ color: '#666' }}>Trạng thái:</span> <StatusBadge status={selectedRace.status} /></div>
                <div><span style={{ color: '#666' }}>Giải đấu:</span> <strong style={{ color: '#fff' }}>{selectedRace.tournament}</strong></div>
                <div><span style={{ color: '#666' }}>Cự ly:</span> <strong style={{ color: '#d4af37' }}>{selectedRace.distance}</strong></div>
                <div><span style={{ color: '#666' }}>Ngày đua:</span> <strong style={{ color: '#fff' }}>{selectedRace.date}</strong></div>
                <div><span style={{ color: '#666' }}>Giờ xuất phát:</span> <strong style={{ color: '#fff' }}>{selectedRace.time}</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedRace(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '500px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <h3>Thông tin Giải Đấu</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedTournament(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 4px 0' }}>{selectedTournament.name}</h3>
              <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '16px' }}>Mã sự kiện: {selectedTournament.id}</span>
              
              <dl className="user-detail-dl" style={{ fontSize: '13px', marginBottom: '20px' }}>
                <dt>Địa điểm tổ chức</dt>
                <dd>{selectedTournament.venue}</dd>
                
                <dt>Thời gian giải chạy</dt>
                <dd>{selectedTournament.startDate} đến {selectedTournament.endDate}</dd>
                
                <dt>Tổng cơ cấu giải thưởng</dt>
                <dd style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '16px' }}>{selectedTournament.prize}</dd>

                <dt>Trạng thái</dt>
                <dd><StatusBadge status={selectedTournament.status} /></dd>
              </dl>

              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d4af37', marginBottom: '10px', marginTop: '20px', letterSpacing: '0.05em' }}>Danh sách cuộc đua thuộc giải</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '20px' }}>
                {races.filter(r => r.tournamentId === selectedTournament.id).map(r => (
                  <div 
                    key={r.id}
                    onClick={() => {
                      setSelectedRace(r)
                      setSelectedTournament(null)
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    className="race-item-hover"
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '13px', display: 'block' }}>{r.name}</strong>
                      <span style={{ fontSize: '11px', color: '#888' }}>📏 {r.distance} | 📅 {r.date}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
                {races.filter(r => r.tournamentId === selectedTournament.id).length === 0 && (
                  <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', padding: '10px' }}>Chưa có cuộc đua nào.</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedTournament(null)}>Đóng thông tin</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
