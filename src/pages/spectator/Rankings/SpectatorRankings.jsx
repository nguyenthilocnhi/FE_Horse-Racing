import React, { useState, useEffect } from 'react'
import { resultReports, horseRankings as initialHorseRankings, jockeyRankings as initialJockeyRankings } from '../../../data/adminMockData'
import { getTournamentRankings, getJockeyRankings } from '../../../services/tournamentService'
import { StatusBadge } from '../../../utils/adminHelpers'
import './SpectatorRankings.css'

// Mock race details for modal popup
const MOCK_RESULTS = {
  'RES-801': [
    { rank: 1, horse: 'Aurelius', jockey: 'L. Anderson', time: '1m 38.4s' },
    { rank: 2, horse: 'Midnight Star', jockey: 'M. Rodriguez', time: '1m 39.1s' },
    { rank: 3, horse: 'Golden Eagle', jockey: 'S. Nakamura', time: '1m 39.8s' }
  ],
  'RES-802': [
    { rank: 1, horse: 'Midnight Star', jockey: 'M. Rodriguez', time: '1m 35.2s' },
    { rank: 2, horse: 'Aurelius', jockey: 'L. Anderson', time: '1m 35.9s' },
    { rank: 3, horse: 'Velvet Thunder', jockey: 'S. Nakamura', time: '1m 36.4s' }
  ],
  'RES-803': [
    { rank: 1, horse: 'Velvet Thunder', jockey: 'S. Nakamura', time: '1m 12.0s' },
    { rank: 2, horse: 'Midnight Star', jockey: 'M. Rodriguez', time: '1m 12.5s' },
    { rank: 3, horse: 'Storm Rider', jockey: 'L. Anderson', time: '1m 13.1s' }
  ]
}

export default function SpectatorRankings() {
  const [activeTab, setActiveTab] = useState('races') // 'races', 'horses', 'jockeys'
  const [selectedResult, setSelectedResult] = useState(null)
  const [horseRankingsState, setHorseRankingsState] = useState(initialHorseRankings)
  const [jockeyRankingsState, setJockeyRankingsState] = useState(initialJockeyRankings)
  const [loadingRankings, setLoadingRankings] = useState(false)

  useEffect(() => {
    async function loadSpectatorRankings() {
      setLoadingRankings(true)
      try {
        const resHorse = await getTournamentRankings(8)
        if (resHorse.success && resHorse.data && resHorse.data.length > 0) {
          const mappedHorses = resHorse.data.map(item => ({
            rank: item.rank || item.rankPosition || 1,
            name: item.name || item.horseName || 'Ngựa đua',
            owner: item.owner || 'Chưa xác định',
            races: item.races || 0,
            wins: item.wins || 0,
            points: item.points || 0
          }))
          setHorseRankingsState(mappedHorses)
        }

        const resJockey = await getJockeyRankings(8)
        if (resJockey.success && resJockey.data && resJockey.data.length > 0) {
          const mappedJockeys = resJockey.data.map(item => ({
            rank: item.rank || item.rankPosition || 1,
            name: item.name || item.jockeyName || 'Jockey',
            races: item.races || 0,
            wins: item.wins || 0,
            points: item.points || 0
          }))
          setJockeyRankingsState(mappedJockeys)
        }
      } catch (err) {
        console.warn('Failed to load spectator rankings API:', err)
      } finally {
        setLoadingRankings(false)
      }
    }
    loadSpectatorRankings()
  }, [])

  // Show only published or approved results for spectators to maintain realism
  const visibleResults = resultReports.filter(r => r.status === 'published' || r.status === 'approved')

  return (
    <div className="spectator-rankings">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Kết Quả & Xếp Hạng</h1>
          <p className="admin-page-sub">Xem kết quả chung cuộc của các cuộc đua và bảng xếp hạng phong độ toàn mùa giải</p>
        </div>
      </div>

      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'races' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('races')}
        >
          Kết quả Cuộc Đua
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'horses' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('horses')}
        >
          Bảng xếp hạng Ngựa
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'jockeys' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('jockeys')}
        >
          Bảng xếp hạng Jockey
        </button>
      </div>

      {activeTab === 'races' && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã kết quả</th>
                  <th>Cuộc Đua</th>
                  <th>Trọng tài giám sát</th>
                  <th>Ngày hoàn thành</th>
                  <th>Nhà Vô Địch</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.map((r) => (
                  <tr key={r.id}>
                    <td><code>#{r.id}</code></td>
                    <td><strong style={{ color: '#fff' }}>{r.race}</strong></td>
                    <td>{r.referee}</td>
                    <td>{r.submitted}</td>
                    <td><strong style={{ color: '#4ade80' }}>🥇 {r.winner}</strong></td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        onClick={() => setSelectedResult(r)}
                      >
                        Bảng Điểm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'horses' && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên Ngựa</th>
                  <th>Chủ sở hữu (Stable)</th>
                  <th>Trận đua</th>
                  <th>Số trận thắng</th>
                  <th style={{ textAlign: 'right' }}>Điểm phong độ (PTS)</th>
                </tr>
              </thead>
              <tbody>
                {horseRankingsState.map((h, idx) => (
                  <tr key={`${h.rank}-${h.name}-${idx}`}>
                    <td style={{ fontWeight: 'bold', color: h.rank === 1 ? '#d4af37' : h.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>
                      {h.rank === 1 ? '👑 1' : h.rank === 2 ? '🥈 2' : h.rank === 3 ? '🥉 3' : `#${h.rank}`}
                    </td>
                    <td><strong style={{ color: '#fff' }}>{h.name}</strong></td>
                    <td>{h.owner}</td>
                    <td>{h.races} trận</td>
                    <td style={{ color: '#4ade80' }}>{h.wins} thắng</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d4af37' }}>{h.points} PTS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'jockeys' && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên Jockey</th>
                  <th>Tổng số trận</th>
                  <th>Số trận thắng</th>
                  <th style={{ textAlign: 'right' }}>Điểm phong độ (PTS)</th>
                </tr>
              </thead>
              <tbody>
                {jockeyRankingsState.map((j, idx) => (
                  <tr key={`${j.rank}-${j.name}-${idx}`}>
                    <td style={{ fontWeight: 'bold', color: j.rank === 1 ? '#d4af37' : j.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>
                      {j.rank === 1 ? '👑 1' : j.rank === 2 ? '🥈 2' : j.rank === 3 ? '🥉 3' : `#${j.rank}`}
                    </td>
                    <td><strong style={{ color: '#fff' }}>{j.name}</strong></td>
                    <td>{j.races} trận</td>
                    <td style={{ color: '#4ade80' }}>{j.wins} thắng</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d4af37' }}>{j.points} PTS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Rankings Details Modal */}
      {selectedResult && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '500px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="admin-card-head">
              <div>
                <h3>Biên bản thành tích</h3>
                <span style={{ fontSize: '11px', color: '#d4af37' }}>{selectedResult.race}</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedResult(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#666' }}>Trọng tài giám định:</span>
                <strong style={{ color: '#fff' }}>{selectedResult.referee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
                <span style={{ color: '#666' }}>Ngày thi đấu:</span>
                <strong style={{ color: '#fff' }}>{selectedResult.submitted}</strong>
              </div>

              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#d4af37', marginBottom: '10px', letterSpacing: '0.05em' }}>Thứ tự về đích chung cuộc</h4>
              <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Hạng</th>
                      <th>Ngựa Đua</th>
                      <th>Jockey</th>
                      <th style={{ textAlign: 'right' }}>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(MOCK_RESULTS[selectedResult.id] || []).map(d => (
                      <tr key={d.rank}>
                        <td style={{ fontWeight: 'bold', color: d.rank === 1 ? '#d4af37' : d.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>
                          🏆 Hạng {d.rank}
                        </td>
                        <td style={{ color: '#fff', fontWeight: '500' }}>{d.horse}</td>
                        <td>{d.jockey}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedResult(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
