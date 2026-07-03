import PocketBase from 'pocketbase'
import { logger } from './logger.js'

export const pb = new PocketBase(process.env.PB_URL ?? 'http://localhost:8090')

// One client is shared across concurrent HTTP handlers; the SDK's auto-cancellation
// would abort identical in-flight requests started by another handler.
pb.autoCancellation(false)

let connected = false

// Superuser tokens expire (~14 days by default) and the SDK never refreshes them,
// so re-authenticate periodically. Also serves as a retry if PB was down at boot.
const REAUTH_INTERVAL_MS = 60 * 60 * 1000

async function authenticate(email: string, password: string): Promise<void> {
  // PocketBase v0.22+ uses _superusers for admin/superuser auth.
  await pb.collection('_superusers').authWithPassword(email, password)
}

export async function initPb(): Promise<void> {
  const email    = process.env.PB_ADMIN_EMAIL
  const password = process.env.PB_ADMIN_PASSWORD

  if (!email || !password) {
    logger.warn('PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD not set — stats recording disabled')
    return
  }

  try {
    await authenticate(email, password)
    connected = true
    logger.info({ url: process.env.PB_URL }, 'Connected to PocketBase')
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PocketBase — stats recording disabled')
  }

  setInterval(async () => {
    try {
      await authenticate(email, password)
      if (!connected) logger.info('Reconnected to PocketBase')
      connected = true
    } catch (err) {
      connected = false
      logger.error({ err }, 'PocketBase re-auth failed — stats recording disabled')
    }
  }, REAUTH_INTERVAL_MS).unref()
}

export function isPbReady(): boolean {
  return connected
}
