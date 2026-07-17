import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import * as tournamentService from '../../../services/tournamentService'
import * as jockeyService from '../../../services/jockeyService'
import './PersonalResults.css'

function PositionMedal({ pos }) {
  const isNumeric = !isNaN(parseInt(pos, 10))
  const numPos = isNumeric ? parseInt(pos, 10) : 0
  const cls =
    numPos === 1 ? 'jockey-medal--1' :
    numPos === 2 ? 'jockey-medal--2' :
    numPos === 3 ? 'jockey-medal--3' :
    'jockey-medal--n'
  return <span className={`jockey-medal ${cls}`}>{pos}</span>
}

export default function PersonalResults() {
  const { user } = useAuth()
  const [view, setView] = useState('table')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  
  const [completedRaces, setCompletedRaces] = useState([])
  const [monthlyData, setMonthlyData] = useState([
    { month: 'T1', races: 0, wins: 0, top3: 0, points: 0 },
    { month: 'T2', races: 0, wins: 0, top3: 0, points: 0 },
    { month: 'T3', races: 0, wins: 0, top3: 0, points: 0 },
    { month: 'T4', races: 0, wins: 0, top3: 0, points: 0 },
    { month: 'T5', races: 0, wins: 0, top3: 0, points: 0 },
    { month: 'T6', races: 0, wins: 0, top3: 0, points: 0 },
  ])

  useEffect(() => {
    let cancelled = false
    async function loadResults() {
      try {
        setLoading(true)
        if (!user?.id) return
        
        try {
          const pData = await jockeyService.getJockeyProfile(user.id)
          if (!cancelled) setProfile(pData)
        } catch (_) {}
        
        const tournaments = await tournamentService.getTournaments()
        if (cancelled || !Array.isArray(tournaments)) {
          setLoading(false)
          return
        }
        
        const raceList = []
        const monthsList = [
          { month: 'T1', races: 0, wins: 0, top3: 0, points: 0 },
          { month: 'T2', races: 0, wins: 0, top3: 0, points: 0 },
          { month: 'T3', races: 0, wins: 0, top3: 0, points: 0 },
          { month: 'T4', races: 0, wins: 0, top3: 0, points: 0 },
          { month: 'T5', races: 0, wins: 0, top3: 0, points: 0 },
          { month: 'T6', races: 0, wins: 0, top3: 0, points: 0 },
        ]
        
        const promises = tournaments.map(async (t) => {
          try {
            const schedule = await tournamentService.getTournamentSchedule(t.id)
            if (Array.isArray(schedule)) {
              schedule.forEach(race => {
                const participations = race.participations || race.raceParticipations || [];
                const raceResults = race.results || race.raceResults || [];
                
                participations.forEach(p => {
                  const jockeyId = p.jockeyId || p.jockey?.id;
                  if (jockeyId === user?.id) {
                    const status = (p.status || '').toUpperCase();
                    if (status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'APPROVED') {
                      const matchedResult = raceResults.find(resItem => resItem.participationId === p.id);
                      const isCompleted = race.status === 'COMPLETED' || !!matchedResult;
                      
                      if (isCompleted) {
                        const pos = matchedResult ? (matchedResult.rankPosition || matchedResult.rank || 'N/A') : 'N/A';
                        const pts = p.pointsEarned || p.points || 0;
                        const raceDateObj = race.raceDate ? new Date(race.raceDate) : null;
                        
                        raceList.push({
                          raceId: race.id,
                          race: race.raceName || race.name || 'Cuộc đua',
                          horse: p.horseName || p.horse?.name || 'Ngựa thi đấu',
                          time: matchedResult?.finishTime || 'N/A',
                          points: pts,
                          date: race.raceDate ? new Date(race.raceDate).toLocaleDateString() : 'Chưa rõ',
                          rawDate: raceDateObj,
                          position: pos
                        });
                        
                        if (raceDateObj) {
                          const mIdx = raceDateObj.getMonth(); // 0-11
                          if (mIdx >= 0 && mIdx < 6) {
                            monthsList[mIdx].races++;
                            monthsList[mIdx].points += pts;
                            
                            const numPos = parseInt(pos, 10);
                            if (numPos === 1) {
                              monthsList[mIdx].wins++;
                            }
                            if (numPos >= 1 && numPos <= 3) {
                              monthsList[mIdx].top3++;
                            }
                          }
                        }
                      }
                    }
                  }
                });
              });
            }
          } catch (_) {}
        })
        
        await Promise.all(promises)
        if (!cancelled) {
          // Sort races descending by date
          raceList.sort((a, b) => {
            if (!a.rawDate) return 1;
            if (!b.rawDate) return -1;
            return b.rawDate - a.rawDate;
          })
          setCompletedRaces(raceList)
          setMonthlyData(monthsList)
        }
      } catch (err) {
        console.warn("Failed to load personal results:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    loadResults()
    return () => { cancelled = true }
  }, [user?.id])

  const totalWins = monthlyData.reduce((s, m) => s + m.wins, 0)
  const totalRaces = monthlyData.reduce((s, m) => s + m.races, 0)
  const totalPoints = monthlyData.reduce((s, m) => s + m.points, 0)
  const totalTop3 = monthlyData.reduce((s, m) => s + m.top3, 0)
  
  const MONTH_MAX = Math.max(...monthlyData.map((m) => m.points), 1)
  const WINS_MAX = Math.max(...monthlyData.map((m) => m.wins), 1)

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải kết quả thi đấu...
      </div>
    )
  }

  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Kết quả thi đấu cá nhân</h1>
          <p className="jockey-page-sub">Thống kê thành tích thi đấu của {profile?.fullName ?? user?.name ?? 'Jockey'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`jockey-btn jockey-btn--sm ${view === 'table' ? 'jockey-btn--teal' : 'jockey-btn--ghost'}`}
            onClick={() => setView('table')}
          >
            ☰ Danh sách
          </button>
          <button
            type="button"
            className={`jockey-btn jockey-btn--sm ${view === 'chart' ? 'jockey-btn--teal' : 'jockey-btn--ghost'}`}
            onClick={() => setView('chart')}
          >
            ▤ Biểu đồ
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="jockey-stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="jockey-stat-card">
          <span>Tổng cuộc đua (6T)</span>
          <strong>{totalRaces}</strong>
        </div>
        <div className="jockey-stat-card">
          <span>Chiến thắng</span>
          <strong>{totalWins}</strong>
          <em>Tỷ lệ {totalRaces > 0 ? ((totalWins / totalRaces) * 100).toFixed(1) : '0.0'}%</em>
        </div>
        <div className="jockey-stat-card">
          <span>Top 3</span>
          <strong>{totalTop3}</strong>
          <em>{totalRaces > 0 ? ((totalTop3 / totalRaces) * 100).toFixed(1) : '0.0'}% cuộc đua</em>
        </div>
        <div className="jockey-stat-card">
          <span>Điểm tích lũy (6T)</span>
          <strong>{totalPoints.toLocaleString()}</strong>
          <em>TB {totalRaces > 0 ? Math.round(totalPoints / totalRaces) : 0} pts/race</em>
        </div>
      </div>

      {view === 'chart' ? (
        /* ── chart view ── */
        <div className="res-chart-section">
          <div className="jockey-card">
            <div className="jockey-card-head"><h3>Điểm tích lũy theo tháng</h3></div>
            <div className="jockey-card-body">
              <div className="res-chart">
                {monthlyData.map((m) => (
                  <div key={m.month} className="res-chart-col">
                    <div className="res-chart-val">{m.points}</div>
                    <div
                      className="res-chart-bar res-chart-bar--points"
                      style={{ height: `${(m.points / MONTH_MAX) * 100}%` }}
                    />
                    <span>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="jockey-card">
            <div className="jockey-card-head"><h3>Số lần thắng theo tháng</h3></div>
            <div className="jockey-card-body">
              <div className="res-chart">
                {monthlyData.map((m) => (
                  <div key={m.month} className="res-chart-col">
                    <div className="res-chart-val">{m.wins}</div>
                    <div
                      className="res-chart-bar res-chart-bar--wins"
                      style={{ height: `${(m.wins / WINS_MAX) * 100}%` }}
                    />
                    <span>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* monthly breakdown table */}
          <div className="jockey-card" style={{ gridColumn: '1 / -1' }}>
            <div className="jockey-card-head"><h3>Chi tiết theo tháng</h3></div>
            <div className="jockey-table-wrap">
              <table className="jockey-table">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th>Số đua</th>
                    <th>Thắng</th>
                    <th>Top 3</th>
                    <th>Điểm</th>
                    <th>Tỷ lệ thắng</th>
                    <th>Hiệu suất</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m) => {
                    const pct = m.races > 0 ? Math.round((m.wins / m.races) * 100) : 0
                    return (
                      <tr key={m.month}>
                        <td style={{ color: '#fff', fontWeight: 600 }}>{m.month}/2026</td>
                        <td>{m.races}</td>
                        <td style={{ color: '#4ade80', fontWeight: 600 }}>{m.wins}</td>
                        <td style={{ color: '#d4af37' }}>{m.top3}</td>
                        <td style={{ color: '#d4af37', fontWeight: 600 }}>{m.points}</td>
                        <td>
                          <div className="res-winrate-bar-wrap">
                            <div className="res-winrate-bar">
                              <div
                                className="res-winrate-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`jockey-badge ${pct >= 40 ? 'jockey-badge--green' : pct >= 25 ? 'jockey-badge--teal' : 'jockey-badge--gray'}`}>
                            {pct >= 40 ? 'Xuất sắc' : pct >= 25 ? 'Tốt' : 'Trung bình'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── table view ── */
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Chi tiết từng cuộc đua</h3>
            <span style={{ fontSize: 12, color: '#555' }}>
              {completedRaces.length} kết quả gần đây
            </span>
          </div>
          <div className="jockey-table-wrap">
            <table className="jockey-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Cuộc đua</th>
                  <th>Ngựa</th>
                  <th>Thời gian HT</th>
                  <th>Điểm</th>
                  <th>Ngày thi đấu</th>
                  <th>Hiệu suất</th>
                </tr>
              </thead>
              <tbody>
                {completedRaces.length > 0 ? (
                  completedRaces.map((r) => {
                    const isNumeric = !isNaN(parseInt(r.position, 10))
                    const numPos = isNumeric ? parseInt(r.position, 10) : 999
                    return (
                      <tr key={r.raceId}>
                        <td><PositionMedal pos={r.position} /></td>
                        <td style={{ color: '#fff', fontWeight: 600 }}>{r.race}</td>
                        <td>
                          <span style={{ color: '#d4af37' }}>🐴 {r.horse}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#ccc' }}>{r.time}</td>
                        <td>
                          <span style={{
                            color: r.points >= 100 ? '#d4af37' : r.points >= 70 ? '#4ade80' : '#888',
                            fontWeight: 700,
                          }}>
                            +{r.points} pts
                          </span>
                        </td>
                        <td style={{ color: '#666', fontSize: 12 }}>{r.date}</td>
                        <td>
                          <span className={`jockey-badge ${numPos === 1 ? 'jockey-badge--gold' : numPos <= 3 ? 'jockey-badge--green' : numPos <= 5 ? 'jockey-badge--teal' : 'jockey-badge--gray'}`}>
                            {numPos === 1 ? 'Vô địch' : numPos <= 3 ? 'Top 3' : numPos <= 5 ? 'Top 5' : 'Hoàn thành'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#666', padding: '30px 10px' }}>
                      Chưa có dữ liệu kết quả cuộc đua nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

