import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import AdminLayout from '../layouts/AdminLayout'
import HomePage from '../pages/HomePage'
import Login from '../pages/Auth/Login'
import Register from '../pages/Auth/Register'
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
      </Route>

      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/horses" element={<HorseList />} />
        <Route path="/horses/new" element={<HorseForm />} />
        <Route path="/horses/:id" element={<HorseDetail />} />
      </Route>

      <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/tournaments" element={<TournamentManagement />} />
        <Route path="/admin/races" element={<RaceManagement />} />
        <Route path="/admin/registrations" element={<RegistrationApproval />} />
        <Route path="/admin/referees" element={<RefereeAssignment />} />
        <Route path="/admin/results" element={<ResultApproval />} />
        <Route path="/admin/rankings" element={<RankingManagement />} />
        <Route path="/admin/violations" element={<ViolationManagement />} />
        <Route path="/admin/complaints" element={<ComplaintManagement />} />
        <Route path="/admin/tickets" element={<TicketManagement />} />
        <Route path="/admin/payments" element={<PaymentManagement />} />
        <Route path="/admin/notifications" element={<NotificationManagement />} />
        <Route path="/admin/reports" element={<ReportsAnalytics />} />
        <Route path="/admin/audit-log" element={<AuditLog />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
