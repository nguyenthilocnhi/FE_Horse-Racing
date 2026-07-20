import React, { useState } from 'react'
import {
  personalResults,
  recentResultDetails,
  jockeyProfile,
} from '../../../data/jockeyMockData'
import './PersonalResults.css'

const MONTH_MAX = Math.max(...personalResults.map((m) => m.points))
const WINS_MAX = Math.max(...personalResults.map((m) => m.wins))

function PositionMedal({ pos }) {
  const cls =
    pos === 1 ? 'jockey-medal--1' :
    pos === 2 ? 'jockey-medal--2' :
    pos === 3 ? 'jockey-medal--3' :
    'jockey-medal--n'
  return <span className={`jockey-medal ${cls}`}>{pos}</span>
}

export default function PersonalResults() {
  const [view, setView] = useState('table')

  const totalWins = personalResults.reduce((s, m) => s + m.wins, 0)
  const totalRaces = personalResults.reduce((s, m) => s + m.races, 0)
  const totalPoints = personalResults.reduce((s, m) => s + m.points, 0)
  const totalTop3 = personalResults.reduce((s, m) => s + m.top3, 0)

  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Kết quả thi đấu cá nhân</h1>
          <p className="jockey-page-sub">Thống kê thành tích thi đấu của {jockeyProfile.name}</p>
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
          <em>Tỷ lệ {((totalWins / totalRaces) * 100).toFixed(1)}%</em>
        </div>
        <div className="jockey-stat-card">
          <span>Top 3</span>
          <strong>{totalTop3}</strong>
          <em>{((totalTop3 / totalRaces) * 100).toFixed(1)}% cuộc đua</em>
        </div>
        <div className="jockey-stat-card">
          <span>Điểm tích lũy (6T)</span>
          <strong>{totalPoints.toLocaleString()}</strong>
          <em>TB {Math.round(totalPoints / totalRaces)} pts/race</em>
        </div>
      </div>

      {view === 'chart' ? (
        /* ── chart view ── */
        <div className="res-chart-section">
          <div className="jockey-card">
            <div className="jockey-card-head"><h3>Điểm tích lũy theo tháng</h3></div>
            <div className="jockey-card-body">
              <div className="res-chart">
                {personalResults.map((m) => (
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
                {personalResults.map((m) => (
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
                  {personalResults.map((m) => {
                    const pct = Math.round((m.wins / m.races) * 100)
                    return (
                      <tr key={m.month}>
                        <td style={{ color: '#fff', fontWeight: 600 }}>{m.month}/2026</td>
                        <td>{m.races}</td>
                        <td style={{ color: '#4ade80', fontWeight: 600 }}>{m.wins}</td>
                        <td style={{ color: '#d4af37' }}>{m.top3}</td>
                        <td style={{ color: '#00d4aa', fontWeight: 600 }}>{m.points}</td>
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
              {recentResultDetails.length} kết quả gần đây
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
                {recentResultDetails.map((r) => (
                  <tr key={r.raceId}>
                    <td><PositionMedal pos={r.position} /></td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{r.race}</td>
                    <td>
                      <span style={{ color: '#00d4aa' }}>🐴 {r.horse}</span>
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
                      <span className={`jockey-badge ${r.position === 1 ? 'jockey-badge--gold' : r.position <= 3 ? 'jockey-badge--green' : r.position <= 5 ? 'jockey-badge--teal' : 'jockey-badge--gray'}`}>
                        {r.position === 1 ? 'Vô địch' : r.position <= 3 ? 'Top 3' : r.position <= 5 ? 'Top 5' : 'Hoàn thành'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
