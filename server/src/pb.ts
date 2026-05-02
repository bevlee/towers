import PocketBase from 'pocketbase'
import { logger } from './logger.js'

export const pb = new PocketBase(process.env.PB_URL ?? 'http://localhost:8090')

let connected = false

export async function initPb(): Promise<void> {
  const email    = process.env.PB_ADMIN_EMAIL
  const password = process.env.PB_ADMIN_PASSWORD

  if (!email || !password) {
    logger.warn('PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD not set — stats recording disabled')
    return
  }

  try {
    // PocketBase v0.22+ uses _superusers for admin/superuser auth.
    await pb.collection('_superusers').authWithPassword(email, password)
    connected = true
    logger.info({ url: process.env.PB_URL }, 'Connected to PocketBase')
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PocketBase — stats recording disabled')
  }
}

export function isPbReady(): boolean {
  return connected
}
