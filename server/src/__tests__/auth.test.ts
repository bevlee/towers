import { describe, it, expect } from 'vitest'
import { authCookies, parseSession } from '../auth.js'
import { usernameError } from '@towers/shared'

const future = new Date(Date.now() + 60_000).toISOString()

describe('authCookies', () => {
  it('forwards only Better Auth cookies', () => {
    expect(authCookies('theme=dark; __Secure-better-auth.session_token=abc; other=1; better-auth.x=y'))
      .toBe('__Secure-better-auth.session_token=abc; better-auth.x=y')
  })

  it('returns empty when no auth cookie is present', () => {
    expect(authCookies(undefined)).toBe('')
    expect(authCookies('theme=dark')).toBe('')
  })
})

describe('parseSession', () => {
  const user = { id: 'u1', name: 'Bev', email: 'bev@example.com' }

  it('returns the user for a live session', () => {
    expect(parseSession({ session: { userId: 'u1', expiresAt: future }, user }))
      .toEqual({ ...user, username: undefined })
  })

  it('treats a null body as signed out', () => {
    expect(parseSession(null)).toBeNull()
  })

  it('treats an expired session as signed out', () => {
    expect(parseSession({ session: { userId: 'u1', expiresAt: '2000-01-01T00:00:00Z' }, user })).toBeNull()
  })

  it('rejects a session that belongs to another user', () => {
    expect(() => parseSession({ session: { userId: 'u2', expiresAt: future }, user })).toThrow()
  })
})

describe('usernameError', () => {
  it('accepts letters, numbers, _ and -', () => {
    expect(usernameError('Bev_Lee-2')).toBeNull()
  })

  it('rejects names outside 3–20 characters', () => {
    expect(usernameError('ab')).not.toBeNull()
    expect(usernameError('a'.repeat(21))).not.toBeNull()
  })

  it('rejects spaces and symbols that would break profile URLs', () => {
    expect(usernameError('Bev Lee')).not.toBeNull()
    expect(usernameError('bev/../admin')).not.toBeNull()
  })
})
