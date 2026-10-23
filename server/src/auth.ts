import { AUTH_URL, AUTH_COOKIE_PREFIX } from './config.js'

/** A Better Auth user, as confirmed by the shared auth service. */
export interface AuthUser {
  id: string
  name: string
  email: string
  /** Present only when the auth service runs Better Auth's username plugin. */
  username?: string
}

const TIMEOUT_MS = 5000

function authEndpoint(action: string): URL {
  const base = new URL(AUTH_URL)
  const path = base.pathname.replace(/\/+$/, '') || '/api/auth'
  return new URL(`${path}/${action}`, base.origin)
}

/** Keep only Better Auth's own cookies so nothing else leaks to the auth service. */
export function authCookies(cookieHeader: string | undefined, prefix = AUTH_COOKIE_PREFIX): string {
  return (cookieHeader ?? '')
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => {
      const name = pair.split('=')[0]
      return name.startsWith(`${prefix}.`)
        || name.startsWith(`__Secure-${prefix}.`)
        || name.startsWith(`__Host-${prefix}.`)
    })
    .join('; ')
}

/** Parse a `get-session` response body. Never trust identity fields the browser sent. */
export function parseSession(body: unknown, now = Date.now()): AuthUser | null {
  if (body === null) return null
  const { session, user } = (body ?? {}) as { session?: any; user?: any }
  const expiresAt = Date.parse(session?.expiresAt)
  if (
    typeof user?.id !== 'string' || !user.id
    || session?.userId !== user.id
    || !Number.isFinite(expiresAt)
  ) {
    throw new Error('Invalid auth session response')
  }
  if (expiresAt <= now) return null
  return {
    id: user.id,
    name: typeof user.name === 'string' ? user.name : '',
    email: typeof user.email === 'string' ? user.email : '',
    username: typeof user.username === 'string' && user.username ? user.username : undefined,
  }
}

export interface Session {
  user: AuthUser | null
  /** Refreshed session cookies to pass back to the browser, so active players stay signed in. */
  setCookies: string[]
}

/** Resolve the signed-in user from a request's Cookie header. */
export async function getSession(cookieHeader: string | undefined): Promise<Session> {
  const cookie = authCookies(cookieHeader)
  if (!cookie) return { user: null, setCookies: [] }
  const url = authEndpoint('get-session')
  url.searchParams.set('disableCookieCache', 'true')
  const res = await fetch(url, {
    headers: { cookie, accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Auth service returned ${res.status}`)
  return { user: parseSession(await res.json()), setCookies: res.headers.getSetCookie() }
}

export async function sessionUser(cookieHeader: string | undefined): Promise<AuthUser | null> {
  return (await getSession(cookieHeader)).user
}

/**
 * Sign out through the server so the browser never makes a cross-origin call
 * to the auth service. Returns the Set-Cookie headers that clear the session.
 */
export async function signOut(cookieHeader: string | undefined): Promise<string[]> {
  const cookie = authCookies(cookieHeader)
  if (!cookie) return []
  const target = authEndpoint('sign-out')
  const res = await fetch(target, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json', origin: target.origin },
    body: '{}',
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Auth service returned ${res.status}`)
  return res.headers.getSetCookie()
}
