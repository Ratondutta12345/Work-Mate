import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearAuth,
  fetchMe,
  getStoredUser,
  getToken,
  loginRequest,
  logoutRequest,
  saveAuth,
  signupRequest,
  socialLoginRequest,
} from '../services/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function boot() {
      const token = getToken()
      const cached = getStoredUser()
      if (!token) {
        setUser(null)
        setReady(true)
        return
      }

      if (cached) setUser(cached)

      try {
        const data = await fetchMe()
        setUser(data.user)
        saveAuth(token, data.user)
      } catch {
        clearAuth()
        setUser(null)
      } finally {
        setReady(true)
      }
    }

    boot()
  }, [])

  const persistSession = (token, nextUser) => {
    saveAuth(token, nextUser)
    setUser(nextUser)
  }

  const login = async ({ email, password }) => {
    const data = await loginRequest({ email, password })
    persistSession(data.token, data.user)
    return data.user
  }

  const signup = async ({ name, email, password }) => {
    const data = await signupRequest({ name, email, password })
    persistSession(data.token, data.user)
    return data.user
  }

  const loginWithProvider = async (provider) => {
    const data = await socialLoginRequest(provider)
    persistSession(data.token, data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } catch {
      // clear local session even if API is unreachable
    }
    clearAuth()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, ready, login, signup, loginWithProvider, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
