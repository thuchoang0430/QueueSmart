import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiGet, apiPost, clearToken, getToken, setToken } from '../api/client'

export type Role = 'user' | 'admin'

export interface CurrentUser {
  id: number
  name: string
  email: string
  role: Role
}

interface AuthResponse {
  user: CurrentUser
  token: string
}

interface AuthContextValue {
  currentUser: CurrentUser | null
  /** True until the stored token has been checked on first load. */
  loading: boolean
  login: (email: string, password: string) => Promise<CurrentUser>
  register: (name: string, email: string, password: string) => Promise<CurrentUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Accounts now live in the backend (see backend/src/store/memoryStore.ts).
// The seeded demo logins are unchanged: user@test.com / admin@test.com,
// both with the password "password".
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  // The token survives a page refresh in localStorage, but the backend keeps
  // sessions in memory - so after a server restart the token is stale and we
  // have to drop it rather than show a half-logged-in UI.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }

    apiGet<{ user: CurrentUser }>('/auth/me')
      .then((data) => setCurrentUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<CurrentUser> {
    const data = await apiPost<AuthResponse>('/auth/login', { email, password })
    setToken(data.token)
    setCurrentUser(data.user)
    return data.user
  }

  async function register(name: string, email: string, password: string): Promise<CurrentUser> {
    const data = await apiPost<AuthResponse>('/auth/register', { name, email, password })
    setToken(data.token)
    setCurrentUser(data.user)
    return data.user
  }

  async function logout(): Promise<void> {
    // Best effort - if the call fails the local session still has to end.
    try {
      await apiPost('/auth/logout')
    } catch {
      // ignored
    }
    clearToken()
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
