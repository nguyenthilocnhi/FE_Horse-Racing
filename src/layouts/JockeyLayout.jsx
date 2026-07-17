import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import JockeySidebar from '../components/jockey/JockeySidebar'
import JockeyHeader from '../components/jockey/JockeyHeader'
import { useAuth } from '../contexts/AuthContext'
import * as tournamentService from '../services/tournamentService'
import '../styles/jockey-layout.css'
import '../styles/jockey-common.css'

export default function JockeyLayout() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadPendingCount() {
      if (!user?.id) return
      try {
        const tournaments = await tournamentService.getTournaments()
        if (cancelled || !Array.isArray(tournaments)) return
        
        let count = 0
        const promises = tournaments.map(async (t) => {
          try {
            const schedule = await tournamentService.getTournamentSchedule(t.id)
            if (Array.isArray(schedule)) {
              schedule.forEach(race => {
                const participations = race.participations || race.raceParticipations || [];
                participations.forEach(p => {
                  const jockeyId = p.jockeyId || p.jockey?.id;
                  const status = (p.status || '').toUpperCase();
                  if (jockeyId === user.id && (status === 'PENDING' || status === 'PENDING_CONFIRMATION')) {
                    count++;
                  }
                });
              });
            }
          } catch (_) {}
        })
        
        await Promise.all(promises)
        if (!cancelled) {
          setPendingCount(count)
        }
      } catch (err) {
        console.warn("Failed to fetch pending count from API:", err)
      }
    }
    loadPendingCount()
    return () => { cancelled = true }
  }, [user?.id])

  return (
    <div className="jockey-shell">
      <JockeySidebar inviteCount={pendingCount} />
      <div className="jockey-main">
        <JockeyHeader />
        <div className="jockey-content">
          <Outlet context={{ pendingCount, setPendingCount }} />
        </div>
      </div>
    </div>
  )
}

