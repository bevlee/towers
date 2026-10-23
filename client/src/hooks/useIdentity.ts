import { useState, useEffect, useCallback } from 'react'

/** Who is at the keyboard. Only `account` players have their games recorded. */
export type Identity =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'needsName' }
  | { status: 'account'; username: string }
  | { status: 'guest'; username: string }

interface IdentityState {
  identity: Identity
  error: string | null
  /** Each resolves to an error message, or null on success. */
  chooseName: (username: string) => Promise<string | null>
  playAsGuest: (username: string) => Promise<string | null>
  /** Resolves false, with `error` set, when the session couldn't be ended. */
  logout: () => Promise<boolean>
}

const GUEST_NAME_KEY = 'towers.guestName'

// Storage can be unavailable (private windows, blocked site data); guests then just re-enter a name.
function readGuestName(): string | null {
  try { return localStorage.getItem(GUEST_NAME_KEY) } catch { return null }
}
function writeGuestName(name: string | null): void {
  try {
    if (name) localStorage.setItem(GUEST_NAME_KEY, name)
    else localStorage.removeItem(GUEST_NAME_KEY)
  } catch { /* not persisted */ }
}

async function postName(url: string, username: string): Promise<{ username: string } | string> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    const body = await res.json().catch(() => null)
    return res.ok ? body : body?.message ?? 'Something went wrong. Please try again.'
  } catch {
    return 'Could not reach the server. Please try again.'
  }
}

export function useIdentity(): IdentityState {
  const [identity, setIdentity] = useState<Identity>({ status: 'loading' })
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function resolve(): Promise<Identity> {
      const res = await fetch('/api/me', { credentials: 'include' })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Sign-in is unavailable')
      const me: { id: string; username: string | null } | null = await res.json()
      if (me) return me.username ? { status: 'account', username: me.username } : { status: 'needsName' }

      // Re-check a remembered guest name: a registered player may have claimed it since.
      const guestName = readGuestName()
      if (guestName) {
        const result = await postName('/api/guest', guestName)
        if (typeof result !== 'string') return { status: 'guest', username: result.username }
        writeGuestName(null)
      }
      return { status: 'signedOut' }
    }
    resolve()
      .then(setIdentity)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Sign-in is unavailable')
        setIdentity({ status: 'signedOut' })
      })
  }, [])

  const chooseName = useCallback(async (username: string) => {
    const result = await postName('/api/me/username', username)
    if (typeof result === 'string') return result
    setIdentity({ status: 'account', username: result.username })
    return null
  }, [])

  const playAsGuest = useCallback(async (username: string) => {
    const result = await postName('/api/guest', username)
    if (typeof result === 'string') return result
    writeGuestName(result.username)
    setError(null)
    setIdentity({ status: 'guest', username: result.username })
    return null
  }, [])

  const logout = useCallback(async () => {
    if (identity.status === 'guest') {
      writeGuestName(null)
      setIdentity({ status: 'signedOut' })
      return true
    }
    const res = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' }).catch(() => null)
    if (!res?.ok) {
      setError('Sign-out failed. Please try again.')
      return false
    }
    setError(null)
    setIdentity({ status: 'signedOut' })
    return true
  }, [identity.status])

  return { identity, error, chooseName, playAsGuest, logout }
}
