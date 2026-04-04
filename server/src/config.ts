/** Server configuration from environment variables. */
export const SERVER_PORT = Number(process.env.TOWERS_PORT) || 3001
export const CLIENT_ORIGIN = process.env.TOWERS_CLIENT_ORIGIN || 'http://localhost:5174'
