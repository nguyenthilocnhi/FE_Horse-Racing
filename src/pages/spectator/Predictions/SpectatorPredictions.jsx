import React, { useState, useEffect } from 'react'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { getRaceParticipations, getOpenTicketRaces, purchaseRaceTicket } from '../../../services/raceService'
import { createPrediction, cancelPrediction } from '../../../services/predictionService'
import { getSpectatorProfile, getSpectatorTicketHistory } from '../../../services/spectatorService'
import { useAuth } from '../../../contexts/AuthContext'
import './SpectatorPredictions.css'

export default function SpectatorPredictions() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [loadingRunners, setLoadingRunners] = useState(false)

  // Selection states
  const [predictedHorse, setPredictedHorse] = useState('')
  const [ticketType, setTicketType] = useState('standard') // 'standard' or 'vip'

  // Modals state
  const [selectedHorseDetail, setSelectedHorseDetail] = useState(null)
  const [selectedJockeyDetail, setSelectedJockeyDetail] = useState(null)
  const [successModal, setSuccessModal] = useState(null)

  const { user } = useAuth()
  const userKey = user?.id || user?.username || user?.email || 'guest'
  const userProfileKey = `spectator_profile_${userKey}`

  // Load profile from localStorage to check/deduct balance
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem(userProfileKey) || localStorage.getItem('spectator_profile')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.email === user?.email || parsed.userName === user?.username || parsed.id === user?.id) {
          return parsed
        }
      } catch (e) {
        console.error(e)
      }
    }
    return {
      name: user?.fullName || user?.name || 'Khán giả',
      email: user?.email || '',
      phone: user?.phone || '',
      balance: 0,
      joined: new Date().toISOString(),
      payosLinked: true
    }
  })

  // Load userPreds to append new predictions
  const [userPreds, setUserPreds] = useState(() => {
    const stored = localStorage.getItem('spectator_user_preds')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return []
  })

  const getRaceTicket = (raceId, raceName) => {
    if (!userPreds || userPreds.length === 0) return null
    return userPreds.find(p => {
      if (p.raceId && raceId && Number(p.raceId) === Number(raceId)) return true
      const pName = (p.raceName || p.race || '').toLowerCase()
      const rName = (raceName || '').toLowerCase()
      if (pName && rName && (pName.includes(rName) || rName.includes(pName))) return true
      return false
    })
  }

  const handleCancelPredictionTicket = async (predId) => {
    if (!window.confirm('Bạn có chắc chắn muốn HỦY cược dự đoán này và HOÀN TIỀN cọc về ví tài khoản?')) return
    try {
      try {
        await cancelPrediction(predId, profile.id || 5)
      } catch (e) {
        console.warn('API cancel failed, refunding locally', e)
      }

      const canceledItem = userPreds.find(p => p.id === predId || p.predictionId === predId)
      const refundAmount = canceledItem ? (canceledItem.amount || canceledItem.stakeAmount || 100000) : 100000

      const updatedPreds = userPreds.filter(p => p.id !== predId && p.predictionId !== predId)
      setUserPreds(updatedPreds)
      localStorage.setItem('spectator_user_preds', JSON.stringify(updatedPreds))

      const updatedProfile = { ...profile, balance: profile.balance + refundAmount }
      setProfile(updatedProfile)
      localStorage.setItem(userProfileKey, JSON.stringify(updatedProfile))
      localStorage.setItem('spectator_profile', JSON.stringify(updatedProfile))

      alert(`✅ Hủy cược thành công! Đã hoàn trả ${formatCurrency(refundAmount)} vào ví tài khoản của bạn.`)
    } catch (err) {
      alert('Lỗi khi hủy cược: ' + err.message)
    }
  }

  // Đồng bộ số dư ví của Khán giả từ API & LocalStorage
  useEffect(() => {
    async function syncWalletBalance() {
      const userTxKey = `spectator_transactions_${userKey}`
      let specProf = null
      let pendProf = null
      let localTxs = []

      try { specProf = JSON.parse(localStorage.getItem(userProfileKey) || localStorage.getItem('spectator_profile') || 'null') } catch (e) { }
      try { pendProf = JSON.parse(localStorage.getItem('pending_profile') || 'null') } catch (e) { }
      try { localTxs = JSON.parse(localStorage.getItem(userTxKey) || '[]') } catch (e) { }

      let depositSum = 0
      localTxs.forEach(t => {
        const st = (t.status || '').toUpperCase()
        if ((st === 'SUCCESS' || st === 'PAID') && t.amount) {
          depositSum += Number(t.amount)
        }
      })

      const isMatch = (specProf?.userName === user?.username) || (specProf?.email === user?.email) || (specProf?.id === user?.id)
      const b1 = isMatch ? (specProf?.balance ?? specProf?.walletBalance) : undefined
      const b2 = pendProf?.balance ?? pendProf?.walletBalance

      let latestBalance = Math.max(
        b1 !== undefined && b1 !== null ? Number(b1) : 0,
        b2 !== undefined && b2 !== null && (pendProf?.email === user?.email || pendProf?.userName === user?.username) ? Number(b2) : 0,
        depositSum
      )

      try {
        const apiData = await getSpectatorProfile(user?.id)
        if (apiData) {
          const apiBal = apiData.walletBalance ?? apiData.balance ?? apiData.wallet?.balance
          if (apiBal != null && Number(apiBal) > latestBalance) {
            latestBalance = Number(apiBal)
          }
        }
      } catch (err) {
        console.warn('GET spectator profile balance offline:', err?.message)
      }

      setProfile(prev => {
        const updated = {
          ...prev,
          name: user?.fullName || user?.name || prev.name || 'Khán giả',
          email: user?.email || prev.email || '',
          balance: latestBalance
        }
        localStorage.setItem(userProfileKey, JSON.stringify(updated))
        localStorage.setItem('spectator_profile', JSON.stringify(updated))
        return updated
      })

      // Fetch Ticket History from Backend API (GET /api/v1/tickets/spectators/{spectatorId}/history)
      const targetSpectatorId = user?.id || 11
      if (targetSpectatorId) {
        try {
          const apiHistoryRes = await getSpectatorTicketHistory(targetSpectatorId)
          const apiHistoryList = Array.isArray(apiHistoryRes) ? apiHistoryRes : (apiHistoryRes?.data || [])

          const formattedHistory = apiHistoryList.map(item => ({
            id: item.ticketId || item.id,
            ticketCode: item.ticketCode || `TKT-${item.ticketId || item.id}`,
            predictionId: item.ticketId || item.id,
            race: item.raceName || item.race?.name || 'Cuộc đua',
            raceName: item.raceName || item.race?.name || 'Cuộc đua',
            horse: item.selectedHorseName || item.horseName || item.horse?.name || 'Ngựa đua',
            horseName: item.selectedHorseName || item.horseName || item.horse?.name || 'Ngựa đua',
            amount: item.price || item.ticketPrice || 20000,
            ticketType: item.ticketType || 'Standard',
            status: item.status || 'SOLD',
            purchaseDate: item.purchaseDate || ''
          }))

          setUserPreds(formattedHistory)
        } catch (histErr) {
          console.warn('GET /v1/tickets/spectators/{id}/history offline:', histErr?.message)
          setUserPreds([])
        }
      }
    }

    syncWalletBalance()
  }, [userKey, user?.id, user?.email])

  // Tải danh sách cuộc đua MỞ BÁN VÉ từ Backend API
  useEffect(() => {
    async function loadOpenRegistrationPools() {
      try {
        const apiRes = await getOpenTicketRaces()
        const openRaces = Array.isArray(apiRes) ? apiRes : (apiRes?.data || [])

        const apiPools = openRaces.map(item => ({
          id: item.raceId || item.id,
          raceName: `${item.raceName || 'Cuộc đua'} - ${item.tournamentName || 'Giải Đấu'}`,
          totalPool: (item.totalTickets || 20) * (item.ticketPrice || 20000),
          participants: (item.totalTickets || 20) - (item.remainingTickets || 0),
          totalTickets: item.totalTickets,
          remainingTickets: item.remainingTickets,
          ticketPrice: item.ticketPrice,
          status: 'open',
          endDate: item.endTime ? item.endTime.replace('T', ' ') : (item.raceDate || '2026-12-31'),
          runners: (item.horses || []).map((h, idx) => ({
            horseId: h.horseId || h.id || idx + 1,
            lane: h.laneNumber != null ? Number(h.laneNumber) : idx + 1,
            horse: h.horseName || 'Ngựa đua',
            jockey: h.jockeyName || 'Nài ngựa'
          }))
        }))

        setPools(apiPools)
      } catch (err) {
        console.warn('Lỗi tải cuộc đua mở vé từ API:', err?.message)
        setPools([])
      }
    }
    loadOpenRegistrationPools()
  }, [])

  const handleSelectPool = (pool) => {
    setSelectedPool(pool)
    const existingTicket = getRaceTicket(pool.id, pool.raceName)
    if (existingTicket) {
      setPredictedHorse(existingTicket.horseName || existingTicket.horse || '')
    } else {
      setPredictedHorse('')
    }
    setTicketType('standard')
  }

  const handleOpenHorseInfo = (horseName, e) => {
    e.stopPropagation()
    setSelectedHorseDetail({
      name: horseName,
      age: 'Chưa cập nhật',
      gender: 'Chưa cập nhật',
      breed: 'Chưa rõ',
      owner: 'Chưa rõ',
      wins: 0,
      races: 0,
      points: 0
    })
  }

  const handleOpenJockeyInfo = (jockeyName, e) => {
    e.stopPropagation()
    setSelectedJockeyDetail({
      name: jockeyName,
      age: 'Chưa cập nhật',
      experience: 'Chưa rõ',
      license: 'Chưa cấp',
      wins: 0,
      races: 0,
      points: 0
    })
  }

  const handlePlaceBet = async (e) => {
    e.preventDefault()
    if (!predictedHorse) {
      alert('Vui lòng chọn ngựa đua dự đoán thắng cuộc!')
      return
    }

    const runner = selectedPool?.runners?.find(r => r.horse === predictedHorse)
    const horseId = runner?.horseId || 11
    const spectatorId = user?.id || profile?.id || 11
    const raceId = selectedPool?.id || 14
    const finalAmount = selectedPool?.ticketPrice || 20000
    const finalTypeName = 'Vé xem đua'

    try {
      // Gọi API Mua vé từ Swagger: POST /v1/tickets/races/{raceId}/purchase
      const ticketRes = await purchaseRaceTicket(raceId, {
        spectatorId: Number(spectatorId),
        horseId: Number(horseId)
      })

      const ticketData = ticketRes?.data || ticketRes || {}
      const ticketPriceVal = ticketData.price || finalAmount
      const boughtHorseName = ticketData.selectedHorseName || predictedHorse
      const newRemainingTickets = ticketData.remainingTickets != null ? ticketData.remainingTickets : Math.max(0, (selectedPool.remainingTickets != null ? selectedPool.remainingTickets : 20) - 1)

      // Deduct balance and sync to localStorage
      const updatedProfile = { ...profile, balance: Math.max(0, profile.balance - ticketPriceVal) }
      setProfile(updatedProfile)
      localStorage.setItem(userProfileKey, JSON.stringify(updatedProfile))
      localStorage.setItem('spectator_profile', JSON.stringify(updatedProfile))

      // Add new prediction entry from API response and sync to localStorage
      const newPred = {
        id: ticketData.ticketId || ticketData.id || Date.now(),
        ticketCode: ticketData.ticketCode || '',
        race: ticketData.raceName || selectedPool.raceName,
        amount: ticketPriceVal,
        horse: boughtHorseName,
        ticketType: finalTypeName,
        status: ticketData.status || 'SOLD'
      }
      const updatedUserPreds = [newPred, ...userPreds]
      setUserPreds(updatedUserPreds)
      localStorage.setItem('spectator_user_preds', JSON.stringify(updatedUserPreds))

      // Update pool state locally with actual remainingTickets from API response
      setPools(pools.map(p =>
        p.id === selectedPool.id
          ? {
            ...p,
            totalPool: p.totalPool + ticketPriceVal,
            participants: p.participants + 1,
            remainingTickets: newRemainingTickets
          }
          : p
      ))

      setSuccessModal({
        race: ticketData.raceName || selectedPool.raceName,
        ticketType: finalTypeName,
        horse: boughtHorseName,
        amount: ticketPriceVal
      })
      setSelectedPool(null)
    } catch (err) {
      console.warn('POST /v1/tickets/races/{raceId}/purchase error:', err)
      const errorMsg = err?.response?.data || err?.message || ''
      if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('insufficient wallet balance')) {
        alert(`⚠️ Số dư ví không đủ! Bạn cần ít nhất ${formatCurrency(finalAmount)} để mua vé này. Vui lòng nạp thêm tiền vào ví tài khoản.`)
        return
      }
      alert('Lỗi mua vé: ' + (typeof errorMsg === 'string' ? errorMsg : 'Không thể thực hiện mua vé.'))
    }
  }

  return (
    <div className="spectator-predictions">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Mua Vé & Đặt Dự Đoán</h1>
          <p className="admin-page-sub">Xem chi tiết cuộc đua, thông tin ngựa chiến & jockey nài ngựa để đưa ra dự đoán chính xác nhất</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: List of Open Pools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>Các cuộc đua đang mở cổng dự đoán</h3>
            </div>
            <div className="admin-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pools.map(p => {
                const boughtTicket = getRaceTicket(p.id, p.raceName)
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPool(p)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: selectedPool?.id === p.id ? '1px solid #d4af37' : (boughtTicket ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)'),
                      background: selectedPool?.id === p.id ? 'rgba(212, 175, 55, 0.05)' : (boughtTicket ? 'rgba(34, 197, 94, 0.06)' : 'rgba(18, 18, 18, 0.5)'),
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="pool-item-card"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#fff', fontSize: '15px' }}>{p.raceName}</strong>
                        {boughtTicket && (
                          <span style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#4ade80',
                            border: '1px solid rgba(74, 222, 128, 0.4)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            🎟️ Đã mua vé
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                        <span>🎟️ <strong style={{ color: '#4ade80' }}>{p.remainingTickets != null ? p.remainingTickets : 20}</strong> vé còn lại</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <StatusBadge status={p.status} />
                      <span style={{ fontSize: '10px', color: '#666' }}>Hạn: {p.endDate.split(' ')[0]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Race & Prediction Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedPool ? (() => {
            const currentBoughtTicket = getRaceTicket(selectedPool.id, selectedPool.raceName)
            return (
              <div className="admin-card" style={{ border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                <div className="admin-card-head">
                  <h3>Chi tiết cuộc đua & Đặt mua vé</h3>
                  <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedPool(null)}>✕</button>
                </div>

                <div className="admin-card-body" style={{ padding: '20px' }}>
                  {/* Banner nếu khán giả đã mua vé cuộc đua này */}
                  {currentBoughtTicket && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🎟️</span>
                        <div>
                          <strong style={{ color: '#4ade80', fontSize: '14px', display: 'block' }}>Bạn đã mua vé cho cuộc đua này!</strong>
                          <span style={{ color: '#ccc', fontSize: '12px' }}>
                            Mã vé: <code style={{ color: '#d4af37', background: 'rgba(212,175,55,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{currentBoughtTicket.ticketCode || `#${currentBoughtTicket.id}`}</code>
                            {' | '}Ngựa dự đoán: <strong style={{ color: '#4ade80' }}>{currentBoughtTicket.horseName || currentBoughtTicket.horse}</strong>
                          </span>
                        </div>
                      </div>
                      <span style={{ background: '#166534', color: '#86efac', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        Đã Mua Vé
                      </span>
                    </div>
                  )}

                  {/* Race summary details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                    <div><span style={{ color: '#888' }}>Cuộc đua:</span> <strong style={{ color: '#fff' }}>{selectedPool.raceName}</strong></div>
                    <div><span style={{ color: '#888' }}>Hạn đóng vé:</span> <strong style={{ color: '#fff' }}>{selectedPool.endDate}</strong></div>
                    <div><span style={{ color: '#888' }}>Số vé còn lại:</span> <strong style={{ color: '#4ade80' }}>{selectedPool.remainingTickets != null ? selectedPool.remainingTickets : 20} vé</strong></div>
                  </div>

                  {/* Sơ đồ làn chạy (Runners) */}
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d4af37', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    Sơ đồ làn chạy & Thông tin ngựa/jockey
                  </h4>

                  <div className="admin-table-wrap" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                    <table className="admin-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}>Làn</th>
                          <th>Ngựa Đua</th>
                          <th>Jockey (Nài)</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Chọn dự đoán</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingRunners ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                              ⏳ Đang tải sơ đồ làn chạy...
                            </td>
                          </tr>
                        ) : (selectedPool?.runners && selectedPool.runners.length > 0) ? (
                          selectedPool.runners.map(r => {
                            const isSelectedInTicket = currentBoughtTicket && ((currentBoughtTicket.horseName || currentBoughtTicket.horse) === r.horse)
                            return (
                              <tr
                                key={r.lane || r.horse}
                                onClick={() => !currentBoughtTicket && setPredictedHorse(r.horse)}
                                style={{
                                  cursor: currentBoughtTicket ? 'default' : 'pointer',
                                  background: (predictedHorse === r.horse || isSelectedInTicket) ? 'rgba(212, 175, 55, 0.04)' : 'transparent'
                                }}
                              >
                                <td style={{ fontWeight: 'bold', color: '#d4af37' }}>#{r.lane}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong style={{ color: '#fff' }}>{r.horse}</strong>
                                    {isSelectedInTicket && (
                                      <span style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(74,222,128,0.3)', fontWeight: 'bold' }}>
                                        ⭐ Vé đã chọn
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className="info-icon-btn"
                                      onClick={(e) => handleOpenHorseInfo(r.horse, e)}
                                      title="Xem thông tin ngựa"
                                    >
                                      ℹ
                                    </button>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{r.jockey}</span>
                                    <button
                                      type="button"
                                      className="info-icon-btn"
                                      onClick={(e) => handleOpenJockeyInfo(r.jockey, e)}
                                      title="Xem thông tin Jockey"
                                    >
                                      ℹ
                                    </button>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    type="radio"
                                    name="predictedHorse"
                                    checked={predictedHorse === r.horse || isSelectedInTicket}
                                    disabled={Boolean(currentBoughtTicket)}
                                    onChange={() => !currentBoughtTicket && setPredictedHorse(r.horse)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ cursor: currentBoughtTicket ? 'not-allowed' : 'pointer' }}
                                  />
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                              Chưa có danh sách ngựa đua cho lượt thi này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Ticket and Prediction Booking Form */}
                  <form onSubmit={handlePlaceBet} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', gap: '16px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Ngựa dự đoán:</span>
                        <strong style={{ color: predictedHorse ? '#4ade80' : '#f87171', fontSize: '14px' }}>
                          {predictedHorse || 'Chưa chọn ngựa'}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Số dư ví:</span>
                        <strong style={{ color: '#fff', fontSize: '14px' }}>
                          {formatCurrency(profile.balance)}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Giá vé cuộc đua:</span>
                        <strong style={{ color: '#d4af37', fontSize: '16px' }}>
                          {formatCurrency(selectedPool?.ticketPrice || 20000)}
                        </strong>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(212,175,55,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.1)', fontSize: '12px', color: '#ccc' }}>
                      <strong style={{ color: '#d4af37', display: 'block', marginBottom: '2px' }}>ℹ️ Luật chia thưởng:</strong>
                      Khi ngựa bạn dự đoán vô địch, bạn sẽ được nhận thưởng phân chia tương ứng theo tỷ trọng giá trị vé của những người dự đoán thắng cược.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedPool(null)}>Đóng</button>
                      <button
                        type="submit"
                        className="admin-btn admin-btn--gold"
                        disabled={!predictedHorse || Boolean(currentBoughtTicket)}
                        style={currentBoughtTicket ? { opacity: 0.65, cursor: 'not-allowed', background: '#334155', color: '#94a3b8', border: '1px solid #475569' } : undefined}
                      >
                        {currentBoughtTicket ? '🔒 Đã Mua Vé (Đã Khóa Thao Tác)' : 'Thanh toán & Đặt cược'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )
          })() : (
            <div className="admin-card" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚖</span>
                <h4>Vui lòng chọn cuộc đua</h4>
                <p style={{ fontSize: '12px', maxWidth: '300px', margin: '8px auto 0' }}>Chọn một cuộc đua ở danh sách bên trái để xem chi tiết làn chạy và bắt đầu mua vé dự đoán.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Prediction History Section */}
      <div className="admin-card" style={{ marginTop: '24px', border: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="admin-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🎟️ Lịch Sử Đặt Cược & Dự Đoán Của Tôi</h3>
          <span style={{ fontSize: '12px', color: '#888' }}>{userPreds ? userPreds.length : 0} vé dự đoán</span>
        </div>
        <div className="admin-card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Cuộc đua</th>
                <th>Ngựa dự đoán</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Ngày mua</th>
              </tr>
            </thead>
            <tbody>
              {userPreds && userPreds.length > 0 ? (
                userPreds.map((item) => {
                  const displayCode = item.ticketCode ? item.ticketCode.substring(0, 8) + '...' : `#${item.id || item.ticketId}`
                  const fullCode = item.ticketCode || `#${item.id || item.ticketId}`
                  const formattedDate = item.purchaseDate ? item.purchaseDate.replace('T', ' ').substring(0, 16) : 'Hôm nay'
                  return (
                    <tr key={item.id || item.predictionId || item.ticketCode}>
                      <td>
                        <code title={fullCode} style={{ color: '#d4af37', background: 'rgba(212,175,55,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          {displayCode}
                        </code>
                      </td>
                      <td style={{ color: '#fff', fontWeight: '500' }}>🏇 {item.raceName || item.race}</td>
                      <td style={{ color: '#4ade80', fontWeight: 'bold' }}>⭐ {item.horseName || item.horse}</td>
                      <td style={{ color: '#d4af37', fontWeight: 'bold' }}>{formatCurrency(item.amount || item.price || 20000)}</td>
                      <td>
                        <StatusBadge status={item.status === 'SOLD' ? 'confirmed' : item.status === 'USED' ? 'completed' : item.status} />
                      </td>
                      <td style={{ color: '#888', fontSize: '12px' }}>{formattedDate}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                    Bạn chưa mua vé cược nào. Chọn một cuộc đua ở trên để tham gia dự đoán!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horse Detail Modal */}
      {selectedHorseDetail && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1050
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="admin-card-head">
              <h3>Thông Tin Chi Tiết Ngựa Đua</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedHorseDetail(null)}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 12px 0' }}>🏇 {selectedHorseDetail.name}</h3>
              <dl className="profile-info-dl" style={{ fontSize: '13px' }}>
                <dt>Độ tuổi</dt> <dd>{selectedHorseDetail.age} tuổi</dd>
                <dt>Giới tính</dt> <dd>{selectedHorseDetail.gender}</dd>
                <dt>Giống ngựa</dt> <dd>{selectedHorseDetail.breed}</dd>
                <dt>Chủ sở hữu (Stable)</dt> <dd>{selectedHorseDetail.owner}</dd>
                <dt>Thành tích toàn khóa</dt>
                <dd style={{ color: '#4ade80' }}>
                  {selectedHorseDetail.wins} trận thắng / {selectedHorseDetail.races} trận đấu ({((selectedHorseDetail.wins / selectedHorseDetail.races) * 100).toFixed(0)}% tỷ lệ thắng)
                </dd>
                <dt>Điểm phong độ tích lũy</dt> <dd style={{ color: '#d4af37', fontWeight: 'bold' }}>{selectedHorseDetail.points} PTS</dd>
              </dl>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedHorseDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jockey Detail Modal */}
      {selectedJockeyDetail && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1050
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="admin-card-head">
              <h3>Thông Tin Chi Tiết Nài Ngựa (Jockey)</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedJockeyDetail(null)}>✕</button>
            </div>
            <div className="admin-card-body" style={{ padding: '20px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 12px 0' }}>👤 {selectedJockeyDetail.name}</h3>
              <dl className="profile-info-dl" style={{ fontSize: '13px' }}>
                <dt>Mã số License</dt> <dd><code>{selectedJockeyDetail.license}</code></dd>
                <dt>Độ tuổi</dt> <dd>{selectedJockeyDetail.age} tuổi</dd>
                <dt>Kinh nghiệm thi đấu</dt> <dd>{selectedJockeyDetail.experience}</dd>
                <dt>Thành tích toàn khóa</dt>
                <dd style={{ color: '#4ade80' }}>
                  {selectedJockeyDetail.wins} chiến thắng / {selectedJockeyDetail.races} trận đua
                </dd>
                <dt>Điểm số phong độ</dt> <dd style={{ color: '#d4af37', fontWeight: 'bold' }}>{selectedJockeyDetail.points} PTS</dd>
              </dl>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedJockeyDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1100
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '420px', border: '1px solid rgba(74, 222, 128, 0.3)', background: '#121212', textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👍</div>
            <h3 style={{ color: '#4ade80', marginBottom: '20px', fontSize: '18px' }}>Đặt dự đoán và mua vé thành công!</h3>

            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>
              <div><span style={{ color: '#888' }}>- Cuộc đua:</span> <strong style={{ color: '#fff' }}>{successModal.race}</strong></div>
              <div><span style={{ color: '#888' }}>- Loại vé:</span> <strong style={{ color: '#fff' }}>Vé {successModal.ticketType}</strong></div>
              <div><span style={{ color: '#888' }}>- Ngựa dự đoán:</span> <strong style={{ color: '#fff' }}>{successModal.horse}</strong></div>
              <div><span style={{ color: '#888' }}>- Tổng thanh toán:</span> <strong style={{ color: '#d4af37' }}>{formatCurrency(successModal.amount)}</strong></div>
              <div><span style={{ color: '#888' }}>- Số dư ví còn lại:</span> <strong style={{ color: '#4ade80' }}>{formatCurrency(profile.balance)}</strong></div>
            </div>

            <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px' }}>
              (Bạn có thể xem lịch sử vé đã mua tại trang "Tài Khoản Cá Nhân")
            </p>

            <button
              type="button"
              className="admin-btn admin-btn--gold"
              style={{ width: '100%', padding: '10px' }}
              onClick={() => setSuccessModal(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
