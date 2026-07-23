import React, { useState } from 'react'

export default function JockeyAllRaces() {
  const [races] = useState([
    { id: 'R-1042', name: 'Derby Một Dặm', tournament: 'Derby Quốc Gia', date: '2026-06-03', time: '15:10', distance: '1600m', status: 'Sắp diễn ra' },
    { id: 'R-1043', name: 'Đua nước rút', tournament: 'Derby Quốc Gia', date: '2026-06-03', time: '14:30', distance: '1200m', status: 'Đang diễn ra' }
  ])

  return (
    <div style={{ padding: '24px', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Tất Cả Cuộc Đua Kỵ Sĩ</h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>Danh sách tất cả các trận đua trong khuôn khổ các giải đấu</p>

      <div style={{ background: 'rgba(18, 18, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#aaa', textTransform: 'uppercase', fontSize: '11px' }}>
              <th style={{ padding: '16px 20px' }}>Mã Trận</th>
              <th style={{ padding: '16px 20px' }}>Tên Cuộc Đua</th>
              <th style={{ padding: '16px 20px' }}>Giải Đấu</th>
              <th style={{ padding: '16px 20px' }}>Cự Ly</th>
              <th style={{ padding: '16px 20px' }}>Thời Gian</th>
              <th style={{ padding: '16px 20px' }}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {races.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px 20px', color: '#888' }}>{r.id}</td>
                <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{r.name}</td>
                <td style={{ padding: '16px 20px', color: '#ccc' }}>{r.tournament}</td>
                <td style={{ padding: '16px 20px' }}>{r.distance}</td>
                <td style={{ padding: '16px 20px', color: '#aaa' }}>{r.date} {r.time}</td>
                <td style={{ padding: '16px 20px', color: '#4ade80' }}>● {r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
