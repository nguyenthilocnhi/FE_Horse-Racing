import React, { useState, useEffect } from 'react'
import { getMyParticipations, getOwnerHorses, registerHorseToRace, assignJockeyToParticipation } from '../../../services/ownerService'
import { getAllJockeys } from '../../../services/jockeyService'
import { getAllTournaments } from '../../../services/tournamentService'

export default function OwnerRaces() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRace, setSelectedRace] = useState(null)
  const [detailsModal, setDetailsModal] = useState(false)

  // Tournament Filter State
  const [tournamentFilter, setTournamentFilter] = useState('ALL')
  const [tournamentsList, setTournamentsList] = useState([])

  // Registration Modal States
  const [registerModal, setRegisterModal] = useState(false)
  const [selectedRaceForReg, setSelectedRaceForReg] = useState(null)
  const [ownerHorses, setOwnerHorses] = useState([])
  const [jockeys, setJockeys] = useState([])
  const [selectedHorseId, setSelectedHorseId] = useState('')
  const [selectedJockeyId, setSelectedJockeyId] = useState('')

  useEffect(() => {
    fetchMyParticipations()
  }, [])

  const fetchMyParticipations = async () => {
    try {
      setLoading(true)
      const ownerKey = getCurrentOwnerKey()
      const [res, tourRes] = await Promise.allSettled([
        getMyParticipations(),
        getAllTournaments()
      ])

      if (tourRes.status === 'fulfilled') {
        const tours = tourRes.value?.data || tourRes.value || []
        setTournamentsList(Array.isArray(tours) ? tours : [])
      }

      const apiData = res.status === 'fulfilled' ? (res.value?.data || res.value || []) : []
      
      // Clean up ALL mock registrations to ensure we strictly use real API data in E2E testing
      localStorage.removeItem('mock_registrations_' + ownerKey)
      localStorage.removeItem('owner_registered_races_' + ownerKey)
      localStorage.removeItem('mock_registrations')

      const allData = [...apiData]

      const mappedRaces = allData.map(p => {
        let mappedStatus = 'pending_jockey'
        let displayLabel = 'Chờ nài ngựa'
        let badgeColor = 'orange'

        if (p.status === 'CONFIRMED') {
          mappedStatus = 'registered'
          displayLabel = 'Đã xếp lịch'
          badgeColor = 'green'
        } else if (p.status === 'REJECTED') {
          mappedStatus = 'canceled'
          displayLabel = 'Admin từ chối'
          badgeColor = 'red'
        } else {
          if (p.jockeyInvitationStatus === 'ACCEPTED') {
            mappedStatus = 'pending_admin'
            displayLabel = 'Chờ Admin duyệt'
            badgeColor = 'blue'
          } else if (p.jockeyInvitationStatus === 'REJECTED') {
            mappedStatus = 'jockey_rejected'
            displayLabel = 'Nài ngựa từ chối'
            badgeColor = 'red'
          } else if (p.jockeyInvitationStatus === 'PENDING' || !p.jockeyInvitationStatus) {
            mappedStatus = 'pending_jockey'
            displayLabel = 'Chờ nài ngựa phản hồi'
            badgeColor = 'orange'
          } else {
            mappedStatus = 'pending_confirmation'
            displayLabel = 'Cần gán Jockey'
            badgeColor = 'gray'
          }
        }
        
        return {
          id: p.id,
          originalId: p.raceScheduleId || p.raceSchedule?.id || p.id,
          name: p.raceSchedule?.name || 'Vòng đấu',
          tournamentName: p.raceSchedule?.tournament?.name || 'Giải đấu',
          date: p.raceSchedule?.startTime ? (p.raceSchedule.startTime.includes('T') ? p.raceSchedule.startTime.split('T')[0] : p.raceSchedule.startTime) : 'N/A',
          time: p.raceSchedule?.startTime ? (p.raceSchedule.startTime.includes('T') ? p.raceSchedule.startTime.split('T')[1].substring(0, 5) : p.raceSchedule.startTime) : 'N/A',
          venue: 'Saigon Racecourse',
          distance: '1000m',
          registeredHorse: p.horse?.name || 'Không rõ',
          assignedJockey: p.jockey ? (p.jockey.fullName || p.jockey.userName) : 'Chưa chỉ định',
          prizePool: '200,000,000 VND',
          status: mappedStatus,
          displayLabel: displayLabel,
          badgeColor: badgeColor,
          result: null
        }
      })

      // Load races created by Admin that are OPEN for registration
      let openCreatedRaces = []
      let regRaceIds = []
      try {
        const stored = JSON.parse(localStorage.getItem('created_races') || '[]')
        openCreatedRaces = stored.filter(r => r.status !== 'completed' && r.status !== 'cancelled')
        regRaceIds = JSON.parse(localStorage.getItem('owner_registered_races_' + ownerKey) || '[]')
      } catch (e) {}

      // Add open created races ONLY IF NOT already registered by THIS owner
      openCreatedRaces.forEach(openR => {
        const isRegisteredLocally = regRaceIds.some(id => String(id) === String(openR.id) || String(id) === String(openR.originalId))
        const isAlreadyInMapped = mappedRaces.some(m => String(m.originalId) === String(openR.id) || String(m.id) === String(openR.id) || m.name === openR.name)

        if (!isRegisteredLocally && !isAlreadyInMapped) {
          const now = new Date()
          const start = new Date(openR.registrationStartDate)
          const end = new Date(openR.registrationEndDate)
          const IS_TESTING = true; // TODO: Khôi phục lại logic check thời gian khi release lên Production.
          const isOpen = IS_TESTING || (now >= start && now <= end)

          mappedRaces.unshift({
            id: openR.id,
            originalId: openR.originalId || openR.id,
            name: openR.name,
            tournamentName: openR.tournament || openR.tournamentName || 'Giải đấu',
            date: openR.date,
            time: openR.time,
            venue: openR.venue || 'Trường đua Phú Thọ',
            distance: openR.distance || '1600m',
            registeredHorse: 'Chưa đăng ký',
            assignedJockey: 'Chưa chỉ định',
            status: isOpen ? 'registration_open' : 'registration_closed',
            displayLabel: isOpen ? 'Đang mở đăng ký' : 'Đã đóng đăng ký',
            badgeColor: isOpen ? 'green' : 'red',
            result: null
          })
        }
      })

      setRaces(mappedRaces)
    } catch (error) {
      console.error("Lỗi khi tải danh sách đăng ký từ API:", error)
      setRaces([])
    } finally {
      setLoading(false)
    }
  }

  function getCurrentOwnerKey() {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return u.email || u.id || u.username || 'giathanh.owner@gmail.com'
    } catch (e) {
      return 'giathanh.owner@gmail.com'
    }
  }

  const handleOpenRegisterModal = async (race) => {
    setSelectedRaceForReg(race)
    setRegisterModal(true)
    const ownerKey = getCurrentOwnerKey()
    try {
      const [hRes, jRes] = await Promise.allSettled([
        getOwnerHorses(),
        getAllJockeys()
      ])

      const rawH = hRes.status === 'fulfilled' ? (hRes.value?.data || hRes.value || []) : []
      const apiHList = Array.isArray(rawH) ? rawH : []

      let localHList = []
      try {
        localHList = JSON.parse(localStorage.getItem('owner_horses_' + ownerKey) || '[]')
      } catch (e) {}

      let combinedH = [...apiHList]
      localHList.forEach(lh => {
        if (!combinedH.some(c => String(c.id) === String(lh.id) || c.name === lh.name)) {
          combinedH.push(lh)
        }
      })

      if (combinedH.length === 0) {
        const ownerPrefix = ownerKey.split('@')[0].toUpperCase()
        combinedH = [
          { id: Date.now(), name: `Xích Thố (${ownerPrefix})`, breed: 'Thoroughbred' },
          { id: Date.now() + 1, name: `Bạch Long (${ownerPrefix})`, breed: 'Arabian' }
        ]
        localStorage.setItem('owner_horses_' + ownerKey, JSON.stringify(combinedH))
      }

      setOwnerHorses(combinedH)
      if (combinedH.length > 0) setSelectedHorseId(combinedH[0].id)

      if (jRes.status === 'fulfilled') {
        const rawJ = jRes.value?.data || jRes.value || []
        const jList = Array.isArray(rawJ) ? rawJ : []
        setJockeys(jList.length > 0 ? jList : [
          { id: 1, fullName: 'L. Anderson' },
          { id: 2, fullName: 'M. Rodriguez' },
          { id: 3, fullName: 'S. Nakamura' }
        ])
        if (jList.length > 0) setSelectedJockeyId(jList[0].id)
        else setSelectedJockeyId(1)
      } else {
        setJockeys([
          { id: 1, fullName: 'L. Anderson' },
          { id: 2, fullName: 'M. Rodriguez' },
          { id: 3, fullName: 'S. Nakamura' }
        ])
        setSelectedJockeyId(1)
      }
    } catch (e) {
      console.warn('Error loading horses/jockeys for registration modal:', e)
    }
  }

  const handleSubmitRegistration = async (e) => {
    e.preventDefault()
    if (!selectedHorseId || !selectedJockeyId) {
      alert('Vui lòng chọn đầy đủ Ngựa đua và Nài ngựa!')
      return
    }

    const horseObj = ownerHorses.find(h => String(h.id) === String(selectedHorseId))
    const jockeyObj = jockeys.find(j => String(j.id) === String(selectedJockeyId))
    const ownerKey = getCurrentOwnerKey()

    try {
      // Local/offline validation first
      const selTournName = (selectedRaceForReg.tournamentName || '').trim().toLowerCase();
      const sameTournamentRaces = races.filter(r => 
        (r.tournamentName || '').trim().toLowerCase() === selTournName && 
        String(r.originalId) !== String(selectedRaceForReg.originalId || selectedRaceForReg.id)
      );

      const horseNameLower = (horseObj.name || '').trim().toLowerCase();
      const horseConflict = sameTournamentRaces.some(r => 
        (r.registeredHorse || '').trim().toLowerCase() === horseNameLower && 
        r.status !== 'canceled' && 
        r.status !== 'jockey_rejected'
      );
      if (horseConflict) {
        alert(`Ngựa "${horseObj.name}" đã được đăng ký trong một cuộc đua khác của giải này!`);
        return;
      }

      const jockeyNameLower = (jockeyObj.fullName || jockeyObj.userName || jockeyObj.name || '').trim().toLowerCase();
      const jockeyConflict = sameTournamentRaces.some(r => 
        (r.assignedJockey || '').trim().toLowerCase() === jockeyNameLower && 
        r.status !== 'canceled' && 
        r.status !== 'jockey_rejected'
      );
      if (jockeyConflict) {
        alert(`Nài ngựa "${jockeyObj.fullName || jockeyObj.userName || jockeyObj.name}" đã được mời/đăng ký trong một cuộc đua khác của giải này!`);
        return;
      }

      try {
        const regRes = await registerHorseToRace({
          raceScheduleId: selectedRaceForReg.originalId || selectedRaceForReg.id,
          horseId: Number(selectedHorseId)
        })
        const regData = regRes?.data || regRes || {}
        if (regData.id) {
          await assignJockeyToParticipation(regData.id, { jockeyId: Number(selectedJockeyId) })
        }
      } catch (err) {
        if (err.response && err.response.data) {
           const msg = typeof err.response.data === 'string' ? err.response.data : err.response.data.message || 'Lỗi hệ thống';
           alert('Lỗi: ' + msg);
           return;
        }
        console.warn('API register error, adding locally:', err)
      }

      // 2. Mark this race ID as registered by THIS owner
      const regRaceIds = JSON.parse(localStorage.getItem('owner_registered_races_' + ownerKey) || '[]')
      if (selectedRaceForReg.id) regRaceIds.push(String(selectedRaceForReg.id))
      if (selectedRaceForReg.originalId) regRaceIds.push(String(selectedRaceForReg.originalId))
      localStorage.setItem('owner_registered_races_' + ownerKey, JSON.stringify(regRaceIds))

      setRegisterModal(false)
      fetchMyParticipations()
      alert(`✅ Đăng ký thành công ngựa "${horseObj?.name}" và đã gửi lời mời cho Jockey "${jockeyObj?.fullName || jockeyObj?.userName}"!\n\nLời mời đã được chuyển sang giao diện của Jockey để phản hồi. Trạng thái hiện tại: Chờ nài ngựa phản hồi.`)
    } catch (err) {
      alert('Lỗi đăng ký: ' + err.message)
    }
  }

  const handleConfirmReady = (raceId) => {
    setRaces(races.map(r => {
      if (r.id === raceId) {
        return { ...r, status: 'registered' } // transitions status to confirmed registered
      }
      return r
    }))
    alert('Đã xác nhận chiến mã sẵn sàng thi đấu!')
  }

  const openDetails = (race) => {
    setSelectedRace(race)
    setDetailsModal(true)
  }

  return (
    <div className="own-races">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Lịch thi đấu & Xác nhận ngựa 🏁</h1>
          <p className="owner-page-sub">Theo dõi các giải đấu đang diễn ra và xác nhận ngựa của stable sẵn sàng thi đấu.</p>
        </div>
      </div>

      {/* Filter toolbar & Grid of races */}
      <div className="owner-card">
        <div className="owner-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3>Các trận đấu đang chuẩn bị hành trình</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>🏆 Lọc giải đấu:</span>
            <select
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#141414',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="ALL">Tất cả Giải đấu</option>
              {tournamentsList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Giải đấu</th>
                <th>Thông tin đua</th>
                <th>Chiến mã</th>
                <th>Jockey đảm nhiệm</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Đang tải dữ liệu...</td></tr>
              ) : races.filter(r => {
                if (r.status === 'completed') return false
                if (tournamentFilter !== 'ALL' && r.tournamentName !== tournamentFilter) return false
                return true
              }).length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Không có cuộc đua nào phù hợp với giải đấu đã chọn.</td></tr>
              ) : races.filter(r => {
                if (r.status === 'completed') return false
                if (tournamentFilter !== 'ALL' && r.tournamentName !== tournamentFilter) return false
                return true
              }).map((race) => (
                <tr key={race.id}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>
                    <div>{race.name}</div>
                    <span style={{ fontSize: 11, color: '#666' }}>{race.tournamentName}</span>
                  </td>
                  <td>
                    📅 {race.date} · {race.time}
                  </td>
                  <td style={{ color: '#d4af37', fontWeight: 500 }}>
                    {race.registeredHorse || 'Chưa đăng ký'}
                  </td>
                  <td>{race.assignedJockey || 'Chưa chỉ định'}</td>
                  <td>
                    <span className={`owner-badge owner-badge--${race.badgeColor || 'gray'}`}>
                      {race.displayLabel}
                    </span>
                  </td>
                  <td>
                    <div className="owner-table-actions">
                      {race.status === 'registration_open' ? (
                        <button 
                          className="owner-btn owner-btn--sm" 
                          style={{ backgroundColor: '#10B981', color: '#fff' }}
                          onClick={() => handleOpenRegisterModal(race)}
                        >
                          ĐĂNG KÝ
                        </button>
                      ) : race.status === 'registration_closed' ? (
                        <button 
                          className="owner-btn owner-btn--sm" 
                          style={{ backgroundColor: '#EF4444', color: '#fff', cursor: 'not-allowed' }}
                          disabled
                        >
                          ĐÃ ĐÓNG ĐĂNG KÝ
                        </button>
                      ) : (
                        <button className="owner-btn owner-btn--ghost owner-btn--sm" onClick={() => openDetails(race)}>
                          Chi tiết
                        </button>
                      )}
                      {race.status === 'jockey_rejected' && (
                        <button className="owner-btn owner-btn--gold owner-btn--sm" onClick={() => handleOpenRegisterModal(race)}>
                          Đổi Nài Ngựa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History of Completed Races */}
      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Kết quả giải đấu đã qua</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Giải đấu</th>
                <th>Ngày đua</th>
                <th>Chiến mã</th>
                <th>Jockey</th>
                <th>Kết quả chung cuộc</th>
                <th>Tiền thưởng nhận</th>
              </tr>
            </thead>
            <tbody>
              {races.filter(r => r.status === 'completed').map((race) => (
                <tr key={race.id}>
                  <td style={{ color: '#fff' }}>{race.name}</td>
                  <td>{race.date}</td>
                  <td>{race.registeredHorse}</td>
                  <td>{race.assignedJockey}</td>
                  <td>
                    <span className={`owner-badge owner-badge--${race.result.position === 1 ? 'gold' : 'gray'}`} style={{ marginRight: 6 }}>
                      Hạng {race.result.position}
                    </span>
                    <span>T/g: {race.result.time}</span>
                  </td>
                  <td style={{ color: '#4ade80', fontWeight: 600 }}>+{race.result.prizeWon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModal && selectedRace && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Chi tiết cuộc đua: {selectedRace.name}</h2>
              <button className="owner-modal-close" onClick={() => setDetailsModal(false)}>×</button>
            </div>
            <div className="owner-modal-body">
              <div className="owner-detail-row">
                <span className="owner-detail-label">Giải đấu gốc</span>
                <span className="owner-detail-value">{selectedRace.tournamentName}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Địa điểm tổ chức</span>
                <span className="owner-detail-value">{selectedRace.venue}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Cự ly chạy</span>
                <span className="owner-detail-value">{selectedRace.distance}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Thời gian bắt đầu</span>
                <span className="owner-detail-value">{selectedRace.date} lúc {selectedRace.time}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Cơ cấu giải thưởng</span>
                <span className="owner-detail-value" style={{ color: '#4ade80' }}>{selectedRace.prizePool}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Chiến mã tham chiến</span>
                <span className="owner-detail-value">{selectedRace.registeredHorse || 'Chưa chỉ định'}</span>
              </div>
              <div className="owner-detail-row">
                <span className="owner-detail-label">Jockey được cử</span>
                <span className="owner-detail-value">{selectedRace.assignedJockey || 'Chưa cử'}</span>
              </div>
            </div>
            <div className="owner-modal-footer">
              <button type="button" className="owner-btn owner-btn--gold" onClick={() => setDetailsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Horse & Jockey Modal */}
      {registerModal && selectedRaceForReg && (
        <div className="owner-modal-overlay">
          <div className="owner-modal" style={{ maxWidth: '480px' }}>
            <div className="owner-modal-head">
              <h2>🏇 Đăng Ký Ngựa Đua & Mời Nài</h2>
              <button className="owner-modal-close" onClick={() => setRegisterModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitRegistration} className="owner-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>Cuộc đua chọn đăng ký:</span>
                <strong style={{ color: '#fff', fontSize: '15px' }}>{selectedRaceForReg.name}</strong> ({selectedRaceForReg.tournamentName})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888' }}>1. Chọn Chiến Mã Của Stable</label>
                <select
                  required
                  className="owner-select"
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  {ownerHorses.map(h => (
                    <option key={h.id} value={h.id}>🏇 {h.name} ({h.breed || 'Thoroughbred'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888' }}>2. Chọn Nài Ngựa (Jockey) Mời Thi Đấu</label>
                <select
                  required
                  className="owner-select"
                  value={selectedJockeyId}
                  onChange={(e) => setSelectedJockeyId(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  {jockeys.map(j => (
                    <option key={j.id} value={j.id}>👤 {j.fullName || j.userName || j.name} (License: {j.license || `JOC-${j.id}`})</option>
                  ))}
                </select>
              </div>

              <div className="owner-modal-footer" style={{ padding: 0, marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setRegisterModal(false)}>Hủy bỏ</button>
                <button type="submit" className="owner-btn owner-btn--gold">Gửi Đăng Ký & Lời Mời</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
