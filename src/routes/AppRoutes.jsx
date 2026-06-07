import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import AdminLayout from '../layouts/AdminLayout'
import JockeyLayout from '../layouts/JockeyLayout'
import HomePage from '../pages/HomePage'
import Login from '../pages/Auth/Login'
import Register from '../pages/Auth/Register'
import ResetPassword from '../pages/Auth/ResetPassword'
import HorseList from '../pages/Horses/HorseList'
import HorseDetail from '../pages/Horses/HorseDetail'
import HorseForm from '../pages/Horses/HorseForm'
import Dashboard from '../pages/admin/Dashboard/Dashboard'
import UserManagement from '../pages/admin/Users/UserManagement'
import TournamentManagement from '../pages/admin/Tournaments/TournamentManagement'
import RaceManagement from '../pages/admin/Races/RaceManagement'
import RegistrationApproval from '../pages/admin/Registrations/RegistrationApproval'
import RefereeAssignment from '../pages/admin/Referees/RefereeAssignment'
import ResultApproval from '../pages/admin/Results/ResultApproval'
import RankingManagement from '../pages/admin/Rankings/RankingManagement'
import ViolationManagement from '../pages/admin/Violations/ViolationManagement'
import ComplaintManagement from '../pages/admin/Complaints/ComplaintManagement'
import TicketManagement from '../pages/admin/Tickets/TicketManagement'
import PaymentManagement from '../pages/admin/Payments/PaymentManagement'
import NotificationManagement from '../pages/admin/Notifications/NotificationManagement'
import ReportsAnalytics from '../pages/admin/Reports/ReportsAnalytics'
import AuditLog from '../pages/admin/AuditLog/AuditLog'
import JockeyManagement from '../pages/admin/Jockeys/JockeyManagement'
import HorseManagement from '../pages/admin/Horses/HorseManagement'
import PredictionManagement from '../pages/admin/Predictions/PredictionManagement'
import SpectatorLayout from '../layouts/SpectatorLayout'
import SpectatorDashboard from '../pages/spectator/Dashboard/SpectatorDashboard'
import SpectatorRankings from '../pages/spectator/Rankings/SpectatorRankings'
import SpectatorPredictions from '../pages/spectator/Predictions/SpectatorPredictions'
import SpectatorProfile from '../pages/spectator/Profile/SpectatorProfile'
// Referee pages
import RefereeLayout from '../layouts/RefereeLayout'
import RefereeInspection from '../pages/referee/Inspection/RefereeInspection'
import RefereeTracking from '../pages/referee/Tracking/RefereeTracking'
import RefereeViolations from '../pages/referee/Violations/RefereeViolations'
// Jockey pages
import JockeyDashboard from '../pages/jockey/Dashboard/JockeyDashboard'
import Invitations from '../pages/jockey/Invitations/Invitations'
import MyRaces from '../pages/jockey/MyRaces/MyRaces'
import PersonalResults from '../pages/jockey/PersonalResults/PersonalResults'
import Rankings from '../pages/jockey/Rankings/Rankings'
import Profile from '../pages/jockey/Profile/Profile'
import { useAuth } from '../contexts/AuthContext'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/horses" element={<HorseList />} />
        <Route path="/horses/new" element={<HorseForm />} />
        <Route path="/horses/:id" element={<HorseDetail />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/tournaments" element={<TournamentManagement />} />
        <Route path="/admin/races" element={<RaceManagement />} />
        <Route path="/admin/horses" element={<HorseManagement />} />
        <Route path="/admin/jockeys" element={<JockeyManagement />} />
        <Route path="/admin/registrations" element={<RegistrationApproval />} />
        <Route path="/admin/referees" element={<RefereeAssignment />} />
        <Route path="/admin/results" element={<ResultApproval />} />
        <Route path="/admin/predictions" element={<PredictionManagement />} />
        <Route path="/admin/rankings" element={<RankingManagement />} />
        <Route path="/admin/violations" element={<ViolationManagement />} />
        <Route path="/admin/complaints" element={<ComplaintManagement />} />
        <Route path="/admin/tickets" element={<TicketManagement />} />
        <Route path="/admin/payments" element={<PaymentManagement />} />
        <Route path="/admin/notifications" element={<NotificationManagement />} />
        <Route path="/admin/reports" element={<ReportsAnalytics />} />
        <Route path="/admin/audit-log" element={<AuditLog />} />
      </Route>

      {/* ── Jockey Portal ── */}
      <Route element={<PrivateRoute><JockeyLayout /></PrivateRoute>}>
        <Route path="/jockey" element={<JockeyDashboard />} />
        <Route path="/jockey/invitations" element={<Invitations />} />
        <Route path="/jockey/my-races" element={<MyRaces />} />
        <Route path="/jockey/results" element={<PersonalResults />} />
        <Route path="/jockey/rankings" element={<Rankings />} />
        <Route path="/jockey/profile" element={<Profile />} />
      </Route>

      {/* ── Referee Portal ── */}
      <Route element={<PrivateRoute><RefereeLayout /></PrivateRoute>}>
        <Route path="/referee" element={<RefereeInspection />} />
        <Route path="/referee/tracking" element={<RefereeTracking />} />
        <Route path="/referee/violations" element={<RefereeViolations />} />
      </Route>

      {/* ── Spectator Portal ── */}
      <Route element={<PrivateRoute><SpectatorLayout /></PrivateRoute>}>
        <Route path="/spectator" element={<SpectatorDashboard />} />
        <Route path="/spectator/rankings" element={<SpectatorRankings />} />
        <Route path="/spectator/predictions" element={<SpectatorPredictions />} />
        <Route path="/spectator/profile" element={<SpectatorProfile />} />
      </Route>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
