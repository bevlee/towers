import { useState, useEffect, useCallback } from 'react'

export interface Player {
  id: string
  username: string
}

interface AuthState {
  user: Player | null
  loading: boolean
  error: string | null
  logout: () => Promise<void>
}

/** The signed-in player, resolved by the server from the shared bevsoft.com auth cookie. */
export function useAuth(): AuthState {
  const [user, setUser]       = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Sign-in is unavailable')
        setUser(await res.json())
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Sign-in is unavailable'))
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' }).catch(() => {})
    setUser(null)
  }, [])

  return { user, loading, error, logout }
}
