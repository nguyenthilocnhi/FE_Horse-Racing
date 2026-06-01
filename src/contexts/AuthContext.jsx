import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))

  useEffect(() => {
    const disableDevAutoLogin = localStorage.getItem('disableDevAutoLogin') === '1'
    if (import.meta.env.DEV && !disableDevAutoLogin && !token) {
      setToken('dev-token')
      setUser({
        id: 'DEV-ADMIN',
        name: 'Admin Demo',
        role: 'ADMIN',
      })
    }
  }, [token])

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  async function login(credentials) {
    const data = await authService.login(credentials)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  function logout() {
    if (import.meta.env.DEV) {
      localStorage.setItem('disableDevAutoLogin', '1')
    }
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
