import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './contexts/AuthContext'
import GlobalAlertModal from './components/Modal/GlobalAlertModal'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <GlobalAlertModal />
    </AuthProvider>
  )
}

