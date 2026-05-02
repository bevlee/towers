import { useState, useEffect, useCallback } from 'react'
import type { RecordModel } from 'pocketbase'
import { pb } from '../pb'

interface PbAuthState {
  user: RecordModel | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export function usePbAuth(): PbAuthState {
  const [user, setUser]   = useState<RecordModel | null>(pb.authStore.isValid ? (pb.authStore.record as RecordModel) : null)
  const [token, setToken] = useState<string | null>(pb.authStore.isValid ? pb.authStore.token : null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Keep state in sync if authStore changes externally (e.g. token expiry).
  useEffect(() => {
    return pb.authStore.onChange((newToken, model) => {
      setUser(model as RecordModel | null)
      setToken(newToken)
    })
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const auth = await pb.collection('users').authWithPassword(username, password)
      setUser(auth.record as RecordModel)
      setToken(auth.token)
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await pb.collection('users').create({ username, password, passwordConfirm: password })
      const auth = await pb.collection('users').authWithPassword(username, password)
      setUser(auth.record as RecordModel)
      setToken(auth.token)
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { user, token, loading, error, login, register, logout, clearError }
}

function extractMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // PocketBase ClientResponseError shape
    const e = err as { data?: { message?: string; data?: Record<string, { message: string }> }; message?: string }
    if (e.data?.message) return e.data.message
    if (e.data?.data) {
      const first = Object.values(e.data.data).find((f) => f.message)
      if (first) return first.message
    }
    if (e.message) return e.message
  }
  return 'An unexpected error occurred'
}
