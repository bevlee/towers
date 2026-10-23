const AUTH_URL = (window as any).__ENV__?.AUTH_URL ?? 'https://auth.bevsoft.com'

/** Hosted Better Auth page that returns the player to where they were after signing in. */
export function hostedAuthUrl(mode: 'login' | 'signup'): string {
  const url = new URL(`/${mode}`, AUTH_URL)
  url.searchParams.set('callbackURL', window.location.href)
  return url.href
}
