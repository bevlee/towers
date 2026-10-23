/** Server configuration from environment variables. */
export const SERVER_PORT = Number(process.env.TOWERS_PORT) || 3001
export const CLIENT_ORIGIN = process.env.TOWERS_CLIENT_ORIGIN || 'http://localhost:5174'
/** Shared Better Auth service. A bare origin uses Better Auth's default `/api/auth` path. */
export const AUTH_URL = process.env.AUTH_URL || 'https://auth.bevsoft.com'
export const AUTH_COOKIE_PREFIX = process.env.AUTH_COOKIE_PREFIX || 'better-auth'
/** Postgres connection string. When unset, stats, profiles and sign-in are disabled. */
export const DATABASE_URL = process.env.DATABASE_URL
