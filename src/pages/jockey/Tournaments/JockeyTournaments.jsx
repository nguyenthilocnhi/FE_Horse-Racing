import React, { useState } from 'react'

export default function JockeyTournaments() {
  const [tournaments] = useState([
    { id: 'T-001', name: 'Cúp Vàng Hoàng Gia 2026', startDate: '2026-09-12', venue: 'Ascot Grand Arena', status: 'Sắp diễn ra' },
    { id: 'T-002', name: 'Derby Quốc Gia', startDate: '2026-06-03', venue: 'Saigon Racecourse', status: 'Đang diễn ra' }
  ])

  return (
    <div style={{ padding: '24px', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Giải Đấu Kỵ Sĩ</h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>Các giải đấu mà kỵ sĩ đã được mời hoặc đăng ký thi đấu</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {tournaments.map((t) => (
          <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#d4af37', fontWeight: 'bold' }}>{t.id}</span>
            <h3 style={{ margin: '8px 0', fontSize: '18px' }}>{t.name}</h3>
            <p style={{ color: '#aaa', fontSize: '14px', margin: '4px 0' }}>📍 {t.venue}</p>
            <p style={{ color: '#aaa', fontSize: '14px', margin: '4px 0' }}>📅 Ngày khai mạc: {t.startDate}</p>
            <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', color: '#4ade80' }}>● {t.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
