import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import * as jockeyService from '../../../services/jockeyService'
import * as tournamentService from '../../../services/tournamentService'
import './JockeyDashboard.css'

function StatCard({ stat }) {
  return (
    <div className="jockey-stat-card">
      <span>{stat.label}</span>
      <strong>{stat.value}{stat.unit && <small style={{ fontSize: '0.9rem', marginLeft: 2 }}>{stat.unit}</small>}</strong>
    </div>
  )
}

function MiniResultRow({ r }) {
  const isNumeric = !isNaN(parseInt(r.position, 10))
  const posClass = isNumeric 
    ? (parseInt(r.position, 10) === 1 
        ? 'jockey-medal--1' 
        : parseInt(r.position, 10) === 2 
          ? 'jockey-medal--2' 
          : parseInt(r.position, 10) === 3 
            ? 'jockey-medal--3' 
            : 'jockey-medal--n')
    : 'jockey-medal--n'
  return (
    <tr>
      <td><span className={`jockey-medal ${posClass}`}>{r.position}</span></td>
      <td style={{ color: '#fff' }}>{r.race}</td>
      <td>{r.horse}</td>
      <td style={{ color: '#d4af37', fontWeight: 600 }}>+{r.points} pts</td>
      <td style={{ color: '#555', fontSize: 12 }}>{r.date}</td>
    </tr>
  )
}

export default function JockeyDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [rank, setRank] = useState('N/A')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRaces: 0,
    wins: 0,
    winRate: 0,
    totalPoints: 0
  })
  const [upcoming, setUpcoming] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [pendingInvitations, setPendingInvitations] = useState(0)
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0])
  const chartMonths = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']

  useEffect(() => {
    let cancelled = false
    async function loadDashboard() {
      try {
        setLoading(true)
        if (!user?.id) return
        
        // 1. Fetch profile
        try {
          const pData = await jockeyService.getJockeyProfile(user.id)
          if (!cancelled) setProfile(pData)
        } catch (_) {}
        
        // 2. Fetch tournaments
        const tournaments = await tournamentService.getTournaments()
        if (cancelled || !Array.isArray(tournaments)) {
          setLoading(false)
          return
        }
        
        // Find personal ranking in the active tournament if possible
        const activeTour = tournaments.find(t => t.status === 'ACTIVE' || t.status === 'UPCOMING') || tournaments[0]
        if (activeTour) {
          try {
            const rData = await tournamentService.getJockeyRankings(activeTour.id)
            if (Array.isArray(rData)) {
              const myRanking = rData.find(item => item.jockeyId === user.id || item.id === user.id)
              if (myRanking && !cancelled) {
                setRank(`#${myRanking.rank} Toàn quốc`)
              }
            }
          } catch (_) {}
        }
        
        let totalRaces = 0
        let wins = 0
        let totalPoints = 0
        let pendingCount = 0
        const allRaces = []
        
        // Month indexes 0-11 points
        const monthlyAcc = Array(12).fill(0)
        
        // 3. Fetch schedules to parse races, results and invitations
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
                    
                    if (status === 'PENDING' || status === 'PENDING_CONFIRMATION') {
                      pendingCount++;
                    } else if (status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'APPROVED') {
                      const matchedResult = raceResults.find(resItem => resItem.participationId === p.id);
                      const isCompleted = race.status === 'COMPLETED' || !!matchedResult;
                      
                      const raceDateObj = race.raceDate ? new Date(race.raceDate) : null;
                      
                      const raceInfo = {
                        raceId: race.id,
                        name: race.raceName || race.name || 'Cuộc đua',
                        venue: t.location || t.venue || 'Trường đua',
                        date: race.raceDate ? new Date(race.raceDate).toLocaleDateString() : 'Chưa rõ',
                        time: race.startTime ? new Date(race.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Chưa rõ',
                        rawDate: raceDateObj,
                        horse: p.horseName || p.horse?.name || 'Ngựa thi đấu',
                        distance: race.distance || '1000m',
                        status: isCompleted ? 'completed' : 'upcoming',
                        position: matchedResult ? (matchedResult.rankPosition || matchedResult.rank || 'N/A') : 'N/A',
                        points: p.pointsEarned || p.points || 0
                      };
                      
                      allRaces.push(raceInfo);
                      
                      if (isCompleted) {
                        totalRaces++;
                        const pts = p.pointsEarned || p.points || 0;
                        totalPoints += pts;
                        
                        if (raceDateObj) {
                          const mIdx = raceDateObj.getMonth(); // 0-11
                          monthlyAcc[mIdx] += pts;
                        }
                        
                        if (matchedResult && (matchedResult.rankPosition === 1 || matchedResult.rank === 1)) {
                          wins++;
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
        
        if (cancelled) return
        
        // Split races
        const upcomingRaces = allRaces.filter(r => r.status === 'upcoming')
        const completedRaces = allRaces.filter(r => r.status === 'completed')
        
        // Sort upcoming by date
        upcomingRaces.sort((a, b) => {
          if (!a.rawDate) return 1;
          if (!b.rawDate) return -1;
          return a.rawDate - b.rawDate;
        })
        
        // Sort completed by date descending
        completedRaces.sort((a, b) => {
          if (!a.rawDate) return 1;
          if (!b.rawDate) return -1;
          return b.rawDate - a.rawDate;
        })
        
        setUpcomingCount(upcomingRaces.length)
        setPendingInvitations(pendingCount)
        setStats({
          totalRaces,
          wins,
          winRate: totalRaces > 0 ? Math.round((wins / totalRaces) * 100) : 0,
          totalPoints
        })
        
        if (upcomingRaces.length > 0) {
          const nextRace = upcomingRaces[0]
          let daysLeft = '?'
          if (nextRace.rawDate) {
            const diffTime = nextRace.rawDate - new Date()
            daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
          }
          setUpcoming({ ...nextRace, daysLeft })
        }
        
        setRecentResults(completedRaces.slice(0, 4))
        
        // Set chart points for T1-T6 (January to June)
        setChartData(monthlyAcc.slice(0, 6))
        
      } catch (err) {
        console.warn("Failed to load dashboard statistics:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    loadDashboard()
    return () => { cancelled = true }
  }, [user?.id])

  const statsList = [
    { label: 'Tổng số đua', value: stats.totalRaces },
    { label: 'Số chiến thắng', value: stats.wins },
    { label: 'Tỷ lệ thắng', value: stats.winRate, unit: '%' },
    { label: 'Tổng điểm tích lũy', value: stats.totalPoints },
  ]
  const maxChart = Math.max(...chartData, 1)

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải trang tổng quan...
      </div>
    )
  }

  return (
    <div className="jk-dashboard">
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Xin chào, {profile?.fullName ?? user?.name ?? 'Jockey'} 👋</h1>
          <p className="jockey-page-sub">
            Hạng hiện tại <strong style={{ color: '#d4af37' }}>{rank}</strong> {profile?.licenseNumber ? `· Giấy phép ${profile.licenseNumber}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/jockey/invitations" className="jockey-btn jockey-btn--outline">
            ✉ Xem lời mời ({pendingInvitations})
          </Link>
          <Link to="/jockey/profile" className="jockey-btn jockey-btn--teal">
            ◎ Hồ sơ
          </Link>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="jockey-stat-grid">
        {statsList.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* Upcoming race banner */}
      {upcoming ? (
        <div className="jk-upcoming-banner">
          <div className="jk-upcoming-label">🏁 CUỘC ĐUA SẮP TỚI</div>
          <div className="jk-upcoming-name">{upcoming.name}</div>
          <div className="jk-upcoming-meta">
            <span>📍 {upcoming.venue}</span>
            <span>📅 {upcoming.date} · {upcoming.time}</span>
            <span>🐴 {upcoming.horse}</span>
            <span>📏 {upcoming.distance}</span>
          </div>
          <div className="jk-upcoming-countdown">
            <span className="jk-countdown-num">{upcoming.daysLeft}</span>
            <span className="jk-countdown-label">ngày nữa</span>
          </div>
          <Link to="/jockey/my-races" className="jockey-btn jockey-btn--teal jockey-btn--sm">
            Chi tiết →
          </Link>
        </div>
      ) : (
        <div className="jk-upcoming-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <span style={{ color: '#888' }}>Không có lịch đua sắp tới.</span>
        </div>
      )}

      <div className="jk-dashboard-grid">
        {/* Chart */}
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Điểm tích lũy theo tháng</h3>
            <Link to="/jockey/results" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none' }}>
              Chi tiết →
            </Link>
          </div>
          <div className="jockey-card-body">
            <div className="jk-chart">
              {chartMonths.map((m, i) => (
                <div key={m} className="jk-chart-col">
                  <div className="jk-chart-value">{chartData[i]}</div>
                  <div
                    className="jk-chart-bar"
                    style={{ height: `${(chartData[i] / maxChart) * 100}%` }}
                  />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Kết quả gần đây</h3>
            <Link to="/jockey/results" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none' }}>
              Xem tất cả →
            </Link>
          </div>
          <div className="jockey-table-wrap">
            <table className="jockey-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Cuộc đua</th>
                  <th>Ngựa</th>
                  <th>Điểm</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentResults.length > 0 ? (
                  recentResults.map((r) => <MiniResultRow key={r.raceId} r={r} />)
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '30px 10px' }}>
                      Chưa có kết quả thi đấu gần đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="jk-quick-grid">
        <Link to="/jockey/invitations" className="jk-quick-card">
          <span className="jk-quick-icon">✉</span>
          <strong>Lời mời thi đấu</strong>
          <p>{pendingInvitations} lời mời chờ phản hồi</p>
        </Link>
        <Link to="/jockey/my-races" className="jk-quick-card">
          <span className="jk-quick-icon">🏁</span>
          <strong>Lịch thi đấu</strong>
          <p>{upcomingCount} cuộc đua sắp tới</p>
        </Link>
        <Link to="/jockey/rankings" className="jk-quick-card">
          <span className="jk-quick-icon">🏆</span>
          <strong>Bảng xếp hạng</strong>
          <p>{rank} · {stats.totalPoints.toLocaleString()} điểm</p>
        </Link>
        <Link to="/jockey/profile" className="jk-quick-card">
          <span className="jk-quick-icon">◎</span>
          <strong>Hồ sơ jockey</strong>
          <p>Cập nhật thông tin cá nhân</p>
        </Link>
      </div>
    </div>
  )
}

