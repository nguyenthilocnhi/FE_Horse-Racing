import React, { useState, useEffect } from 'react'
import { horseRankings as initialHorseRankings, jockeyRankings as initialJockeyRankings, tournaments as mockTournaments } from '../../../data/adminMockData'
import { getAllTournaments } from '../../../services/tournamentService'
import './RankingManagement.css'

export default function RankingManagement() {
  const [tab, setTab] = useState('horses')
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Expanded mock rankings with tournament associations
  const [horseRankings, setHorseRankings] = useState([
    { rank: 1, name: 'Aurelius', points: 2450, wins: 12, races: 18, owner: 'Stable Alpha', tournament: 'Derby Quốc Gia', tournamentId: 'T-002' },
    { rank: 2, name: 'Midnight Star', points: 2280, wins: 9, races: 16, owner: 'Blue Ridge Farm', tournament: 'Derby Quốc Gia', tournamentId: 'T-002' },
    { rank: 3, name: 'Velvet Thunder', points: 2150, wins: 15, races: 22, owner: 'Golden Hooves', tournament: 'Derby Quốc Gia', tournamentId: 'T-002' },
    { rank: 1, name: 'Thunder Bolt', points: 1950, wins: 8, races: 10, owner: 'Wind Valley', tournament: 'Cúp Vàng Hoàng Gia 2026', tournamentId: 'T-001' },
    { rank: 2, name: 'Golden Eagle', points: 1820, wins: 7, races: 12, owner: 'Stable Alpha', tournament: 'Cúp Vàng Hoàng Gia 2026', tournamentId: 'T-001' },
    { rank: 1, name: 'Storm Rider', points: 2100, wins: 10, races: 14, owner: 'Blue Ridge Farm', tournament: 'Championship Sprint', tournamentId: 'T-003' },
  ])

  const [jockeyRankings, setJockeyRankings] = useState([
    { rank: 1, name: 'L. Anderson', points: 3200, wins: 320, races: 450, tournament: 'Derby Quốc Gia', tournamentId: 'T-002' },
    { rank: 2, name: 'M. Rodriguez', points: 2890, wins: 289, races: 410, tournament: 'Derby Quốc Gia', tournamentId: 'T-002' },
    { rank: 3, name: 'S. Nakamura', points: 2700, wins: 270, races: 395, tournament: 'Derby Quốc Gia', tournamentId: 'T-002' },
    { rank: 1, name: 'K. Vance', points: 2400, wins: 210, races: 310, tournament: 'Cúp Vàng Hoàng Gia 2026', tournamentId: 'T-001' },
    { rank: 2, name: 'J. Smith', points: 2150, wins: 190, races: 290, tournament: 'Cúp Vàng Hoàng Gia 2026', tournamentId: 'T-001' },
    { rank: 1, name: 'L. Anderson', points: 2980, wins: 280, races: 380, tournament: 'Championship Sprint', tournamentId: 'T-003' },
  ])

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const data = await getAllTournaments()
      const list = data?.data || data || []
      if (list && list.length > 0) {
        setTournaments(list)
      } else {
        setTournaments(mockTournaments)
      }
    } catch (err) {
      console.error('Failed to fetch tournaments for rankings:', err)
      setTournaments(mockTournaments)
    } finally {
      setLoading(false)
    }
  }

  // Filter rankings by search query and tournament
  const currentRankings = tab === 'horses' ? horseRankings : jockeyRankings

  const filteredRankings = currentRankings.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.owner && item.owner.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchTour = selectedTournament === 'all' || 
                      String(item.tournamentId) === String(selectedTournament) || 
                      item.tournament === selectedTournament
    return matchSearch && matchTour
  })

  // Group filtered rankings by tournament name
  const groupedRankings = filteredRankings.reduce((acc, item) => {
    const tourName = item.tournament || 'Giải đấu khác'
    if (!acc[tourName]) acc[tourName] = []
    acc[tourName].push(item)
    return acc
  }, {})

  const groupKeys = Object.keys(groupedRankings)

  return (
    <div className="ranking-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Xếp hạng</h1>
          <p className="admin-page-sub">Bảng xếp hạng ngựa và jockey theo mùa giải & giải đấu</p>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="admin-tabs" style={{ margin: 0 }}>
          <button type="button" className={`admin-tab${tab === 'horses' ? ' is-active' : ''}`} onClick={() => setTab('horses')}>Ngựa</button>
          <button type="button" className={`admin-tab${tab === 'jockeys' ? ' is-active' : ''}`} onClick={() => setTab('jockeys')}>Jockey</button>
        </div>

        <input 
          type="text" 
          className="admin-input" 
          placeholder={tab === 'horses' ? "Tìm theo tên ngựa, chủ stables..." : "Tìm theo tên jockey..."} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '220px' }}
        />

        <select 
          className="admin-select"
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
        >
          <option value="all">🏆 Tất cả Giải đấu</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {groupKeys.length === 0 ? (
        <div className="admin-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Không tìm thấy dữ liệu xếp hạng phù hợp với bộ lọc.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {groupKeys.map(tourName => {
            const list = groupedRankings[tourName]
            return (
              <div key={tourName} className="tournament-ranking-group">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(30,41,59,0.8) 100%)',
                  borderLeft: '4px solid #d4af37',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🏆</span>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                      {tourName}
                    </h2>
                  </div>
                  <span style={{ fontSize: '13px', color: '#d4af37', fontWeight: '600', background: 'rgba(212,175,55,0.15)', padding: '4px 12px', borderRadius: '12px' }}>
                    {list.length} {tab === 'horses' ? 'ngựa' : 'jockey'}
                  </span>
                </div>

                <div className="admin-card">
                  <div className="admin-table-wrap">
                    <table className="admin-table ranking-table">
                      <thead>
                        <tr>
                          <th>Hạng</th>
                          <th>{tab === 'horses' ? 'Tên ngựa' : 'Jockey'}</th>
                          {tab === 'horses' && <th>Chủ stables</th>}
                          <th>Điểm số</th>
                          <th>Chiến thắng</th>
                          <th>Số race tham gia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((item) => (
                          <tr key={`${item.rank}-${item.name}`}>
                            <td>
                              <span className="ranking-num" style={{
                                color: item.rank === 1 ? '#eab308' : item.rank === 2 ? '#94a3b8' : item.rank === 3 ? '#b45309' : '#fff',
                                fontWeight: item.rank <= 3 ? 'bold' : 'normal'
                              }}>
                                {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `#${item.rank}`}
                              </span>
                            </td>
                            <td><strong>{item.name}</strong></td>
                            {tab === 'horses' && <td>{item.owner || 'N/A'}</td>}
                            <td className="ranking-points">{item.points.toLocaleString()}</td>
                            <td style={{ color: '#22c55e', fontWeight: '600' }}>{item.wins}</td>
                            <td>{item.races}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
