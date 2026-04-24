import PocketBase from 'pocketbase'

const PB_URL = (window as any).__ENV__?.PB_URL ?? 'http://localhost:8090'
export const pb = new PocketBase(PB_URL)
