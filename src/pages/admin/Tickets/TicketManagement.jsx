import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { tickets as initialTickets, races as mockRaces } from '../../../data/adminMockData'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import './TicketManagement.css'

export default function TicketManagement() {
  const [selectedRace, setSelectedRace] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [localSearch, setLocalSearch] = useState('')
  const [racesList, setRacesList] = useState([])
  const [allTickets, setAllTickets] = useState([])
  const { searchQuery = '' } = useOutletContext() || {}

  useEffect(() => {
    // 1. Fetch available races for dropdown filter
    const loadRaces = async () => {
      const raceSet = new Set()

      // Add mock races
      mockRaces.forEach(r => r.name && raceSet.add(r.name))

      // Add local created races
      try {
        const localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
        localCreated.forEach(r => r.name && raceSet.add(r.name))
      } catch (e) { }

      // Add races from API
      try {
        const tourRes = await getAllTournaments()
        const fetchedTournaments = tourRes.data || tourRes || []
        for (const t of fetchedTournaments) {
          try {
            const schedRes = await getTournamentSchedule(t.id)
            const schedules = schedRes.data || []
            schedules.forEach(s => s.name && raceSet.add(s.name))
          } catch (err) { }
        }
      } catch (err) { }

      // Add races from tickets array
      initialTickets.forEach(t => t.race && raceSet.add(t.race))

      setRacesList(Array.from(raceSet))
    }

    // 2. Load tickets (combine mock tickets + spectator predictions from localStorage)
    const loadTickets = () => {
      let combined = [...initialTickets]

      try {
        const spectatorPreds = JSON.parse(localStorage.getItem('spectator_user_preds') || '[]')
        const specProfile = JSON.parse(localStorage.getItem('spectator_profile') || '{}')

        const specTickets = spectatorPreds.map((pred, index) => ({
          id: `TKT-LIVE-${pred.id || index + 1}`,
          buyer: specProfile.fullName || 'Khán giả (User)',
          email: specProfile.email || 'khangia@gmail.com',
          race: pred.race || 'Chưa xác định',
          horse: pred.horse || '—',
          type: pred.ticketType || 'Standard',
          quantity: 1,
          amount: pred.amount || 100000,
          paymentStatus: 'paid',
          date: pred.date || new Date().toISOString().split('T')[0]
        }))

        combined = [...specTickets, ...combined]
      } catch (e) { }

      setAllTickets(combined)
    }

    loadRaces()
    loadTickets()
  }, [])

  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()

  // Filter tickets by selected race, payment status, and search query
  const filtered = allTickets.filter((t) => {
    const matchRace = selectedRace === 'ALL' || t.race === selectedRace
    const matchStatus = statusFilter === 'ALL' || t.paymentStatus === statusFilter
    const matchSearch =
      !effectiveSearch ||
      t.buyer.toLowerCase().includes(effectiveSearch) ||
      t.email.toLowerCase().includes(effectiveSearch) ||
      t.race.toLowerCase().includes(effectiveSearch) ||
      t.id.toLowerCase().includes(effectiveSearch) ||
      (t.horse && t.horse.toLowerCase().includes(effectiveSearch))

    return matchRace && matchStatus && matchSearch
  })

  // Calculate statistics for current filter view
  const paidTickets = filtered.filter(t => t.paymentStatus === 'paid')
  const totalTicketsSold = paidTickets.reduce((sum, t) => sum + (t.quantity || 1), 0)
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.amount || 0), 0)
  const uniqueSpectatorsCount = new Set(filtered.map(t => t.email || t.buyer)).size

  return (
    <div className="ticket-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Đặt Vé Khán Giả</h1>
          <p className="admin-page-sub">Theo dõi danh sách khán giả mua vé, lọc theo cuộc đua và xem tổng quan doanh thu</p>
        </div>
      </div>

      {/* FILTER BAR & RACE SELECTOR */}
      <div className="ticket-filter-card">
        <div className="ticket-filter-group">
          <div className="ticket-filter-item">
            <label className="ticket-filter-label">🏁 Lọc Theo Cuộc Đua:</label>
            <select
              className="admin-select ticket-select--highlight"
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
            >
              <option value="ALL">✨ Tất cả cuộc đua ({racesList.length})</option>
              {racesList.map((raceName) => (
                <option key={raceName} value={raceName}>
                  🏇 {raceName}
                </option>
              ))}
            </select>
          </div>

          <div className="ticket-filter-item ticket-filter-search">
            <label className="ticket-filter-label">🔍 Tìm kiếm khán giả / mã vé:</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Nhập tên, email, mã vé hoặc tên ngựa..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SUMMARY STATS FOR SELECTED RACE */}
      <div className="ticket-stats-grid">
        <div className="ticket-stat-box">
          <span className="ticket-stat-icon">🎟️</span>
          <div>
            <div className="ticket-stat-value">{totalTicketsSold.toLocaleString('vi-VN')}</div>
            <div className="ticket-stat-label">Tổng vé đã bán {selectedRace !== 'ALL' ? `(${selectedRace})` : ''}</div>
          </div>
        </div>

        <div className="ticket-stat-box">
          <span className="ticket-stat-icon">👥</span>
          <div>
            <div className="ticket-stat-value">{uniqueSpectatorsCount}</div>
            <div className="ticket-stat-label">Khán giả mua vé</div>
          </div>
        </div>

        <div className="ticket-stat-box">
          <span className="ticket-stat-icon">💰</span>
          <div>
            <div className="ticket-stat-value ticket-amount">{formatCurrency(totalRevenue)}</div>
            <div className="ticket-stat-label">Tổng doanh thu bán vé</div>
          </div>
        </div>
      </div>

      {/* SPECTATOR TICKET BUYERS TABLE */}
      <div className="admin-card">
        <div className="admin-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>
            📋 Danh Sách Khán Giả Mua Vé {selectedRace !== 'ALL' ? `― ${selectedRace}` : '(Tất cả cuộc đua)'}
          </h3>
          <span className="admin-badge admin-badge--gold" style={{ fontSize: '12px' }}>
            Hiển thị {filtered.length} lượt vé
          </span>
        </div>

        <div className="admin-table-wrap">
          {filtered.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Khán giả (Người mua)</th>
                  <th>Email</th>
                  <th>Cuộc đua</th>
                  <th>Ngựa dự đoán</th>
                  <th>Ngày mua</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <code style={{ color: '#d4af37', background: 'rgba(212,175,55,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {t.id}
                      </code>
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{t.buyer}</strong>
                    </td>
                    <td style={{ color: '#aaa', fontSize: '13px' }}>{t.email}</td>
                    <td>
                      <span className="ticket-race-badge">🏇 {t.race}</span>
                    </td>
                    <td>
                      {t.horse && t.horse !== '—' ? (
                        <span style={{ color: '#4ade80', fontWeight: '500' }}>⭐ {t.horse}</span>
                      ) : (
                        <span style={{ color: '#666' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: '#888', fontSize: '12px' }}>{t.date || 'Hôm nay'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="ticket-empty-state">
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎟️</span>
              <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>
                Chưa có khán giả nào mua vé {selectedRace !== 'ALL' ? `cho cuộc đua "${selectedRace}"` : 'phù hợp với bộ lọc'}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
