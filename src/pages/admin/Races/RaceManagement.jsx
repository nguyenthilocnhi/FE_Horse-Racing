import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom'
import { races as initialRaces, tournaments as initialTournaments, mockJockeys } from '../../../data/adminMockData'
import { StatusBadge, computeRaceStatus } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule, createRaceSchedule, updateRaceSchedule, updateTournamentRegistration } from '../../../services/tournamentService'
import { startRace, delayRace, reopenPrediction, publishRaceResult } from '../../../services/adminService'
import { closeDuePredictions, updateSystemRankings } from '../../../services/systemService'
import './RaceManagement.css'

// Default horses if localStorage is empty
const FALLBACK_HORSES = [
  { id: 1, name: 'Aurelius' },
  { id: 2, name: 'Midnight Star' },
  { id: 3, name: 'Velvet Thunder' },
  { id: 4, name: 'Storm Rider' },
  { id: 5, name: 'Thunder Bolt' },
  { id: 6, name: 'Golden Eagle' },
  { id: 7, name: 'Shadow Dancer' },
  { id: 8, name: 'Pegasus' }
]

export default function RaceManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [races, setRaces] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRace, setEditingRace] = useState(null)
  const [delayingRace, setDelayingRace] = useState(null)
  const [delayForm, setDelayForm] = useState({ reason: '', newStartTime: '', newEndTime: '' })
  const [isProcessing, setIsProcessing] = useState(false)

  // Registration Popup Modal States
  const [showRegModal, setShowRegModal] = useState(false)
  const [selectedRegRace, setSelectedRegRace] = useState(null)
  const [regDates, setRegDates] = useState({ registrationStartDate: '', registrationEndDate: '' })

  // Ticket Opening Modal States (Sau khi phân công trọng tài)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicketRace, setSelectedTicketRace] = useState(null)
  const [ticketFormData, setTicketFormData] = useState({
    ticketPrice: 50000,
    totalTickets: 5000
  })

  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tournamentFilter, setTournamentFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  const { searchQuery = '' } = useOutletContext() || {}

  const fetchData = async () => {
    try {
      const tourRes = await getAllTournaments()
      const fetchedTournaments = tourRes.data || tourRes || []
      setTournaments(fetchedTournaments)

      if (fetchedTournaments && fetchedTournaments.length > 0) {
        const allRaces = []
        for (const t of fetchedTournaments) {
          try {
            const scheduleRes = await getTournamentSchedule(t.id)
            const schedules = scheduleRes.data || []
            const formattedSchedules = schedules.map(s => {
              const dateStr = s.raceDate || (s.startTime ? s.startTime.split('T')[0] : '')
              const timeStr = s.startTime ? (s.startTime.includes('T') ? s.startTime.split('T')[1].substring(0, 5) : s.startTime.substring(0, 5)) : '00:00'
              const endTimeStr = s.endTime ? (s.endTime.includes('T') ? s.endTime.split('T')[1].substring(0, 5) : s.endTime.substring(0, 5)) : ''

              const computedSt = computeRaceStatus({
                status: s.status,
                refereeId: s.refereeId,
                referee: s.refereeName,
                date: dateStr,
                time: timeStr,
                endTime: endTimeStr
              })

              return {
                id: `R-${s.id}`,
                originalId: s.id,
                name: s.name,
                tournament: t.name,
                tournamentId: t.id,
                date: dateStr,
                time: timeStr,
                endTime: endTimeStr,
                distance: '1600m',
                status: computedSt,
                refereeId: s.refereeId,
                referee: s.refereeName,
                horses: 0
              }
            })
            allRaces.push(...formattedSchedules)
          } catch (err) {
            console.error(`Error fetching schedules for tournament ${t.id}`, err)
          }
        }
        
        let localCreated = []
        try {
          localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
        } catch (e) {}

        const combined = [...localCreated]
        allRaces.forEach(r => {
          const localMatch = localCreated.find(c => String(c.id) === String(r.id) || String(c.originalId) === String(r.originalId))
          if (!combined.some(c => String(c.id) === String(r.id) || String(c.originalId) === String(r.originalId))) {
            combined.push({
              ...r,
              refereeId: localMatch?.refereeId || r.refereeId,
              referee: localMatch?.referee || r.referee,
              ticketOpen: localMatch?.ticketOpen || r.ticketOpen || false,
              ticketPrice: localMatch?.ticketPrice || r.ticketPrice || 50000,
              totalTickets: localMatch?.totalTickets || r.totalTickets || 5000
            })
          }
        })
        setRaces(combined)
      } else {
        let localCreated = []
        try {
          localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
        } catch (e) {}
        setRaces(localCreated)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      let localCreated = []
      try {
        localCreated = JSON.parse(localStorage.getItem('created_races') || '[]')
      } catch (e) {}
      setRaces(localCreated)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredRaces = races
    .filter(race => {
      const globalQ = searchQuery.toLowerCase()
      const localQ = localSearchQuery.toLowerCase()

      const matchesGlobal = !globalQ ||
        race.name.toLowerCase().includes(globalQ) ||
        (race.tournament && race.tournament.toLowerCase().includes(globalQ)) ||
        race.id.toLowerCase().includes(globalQ)

      const matchesLocal = !localQ ||
        race.name.toLowerCase().includes(localQ) ||
        (race.tournament && race.tournament.toLowerCase().includes(localQ)) ||
        race.id.toLowerCase().includes(localQ)

      const matchesStatus = statusFilter === 'all' || (race.status && race.status.toLowerCase() === statusFilter.toLowerCase())

      const matchesTournament = tournamentFilter === 'all' ||
        String(race.tournamentId) === String(tournamentFilter) ||
        race.tournament === tournamentFilter

      return matchesGlobal && matchesLocal && matchesStatus && matchesTournament
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`)
      } else if (sortOrder === 'oldest') {
        return new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`)
      }
      return 0
    })

  // Horses list (load from localStorage if available)
  const [horsesList, setHorsesList] = useState(FALLBACK_HORSES)
  useEffect(() => {
    const stored = localStorage.getItem('mock_horses')
    if (stored) {
      try {
        setHorsesList(JSON.parse(stored))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Create/Edit Race Form state
  const [formData, setFormData] = useState({
    name: '',
    tournamentId: '',
    date: '',
    time: '',
    endTime: '',
    status: 'unassigned'
  })

  // Round Arrangement State
  const [arrangingRace, setArrangingRace] = useState(null)
  const [rounds, setRounds] = useState({})
  const [activeRoundIndex, setActiveRoundIndex] = useState(0)

  const openArrangement = (race) => {
    setArrangingRace(race)
    setActiveRoundIndex(0)

    if (!rounds[race.id]) {
      const initialRoundsForRace = [
        {
          name: 'Vòng loại 1',
          lanes: Array.from({ length: 8 }, (_, i) => ({
            lane: i + 1,
            horseId: i < 4 ? horsesList[i]?.id || '' : '',
            jockeyId: i < 4 ? mockJockeys[i]?.id || '' : ''
          }))
        },
        {
          name: 'Vòng Chung kết',
          lanes: Array.from({ length: 8 }, (_, i) => ({
            lane: i + 1,
            horseId: '',
            jockeyId: ''
          }))
        }
      ]
      setRounds(prev => ({
        ...prev,
        [race.id]: initialRoundsForRace
      }))
    }
  }

  // Handlers for Race Form
  const handleOpenAdd = () => {
    setEditingRace(null)
    const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE' || t.status === 'upcoming')
    setFormData({
      name: '',
      tournamentId: activeTournaments[0]?.id || (tournaments[0]?.id || ''),
      date: '',
      time: '',
      endTime: '',
      status: 'unassigned'
    })
    setShowForm(true)
  }

  const handleOpenEdit = (race) => {
    if (race.status === 'completed') {
      alert('Cuộc đua đã hoàn thành và công bố kết quả, không thể chỉnh sửa!')
      return
    }
    setEditingRace(race)
    setFormData({
      name: race.name,
      tournamentId: race.tournamentId || '',
      date: race.date,
      time: race.time,
      endTime: race.endTime || '',
      status: race.status
    })
    setShowForm(true)
  }

  const handleFinishRace = (race) => {
    if (!window.confirm(`Xác nhận KẾT THÚC cuộc đua: ${race.name}? Trạng thái sẽ chuyển sang CHỜ DUYỆT KẾT QUẢ.`)) return
    setRaces(prev => prev.map(r => r.id === race.id ? { ...r, status: 'reviewing' } : r))
    alert('✅ Đã kết thúc cuộc đua! Trạng thái hiện tại: CHỜ DUYỆT KẾT QUẢ.')
  }

  const handleApproveResult = async (race) => {
    if (!window.confirm(`Xác nhận DUYỆT KẾT QUẢ cho cuộc đua: ${race.name}? Sau khi duyệt, cuộc đua sẽ HOÀN THÀNH và không thể sửa.`)) return
    setIsProcessing(true)
    try {
      try {
        await publishRaceResult(race.originalId)
      } catch (e) {
        console.warn('API publish failed, updating locally', e)
      }
      setRaces(prev => prev.map(r => r.id === race.id ? { ...r, status: 'completed' } : r))
      alert('🎉 Đã duyệt và công bố kết quả cuộc đua thành công! Trạng thái đã chuyển sang HOÀN THÀNH.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartRace = async (race) => {
    if (!window.confirm(`Bạn có chắc muốn BẮT ĐẦU cuộc đua: ${race.name}?`)) return
    setIsProcessing(true)
    try {
      try {
        await startRace(race.originalId, { conditionsConfirmed: true })
      } catch (err) {
        console.warn('API start failed, updating locally', err)
      }
      setRaces(prev => prev.map(r => r.id === race.id ? { ...r, status: 'running' } : r))
      alert('🚀 Cuộc đua đã BẮT ĐẦU! Trạng thái hiện tại: ĐANG CHẠY.')
    } finally {
      setIsProcessing(false)
    }
  }

  const submitDelayRace = async (e) => {
    e.preventDefault()
    if (!delayForm.reason) {
      alert('Vui lòng nhập lý do hoãn!')
      return
    }
    setIsProcessing(true)
    try {
      try {
        let payload = { reason: delayForm.reason }
        if (delayForm.newStartTime && delayForm.newEndTime) {
          payload.newStartTime = new Date(delayForm.newStartTime).toISOString()
          payload.newEndTime = new Date(delayForm.newEndTime).toISOString()
        }
        await delayRace(delayingRace.originalId, payload)
      } catch (err) {
        console.warn('API delay failed, updating locally', err)
      }
      setRaces(prev => prev.map(r => r.id === delayingRace.id ? { ...r, status: 'delayed' } : r))
      alert('Đã hoãn cuộc đua thành công!')
      setDelayingRace(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveRace = async (e) => {
    e.preventDefault()
    if (editingRace && editingRace.status === 'completed') {
      alert('Cuộc đua đã hoàn thành và công bố kết quả, không thể chỉnh sửa!')
      return
    }

    if (!formData.name || !formData.tournamentId || !formData.date || !formData.time || !formData.endTime) {
      alert('Vui lòng điền đầy đủ thông tin cuộc đua!')
      return
    }

    if (formData.name.trim().length < 4) {
      alert('Tên cuộc đua phải có ít nhất 4 kí tự')
      return
    }

    const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())
    if (selectedT && selectedT.startDate && selectedT.endDate) {
      const tStart = new Date(selectedT.startDate)
      tStart.setHours(0, 0, 0, 0)
      const tEnd = new Date(selectedT.endDate)
      tEnd.setHours(23, 59, 59, 999)

      const raceDateObj = new Date(formData.date)
      raceDateObj.setHours(0, 0, 0, 0)

      if (raceDateObj < tStart || raceDateObj > tEnd) {
        alert('Ngày đua không nằm trong thời gian bắt đầu và thời gian kết thúc của giải đấu')
        return
      }

      const raceStartObj = new Date(`${formData.date}T${formData.time}`)
      const raceEndObj = new Date(`${formData.date}T${formData.endTime}`)

      if (raceStartObj < tStart || raceStartObj > tEnd) {
        alert('Giờ xuất phát không nằm trong thời gian bắt đầu và thời gian kết thúc của giải đấu')
        return
      }

      if (raceEndObj < tStart || raceEndObj > tEnd) {
        alert('Giờ kết thúc không nằm trong thời gian bắt đầu và thời gian kết thúc của giải đấu')
        return
      }

      if (raceStartObj >= raceEndObj) {
        alert('Giờ kết thúc phải sau giờ xuất phát')
        return
      }
    }

    if (editingRace) {
      const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())
      const payload = {
        name: formData.name,
        raceName: formData.name,
        raceDate: formData.date,
        location: selectedT ? (selectedT.location || selectedT.venue || "Trường đua Phu Thọ") : "Trường đua Phu Thọ",
        startTime: `${formData.date}T${formData.time}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        status: formData.status.toUpperCase(),
        raceTrackId: 1,
        tournamentId: Number(formData.tournamentId)
      }

      try {
        await updateRaceSchedule(formData.tournamentId, editingRace.originalId, payload)
      } catch (error) {
        console.warn("API Error updating race schedule, updating locally:", error)
      }

      setRaces(races.map(r =>
        r.id === editingRace.id ? { ...r, ...formData } : r
      ))
      setShowForm(false)
      alert('Cập nhật cuộc đua thành công!')
    } else {
      const selectedT = tournaments.find(t => t.id.toString() === formData.tournamentId.toString())
      const payload = {
        name: formData.name,
        raceName: formData.name,
        raceDate: formData.date,
        location: selectedT ? (selectedT.location || selectedT.venue || "Trường đua Phu Thọ") : "Trường đua Phu Thọ",
        startTime: `${formData.date}T${formData.time}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        status: 'UNASSIGNED',
        raceTrackId: 1,
        tournamentId: Number(formData.tournamentId)
      }

      let newRace = {
        id: `R-${Date.now().toString().slice(-4)}`,
        originalId: Date.now(),
        name: formData.name,
        tournament: selectedT?.name || 'Giải đấu',
        tournamentId: formData.tournamentId,
        date: formData.date,
        time: formData.time,
        endTime: formData.endTime,
        distance: '1600m',
        status: 'pending_registration',
        registrationOpen: false,
        horses: 0
      }

      try {
        const result = await createRaceSchedule(formData.tournamentId, payload)
        const savedData = result?.data || result || {}
        if (savedData.id) {
          newRace.id = `R-${savedData.id}`
          newRace.originalId = savedData.id
        }
      } catch (error) {
        console.warn("API Error creating race schedule, adding locally:", error)
      }

      try {
        const stored = JSON.parse(localStorage.getItem('created_races') || '[]')
        localStorage.setItem('created_races', JSON.stringify([newRace, ...stored.filter(r => String(r.id) !== String(newRace.id))]))
      } catch (e) {
        console.warn('LocalStorage save error:', e)
      }

      setRaces(prev => [newRace, ...prev])
      setShowForm(false)
      fetchData()
      alert('Tạo cuộc đua thành công!')
    }
  }

  const handleOpenRegistrationModal = (race) => {
    setSelectedRegRace(race)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000)
    const formatDt = (d) => {
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    
    setRegDates({
      registrationStartDate: formatDt(now),
      registrationEndDate: formatDt(tomorrow)
    })
    setShowRegModal(true)
  }

  const handleSaveRaceRegistration = async (e) => {
    e.preventDefault()
    if (!selectedRegRace) return
    if (!regDates.registrationStartDate || !regDates.registrationEndDate) {
      alert('Vui lòng chọn đầy đủ thời gian mở và đóng đăng ký!')
      return
    }

    if (new Date(regDates.registrationEndDate) <= new Date(regDates.registrationStartDate)) {
      alert('⚠️ Thời gian đóng đăng ký phải sau thời gian mở đăng ký!')
      return
    }

    const updatedStatus = 'registration_open'
    try {
      try {
        if (selectedRegRace.tournamentId) {
          await updateTournamentRegistration(selectedRegRace.tournamentId, {
            registrationStartDate: regDates.registrationStartDate,
            registrationEndDate: regDates.registrationEndDate
          })
        }
        await updateRaceSchedule(selectedRegRace.tournamentId || 1, selectedRegRace.originalId || selectedRegRace.id, {
          status: 'REGISTRATION_OPEN',
          registrationOpen: true,
          registrationStartDate: regDates.registrationStartDate,
          registrationEndDate: regDates.registrationEndDate
        })
      } catch (err) {
        console.warn('API update error, saving fallback config locally:', err)
      }

      const stored = JSON.parse(localStorage.getItem('created_races') || '[]')
      const updatedList = stored.map(r => {
        if (String(r.id) === String(selectedRegRace.id) || String(r.originalId) === String(selectedRegRace.originalId)) {
          return {
            ...r,
            status: updatedStatus,
            registrationOpen: true,
            registrationStartDate: regDates.registrationStartDate,
            registrationEndDate: regDates.registrationEndDate
          }
        }
        return r
      })
      if (!updatedList.some(r => String(r.id) === String(selectedRegRace.id))) {
        updatedList.push({
          ...selectedRegRace,
          status: updatedStatus,
          registrationOpen: true,
          registrationStartDate: regDates.registrationStartDate,
          registrationEndDate: regDates.registrationEndDate
        })
      }
      localStorage.setItem('created_races', JSON.stringify(updatedList))

      setShowRegModal(false)
      fetchData()
      alert(`Đã mở đăng ký cho cuộc đua "${selectedRegRace.name}"`)
    } catch (err) {
      alert('Lỗi khi mở đăng ký: ' + err.message)
    }
  }

  const handleOpenTicketModal = (race) => {
    setSelectedTicketRace(race)
    setTicketFormData({
      ticketPrice: race.ticketPrice || 50000,
      totalTickets: race.totalTickets || 5000
    })
    setShowTicketModal(true)
  }

  const handleSaveTicketConfig = async (e) => {
    e.preventDefault()
    if (!selectedTicketRace) return

    try {
      const stored = JSON.parse(localStorage.getItem('created_races') || '[]')
      const priceNum = Number(ticketFormData.ticketPrice) || 50000
      const countNum = Number(ticketFormData.totalTickets) || 5000

      const updatedList = stored.map(r => {
        if (String(r.id) === String(selectedTicketRace.id) || String(r.originalId) === String(selectedTicketRace.originalId)) {
          return {
            ...r,
            ticketOpen: true,
            ticketPrice: priceNum,
            totalTickets: countNum,
            ticketOpenDate: new Date().toISOString()
          }
        }
        return r
      })

      if (!updatedList.some(r => String(r.id) === String(selectedTicketRace.id))) {
        updatedList.push({
          ...selectedTicketRace,
          ticketOpen: true,
          ticketPrice: priceNum,
          totalTickets: countNum,
          ticketOpenDate: new Date().toISOString()
        })
      }

      localStorage.setItem('created_races', JSON.stringify(updatedList))
      setShowTicketModal(false)
      fetchData()
      alert(`🎟️ Đã mở bán vé cho khán giả thành công cho cuộc đua "${selectedTicketRace.name}"!`)
    } catch (err) {
      alert('Lỗi khi mở đặt vé: ' + err.message)
    }
  }

  const handleCloseDuePredictions = async () => {
    try {
      await closeDuePredictions()
      alert('🔒 Đã đóng tất cả cổng dự đoán/đặt cược đã quá giờ thi đấu!')
    } catch (e) {
      alert('🔒 Đã cập nhật trạng thái đóng cược quá hạn (Local Fallback)!')
    }
  }

  const handleUpdateSystemRankings = async () => {
    try {
      await updateSystemRankings()
      alert('🏆 Đã cập nhật Bảng xếp hạng toàn hệ thống thành công!')
    } catch (e) {
      alert('🏆 Đã cập nhật Bảng xếp hạng toàn hệ thống (Local Fallback)!')
    }
  }

  return (
    <div className="race-page">
      <div className="admin-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="admin-page-title">Quản lý Cuộc đua</h1>
          <p className="admin-page-sub">Theo dõi vòng đời cuộc đua, phân công trọng tài, điều khiển giải đấu và duyệt kết quả</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={handleCloseDuePredictions}
            title="Tự động đóng tất cả dự đoán quá hạn"
          >
            🔒 Đóng cược quá hạn
          </button>
          <button 
            type="button" 
            className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={handleUpdateSystemRankings}
            title="Đồng bộ lại Bảng xếp hạng toàn hệ thống"
          >
            🏆 Cập nhật BXH hệ thống
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--gold"
            onClick={handleOpenAdd}
          >
            + Tạo cuộc đua mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="admin-input"
          placeholder="Tìm theo tên cuộc đua, mã hoặc giải đấu..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select
          className="admin-select"
          value={tournamentFilter}
          onChange={(e) => setTournamentFilter(e.target.value)}
        >
          <option value="all">🏆 Tất cả Giải đấu</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả Trạng thái</option>
          <option value="unassigned">Chờ phân công trọng tài</option>
          <option value="scheduled">Chờ diễn ra</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="running">Đang chạy</option>
          <option value="reviewing">Chờ duyệt kết quả</option>
          <option value="completed">Hoàn thành</option>
          <option value="delayed">Bị hoãn</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Sắp xếp: Mới nhất</option>
          <option value="oldest">Sắp xếp: Cũ nhất</option>
        </select>
      </div>

      {/* Create / Edit Popup Modal */}
      {showForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="admin-card" style={{
            width: '100%',
            maxWidth: '560px',
            border: '1px solid rgba(212,175,55,0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <h3>{editingRace ? `Sửa cuộc đua: ${editingRace.name}` : 'Tạo cuộc đua mới'}</h3>
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRace} className="admin-card-body race-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tên cuộc đua (Race name)</label>
                <input
                  required
                  className="admin-input"
                  placeholder="Ví dụ: Derby nước rút 1600m..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thuộc Giải đấu</label>
                <select
                  className="admin-select"
                  value={formData.tournamentId}
                  onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ngày đua</label>
                <input
                  required
                  type="date"
                  className="admin-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giờ xuất phát</label>
                <input
                  required
                  type="time"
                  className="admin-input"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giờ kết thúc</label>
                <input
                  required
                  type="time"
                  className="admin-input"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>



              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', gridColumn: 'span 2', marginTop: '12px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--gold"
                >
                  Lưu cuộc đua
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Race Cards Grid grouped by Tournament */}
      {(() => {
        const groupedRaces = filteredRaces.reduce((acc, race) => {
          const tourName = race.tournament || 'Giải đấu khác'
          if (!acc[tourName]) acc[tourName] = []
          acc[tourName].push(race)
          return acc
        }, {})

        const groupKeys = Object.keys(groupedRaces)

        if (groupKeys.length === 0) {
          return (
            <div className="admin-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Không tìm thấy cuộc đua nào phù hợp với bộ lọc.
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {groupKeys.map((tourName) => {
              const raceList = groupedRaces[tourName]
              return (
                <div key={tourName} className="tournament-race-group">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(30,41,59,0.8) 100%)',
                    borderLeft: '4px solid #d4af37',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>🏆</span>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                        {tourName}
                      </h2>
                    </div>
                    <span style={{ fontSize: '13px', color: '#d4af37', fontWeight: '600', background: 'rgba(212,175,55,0.15)', padding: '4px 12px', borderRadius: '12px' }}>
                      {raceList.length} cuộc đua
                    </span>
                  </div>

                  <div className="race-cards-grid">
                    {raceList.map((race) => (
                      <div key={race.id} className="admin-card race-card-item">
                        <div className="race-card-top">
                          <span className="race-card-id">{race.id}</span>
                          <StatusBadge status={race.status} />
                        </div>
                        <h3>{race.name}</h3>
                        <p className="race-card-tournament">{race.tournament}</p>
                        <div className="race-card-meta">
                          <span>📅 {race.date} · ⏰ {race.time}</span>
                          <span>📏 Cự ly: {race.distance}</span>
                        </div>
                        <div className="admin-table-actions">
                          {/* Sửa button: CHỈ HIỂN THỊ KHI CHƯA HOÀN THÀNH */}
                          {race.status !== 'completed' ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost admin-btn--sm"
                              onClick={() => handleOpenEdit(race)}
                            >
                              Sửa
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                              🔒 Đã hoàn thành
                            </span>
                          )}

                          {/* Action Button theo Vòng Đời Trạng Thái */}
                          {(race.status === 'pending_registration' || !race.status || race.status === 'scheduled') && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--gold admin-btn--sm"
                              style={{ backgroundColor: '#10B981', color: '#FFF' }}
                              onClick={() => handleOpenRegistrationModal(race)}
                              title="Mở thời gian đăng ký cho Chủ ngựa và Jockey"
                            >
                              📢 Mở đăng ký
                            </button>
                          )}

                          {race.status === 'registration_open' && (
                            <span className="admin-badge admin-badge--green" style={{ fontSize: '11px' }}>
                              ✅ Đang mở đăng ký
                            </span>
                          )}

                          {race.status === 'unassigned' && !race.refereeId && (!race.referee || race.referee === 'Chưa phân công') ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-btn--sm"
                              style={{ borderColor: '#a855f7', color: '#a855f7' }}
                              onClick={() => navigate('/admin/referees')}
                              title="Chuyển sang trang Phân công trọng tài"
                            >
                              Phân công TT
                            </button>
                          ) : (
                            !race.ticketOpen ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--gold admin-btn--sm"
                                style={{ backgroundColor: '#D4AF37', color: '#111', fontWeight: 'bold' }}
                                onClick={() => handleOpenTicketModal(race)}
                                title="Đã phân công trọng tài: Bấm để mở cổng bán vé cho khán giả"
                              >
                                🎟️ Mở đặt vé
                              </button>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span className="admin-badge" style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontSize: '11px', padding: '3px 8px' }}>
                                  🎟️ Vé: {Number(race.ticketPrice || 50000).toLocaleString('vi-VN')}đ
                                </span>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--ghost admin-btn--sm"
                                  onClick={() => handleOpenTicketModal(race)}
                                  title="Chỉnh sửa cấu hình đặt vé"
                                >
                                  ⚙️ Vé
                                </button>
                              </div>
                            )
                          )}

                          {(race.status === 'unassigned' || race.status === 'scheduled' || race.status === 'ongoing') && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-btn--sm"
                              onClick={() => openArrangement(race)}
                            >
                              Sắp xếp cuốc/vòng
                            </button>
                          )}

                          {(race.status === 'scheduled' || race.status === 'ongoing') && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--outline admin-btn--sm"
                                style={{ borderColor: '#22c55e', color: '#22c55e' }}
                                onClick={() => handleStartRace(race)}
                                disabled={isProcessing}
                              >
                                🚀 Bắt đầu
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => {
                                  setDelayingRace(race)
                                  setDelayForm({ reason: '', newStartTime: '', newEndTime: '' })
                                }}
                                disabled={isProcessing}
                              >
                                Hoãn
                              </button>
                            </>
                          )}

                          {race.status === 'running' && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--gold admin-btn--sm"
                              onClick={() => handleFinishRace(race)}
                              disabled={isProcessing}
                            >
                              🏁 Kết thúc đua
                            </button>
                          )}

                          {race.status === 'reviewing' && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--gold admin-btn--sm"
                              onClick={() => handleApproveResult(race)}
                              disabled={isProcessing}
                            >
                              ✓ Duyệt & Công bố KQ
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Delay Modal */}
      {delayingRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="admin-card" style={{ width: '400px', border: '1px solid #ef4444' }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#ef4444' }}>Hoãn cuộc đua: {delayingRace.name}</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setDelayingRace(null)}>✕</button>
            </div>
            <form onSubmit={submitDelayRace} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-muted" style={{ fontSize: '12px' }}>Lý do hoãn (*)</label>
                <textarea
                  className="admin-input"
                  required
                  rows="3"
                  value={delayForm.reason}
                  onChange={(e) => setDelayForm({ ...delayForm, reason: e.target.value })}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setDelayingRace(null)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--danger" disabled={isProcessing}>Xác nhận hoãn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION TIMING POPUP MODAL */}
      {showRegModal && selectedRegRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '460px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <h3>Thiết Lập Thời Gian Mở Đăng Ký</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setShowRegModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveRaceRegistration} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', display: 'block' }}>Cuộc đua</span>
                <strong style={{ color: '#fff', fontSize: '15px' }}>{selectedRegRace.name}</strong>
                <span style={{ fontSize: '12px', color: '#d4af37', display: 'block' }}>{selectedRegRace.tournament}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thời gian Mở đăng ký</label>
                <input
                  required
                  type="datetime-local"
                  className="admin-input"
                  value={regDates.registrationStartDate}
                  onChange={(e) => setRegDates({ ...regDates, registrationStartDate: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Thời gian Đóng đăng ký</label>
                <input
                  required
                  type="datetime-local"
                  className="admin-input"
                  value={regDates.registrationEndDate}
                  onChange={(e) => setRegDates({ ...regDates, registrationEndDate: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowRegModal(false)}>Hủy bỏ</button>
                <button type="submit" className="admin-btn admin-btn--gold">Lưu & Mở đăng ký</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET BOOKING OPENING MODAL */}
      {showTicketModal && selectedTicketRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '440px', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div className="admin-card-head" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#d4af37' }}>🎟️ Mở Đặt Vé Khán Giả</h3>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setShowTicketModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTicketConfig} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>
                Cuộc đua: <strong style={{ color: '#fff' }}>{selectedTicketRace.name}</strong> ({selectedTicketRace.tournament})
              </p>
              <p style={{ color: '#4ade80', fontSize: '12px', margin: 0 }}>
                ✓ Trọng tài phụ trách: <strong>{selectedTicketRace.referee || 'Đã phân công'}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Giá vé khán giả (VND)</label>
                <input
                  required
                  type="number"
                  step="10000"
                  className="admin-input"
                  value={ticketFormData.ticketPrice}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, ticketPrice: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Số lượng vé phát hành (Vé)</label>
                <input
                  required
                  type="number"
                  className="admin-input"
                  value={ticketFormData.totalTickets}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, totalTickets: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowTicketModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn--gold">Mở Đặt Vé Ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
