import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import * as tournamentService from '../../../services/tournamentService'
import * as jockeyService from '../../../services/jockeyService'
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
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [rankings, setRankings] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadRankings() {
      try {
        setLoading(true)
        if (user?.id) {
          try {
            const pData = await jockeyService.getJockeyProfile(user.id)
            if (!cancelled) setProfile(pData)
          } catch (_) {}
        }

        const tournaments = await tournamentService.getTournaments()
        if (cancelled || !Array.isArray(tournaments) || tournaments.length === 0) {
          setLoading(false)
          return
        }

        // Use the first tournament or look for an active one
        const activeTour = tournaments.find(t => t.status === 'ACTIVE' || t.status === 'UPCOMING') || tournaments[0]
        const data = await tournamentService.getJockeyRankings(activeTour.id)
        
        if (cancelled) return
        
        if (Array.isArray(data)) {
          const mapped = data.map((item, index) => ({
            rank: item.rank || index + 1,
            name: item.jockeyName || item.fullName || item.name || 'Jockey',
            nationality: item.nationality || 'Việt Nam',
            wins: item.wins || 0,
            races: item.totalRaces || item.races || 0,
            winRate: item.winRate || (item.totalRaces ? Math.round((item.wins / item.totalRaces) * 100) : 0),
            points: item.points || 0,
            trend: item.trend || 'same',
            isMe: item.jockeyId === user?.id || item.id === user?.id
          }))
          mapped.sort((a, b) => a.rank - b.rank)
          setRankings(mapped)
        }
      } catch (err) {
        console.warn("Failed to load rankings from API:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRankings()
    return () => { cancelled = true }
  }, [user?.id])

  const myRank = rankings.find((r) => r.isMe)
  const filtered = rankings.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.nationality.toLowerCase().includes(search.toLowerCase())
  )

  const top1 = rankings.find(r => r.rank === 1)
  const top2 = rankings.find(r => r.rank === 2)
  const top3 = rankings.find(r => r.rank === 3)

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải bảng xếp hạng...
      </div>
    )
  }

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
            {myRank.name.charAt(0)}
          </div>
          <div className="rank-my-info">
            <div className="rank-my-name">{myRank.name}</div>
            <div className="rank-my-sub">{myRank.nationality} {profile?.licenseNumber ? `· ${profile.licenseNumber}` : ''}</div>
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
      {(top1 || top2 || top3) && (
        <div className="rank-podium">
          {/* 2nd */}
          {top2 && (
            <div className="rank-podium-item rank-podium-item--2">
              <div className="rank-podium-avatar rank-podium-avatar--2">
                {top2.name.charAt(0)}
              </div>
              <div className="rank-podium-name">{top2.name}</div>
              <div className="rank-podium-country">{top2.nationality}</div>
              <div className="rank-podium-pts">{top2.points.toLocaleString()} pts</div>
              <div className="rank-podium-step rank-podium-step--2">🥈 #2</div>
            </div>
          )}

          {/* 1st */}
          {top1 && (
            <div className="rank-podium-item rank-podium-item--1">
              <div className="rank-podium-crown">👑</div>
              <div className="rank-podium-avatar rank-podium-avatar--1">
                {top1.name.charAt(0)}
              </div>
              <div className="rank-podium-name">{top1.name}</div>
              <div className="rank-podium-country">{top1.nationality}</div>
              <div className="rank-podium-pts">{top1.points.toLocaleString()} pts</div>
              <div className="rank-podium-step rank-podium-step--1">🥇 #1</div>
            </div>
          )}

          {/* 3rd */}
          {top3 && (
            <div className="rank-podium-item rank-podium-item--3">
              <div className="rank-podium-avatar rank-podium-avatar--3">
                {top3.name.charAt(0)}
              </div>
              <div className="rank-podium-name">{top3.name}</div>
              <div className="rank-podium-country">{top3.nationality}</div>
              <div className="rank-podium-pts">{top3.points.toLocaleString()} pts</div>
              <div className="rank-podium-step rank-podium-step--3">🥉 #3</div>
            </div>
          )}
        </div>
      )}

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
                        <div style={{ fontWeight: r.isMe ? 700 : 500, color: r.isMe ? '#d4af37' : '#fff' }}>
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

