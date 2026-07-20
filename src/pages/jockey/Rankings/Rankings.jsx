import React, { useState } from 'react'
import { globalRankings, jockeyProfile } from '../../../data/jockeyMockData'
import './Rankings.css'

const TREND_ICON = {
  up: <span className="jockey-trend--up">▲</span>,
  down: <span className="jockey-trend--down">▼</span>,
  same: <span className="jockey-trend--same">—</span>,
}

function MedalCell({ rank }) {
  if (rank === 1) return <span className="rank-medal rank-medal--1">🥇</span>
  if (rank === 2) return <span className="rank-medal rank-medal--2">🥈</span>
  if (rank === 3) return <span className="rank-medal rank-medal--3">🥉</span>
  return <span className="rank-num">#{rank}</span>
}

export default function Rankings() {
  const [search, setSearch] = useState('')

  const myRank = globalRankings.find((r) => r.isMe)
  const filtered = globalRankings.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.nationality.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Bảng xếp hạng Jockey</h1>
          <p className="jockey-page-sub">Thứ hạng toàn quốc · Cập nhật sau mỗi cuộc đua</p>
        </div>
      </div>

      {/* My rank highlight */}
      {myRank && (
        <div className="rank-my-card">
          <div className="rank-my-avatar">
            {jockeyProfile.name.charAt(0)}
          </div>
          <div className="rank-my-info">
            <div className="rank-my-name">{myRank.name}</div>
            <div className="rank-my-sub">{myRank.nationality} · {jockeyProfile.licenseNo}</div>
          </div>
          <div className="rank-my-stats">
            <div className="rank-my-stat">
              <span>Hạng</span>
              <strong>#{myRank.rank}</strong>
            </div>
            <div className="rank-my-stat">
              <span>Điểm</span>
              <strong>{myRank.points.toLocaleString()}</strong>
            </div>
            <div className="rank-my-stat">
              <span>Thắng</span>
              <strong>{myRank.wins}</strong>
            </div>
            <div className="rank-my-stat">
              <span>Tỷ lệ</span>
              <strong>{myRank.winRate}%</strong>
            </div>
          </div>
          <div className="rank-my-trend">
            {TREND_ICON[myRank.trend]}
            <span>Xu hướng</span>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      <div className="rank-podium">
        {/* 2nd */}
        <div className="rank-podium-item rank-podium-item--2">
          <div className="rank-podium-avatar rank-podium-avatar--2">
            {globalRankings[1].name.charAt(0)}
          </div>
          <div className="rank-podium-name">{globalRankings[1].name}</div>
          <div className="rank-podium-country">{globalRankings[1].nationality}</div>
          <div className="rank-podium-pts">{globalRankings[1].points.toLocaleString()} pts</div>
          <div className="rank-podium-step rank-podium-step--2">🥈 #2</div>
        </div>

        {/* 1st */}
        <div className="rank-podium-item rank-podium-item--1">
          <div className="rank-podium-crown">👑</div>
          <div className="rank-podium-avatar rank-podium-avatar--1">
            {globalRankings[0].name.charAt(0)}
          </div>
          <div className="rank-podium-name">{globalRankings[0].name}</div>
          <div className="rank-podium-country">{globalRankings[0].nationality}</div>
          <div className="rank-podium-pts">{globalRankings[0].points.toLocaleString()} pts</div>
          <div className="rank-podium-step rank-podium-step--1">🥇 #1</div>
        </div>

        {/* 3rd */}
        <div className="rank-podium-item rank-podium-item--3">
          <div className="rank-podium-avatar rank-podium-avatar--3">
            {globalRankings[2].name.charAt(0)}
          </div>
          <div className="rank-podium-name">{globalRankings[2].name}</div>
          <div className="rank-podium-country">{globalRankings[2].nationality}</div>
          <div className="rank-podium-pts">{globalRankings[2].points.toLocaleString()} pts</div>
          <div className="rank-podium-step rank-podium-step--3">🥉 #3</div>
        </div>
      </div>

      {/* Full table */}
      <div className="jockey-card">
        <div className="jockey-card-head">
          <h3>Bảng xếp hạng đầy đủ</h3>
          <input
            className="jockey-input"
            style={{ minWidth: 220, padding: '7px 12px' }}
            placeholder="Tìm jockey, quốc tịch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="jockey-table-wrap">
          <table className="jockey-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Jockey</th>
                <th>Quốc tịch</th>
                <th>Thắng</th>
                <th>Tổng đua</th>
                <th>Tỷ lệ thắng</th>
                <th>Điểm</th>
                <th>Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.rank} className={r.isMe ? 'is-me' : ''}>
                  <td><MedalCell rank={r.rank} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`rank-avatar-mini ${r.isMe ? 'rank-avatar-mini--me' : ''}`}>
                        {r.name.charAt(0)}
                      </span>
                      <div>
                        <div style={{ fontWeight: r.isMe ? 700 : 500, color: r.isMe ? '#00d4aa' : '#fff' }}>
                          {r.name}
                          {r.isMe && <span className="rank-you-tag">Bạn</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#888' }}>{r.nationality}</td>
                  <td style={{ color: '#4ade80', fontWeight: 600 }}>{r.wins}</td>
                  <td>{r.races}</td>
                  <td>
                    <div className="rank-winrate">
                      <div className="rank-winrate-bar">
                        <div
                          className="rank-winrate-fill"
                          style={{ width: `${r.winRate}%` }}
                        />
                      </div>
                      <span>{r.winRate}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: '#d4af37', fontWeight: 700 }}>
                      {r.points.toLocaleString()}
                    </span>
                  </td>
                  <td>{TREND_ICON[r.trend]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="jockey-empty">
            <span className="jockey-empty-icon">🏆</span>
            <span className="jockey-empty-text">Không tìm thấy jockey phù hợp.</span>
          </div>
        )}
      </div>
    </div>
  )
}
