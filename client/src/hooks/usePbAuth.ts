import { useState, useEffect, useCallback } from 'react'
import { pb } from '../pb'

type RecordModel = Record<string, unknown> & { id: string }

interface PbAuthState {
  user: RecordModel | null
  token: string | null
  loading: boolean
  error: string | null
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export function usePbAuth(): PbAuthState {
  const [user, setUser]   = useState<RecordModel | null>(pb.authStore.isValid ? (pb.authStore.model as RecordModel) : null)
  const [token, setToken] = useState<string | null>(pb.authStore.isValid ? pb.authStore.token : null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Keep state in sync if authStore changes externally (e.g. token expiry).
  useEffect(() => {
    return pb.authStore.onChange((newToken: string, model: unknown) => {
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

  const register = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await pb.collection('users').create({ username, email, password, passwordConfirm: password })
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
    const e = err as { data?: { message?: string; data?: Record<string, { code?: string; message: string }> }; message?: string }
    const fields = e.data?.data

    if (fields) {
      if (fields.username?.code === 'validation_not_unique') return 'Username is already taken.'
      if (fields.username?.code === 'validation_length_out_of_range') return 'Username must be at least 3 characters.'
      if (fields.email?.code === 'validation_not_unique') return 'Email is already registered.'
      if (fields.email?.code === 'validation_required') return 'Email is required.'
      if (fields.email?.code === 'validation_is_email') return 'Please enter a valid email address.'
      if (fields.password?.code === 'validation_length_out_of_range') return 'Password must be at least 8 characters.'
      if (fields.passwordConfirm?.code === 'validation_values_mismatch') return 'Passwords do not match.'
      const first = Object.values(fields).find((f) => f.message)
      if (first) return first.message
    }

    if (e.data?.message) return e.data.message
    if (e.message) return e.message
  }
  return 'An unexpected error occurred'
}
