import React, { useState } from 'react'
import { horseRankings, jockeyRankings } from '../../../data/adminMockData'
import './RankingManagement.css'

export default function RankingManagement() {
  const [tab, setTab] = useState('horses')

  return (
    <div className="ranking-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Xếp hạng</h1>
          <p className="admin-page-sub">Bảng xếp hạng ngựa và jockey theo mùa giải</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button type="button" className={`admin-tab${tab === 'horses' ? ' is-active' : ''}`} onClick={() => setTab('horses')}>Ngựa</button>
        <button type="button" className={`admin-tab${tab === 'jockeys' ? ' is-active' : ''}`} onClick={() => setTab('jockeys')}>Jockey</button>
      </div>

      {tab === 'horses' ? (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table ranking-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên ngựa</th>
                  <th>Chủ stables</th>
                  <th>Điểm</th>
                  <th>Chiến thắng</th>
                  <th>Số race</th>
                </tr>
              </thead>
              <tbody>
                {horseRankings.map((h) => (
                  <tr key={h.rank}>
                    <td><span className="ranking-num">#{h.rank}</span></td>
                    <td><strong>{h.name}</strong></td>
                    <td>{h.owner}</td>
                    <td className="ranking-points">{h.points.toLocaleString()}</td>
                    <td>{h.wins}</td>
                    <td>{h.races}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table ranking-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Jockey</th>
                  <th>Điểm</th>
                  <th>Chiến thắng</th>
                  <th>Số race</th>
                </tr>
              </thead>
              <tbody>
                {jockeyRankings.map((j) => (
                  <tr key={j.rank}>
                    <td><span className="ranking-num">#{j.rank}</span></td>
                    <td><strong>{j.name}</strong></td>
                    <td className="ranking-points">{j.points.toLocaleString()}</td>
                    <td>{j.wins}</td>
                    <td>{j.races}</td>
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
