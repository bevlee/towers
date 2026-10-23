/** Player names appear in profile URLs, so keep them short and URL-safe. */
export const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,20}$/

/** Why a player name is invalid, or null when it's fine. */
export function usernameError(name: string): string | null {
  if (name.length < 3 || name.length > 20) return 'Names must be 3–20 characters.'
  if (!USERNAME_PATTERN.test(name)) return 'Use only letters, numbers, _ and -.'
  return null
}
