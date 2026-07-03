import { useState, useEffect, useCallback } from 'react'
import { pb } from '../pb'

type RecordModel = Record<string, unknown> & { id: string }

export type FieldErrors = Partial<Record<'username' | 'email' | 'password' | 'passwordConfirm', string>>

export interface AuthError {
  message: string | null
  fields: FieldErrors
}

interface PbAuthState {
  user: RecordModel | null
  token: string | null
  loading: boolean
  error: AuthError
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const NO_ERROR: AuthError = { message: null, fields: {} }

export function usePbAuth(): PbAuthState {
  const [user, setUser]   = useState<RecordModel | null>(pb.authStore.isValid ? (pb.authStore.model as RecordModel) : null)
  const [token, setToken] = useState<string | null>(pb.authStore.isValid ? pb.authStore.token : null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<AuthError>(NO_ERROR)

  useEffect(() => {
    return pb.authStore.onChange((newToken: string, model: unknown) => {
      setUser(model as RecordModel | null)
      setToken(newToken)
    })
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(NO_ERROR)
    try {
      const auth = await pb.collection('users').authWithPassword(username, password)
      setUser(auth.record as RecordModel)
      setToken(auth.token)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true)
    setError(NO_ERROR)
    try {
      await pb.collection('users').create({ username, email, password, passwordConfirm: password })
    } catch (err) {
      setError(extractError(err))
      setLoading(false)
      return
    }
    try {
      const auth = await pb.collection('users').authWithPassword(username, password)
      setUser(auth.record as RecordModel)
      setToken(auth.token)
    } catch {
      setError({ message: 'Account created. Please sign in.', fields: {} })
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }, [])

  const clearError = useCallback(() => setError(NO_ERROR), [])

  return { user, token, loading, error, login, register, logout, clearError }
}

function fieldMessage(field: string, code: string | undefined, fallback: string): string {
  switch (code) {
    case 'validation_not_unique':
      return field === 'username' ? 'Username is already taken.' : 'Email is already registered.'
    case 'validation_length_out_of_range':
      return field === 'username' ? 'Must be 3–20 characters.' : 'Must be at least 8 characters.'
    case 'validation_required':
      return 'This field is required.'
    case 'validation_is_email':
      return 'Please enter a valid email address.'
    case 'validation_values_mismatch':
      return 'Passwords do not match.'
    default:
      return fallback
  }
}

function extractError(err: unknown): AuthError {
  if (err && typeof err === 'object') {
    const e = err as {
      data?: { message?: string; data?: Record<string, { code?: string; message: string }> }
      message?: string
    }
    const raw = e.data?.data ?? {}
    const fields: FieldErrors = {}
    for (const key of ['username', 'email', 'password', 'passwordConfirm'] as const) {
      const f = raw[key]
      if (f) fields[key] = fieldMessage(key, f.code, f.message)
    }
    const message = Object.keys(fields).length > 0
      ? null
      : e.data?.message ?? e.message ?? 'An unexpected error occurred'
    return { message, fields }
  }
  return { message: 'An unexpected error occurred', fields: {} }
}
