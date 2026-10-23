import { useState, useEffect, useCallback } from 'react'

export interface Player {
  id: string
  username: string
}

interface AuthState {
  user: Player | null
  loading: boolean
  error: string | null
  /** Resolves false, with `error` set, when the session couldn't be ended. */
  logout: () => Promise<boolean>
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
    const res = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' }).catch(() => null)
    if (!res?.ok) {
      setError('Sign-out failed. Please try again.')
      return false
    }
    setError(null)
    setUser(null)
    return true
  }, [])

  return { user, loading, error, logout }
}
