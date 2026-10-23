import { io } from 'socket.io-client'

const SERVER_URL = (window as any).__ENV__?.SERVER_URL ?? 'http://localhost:3001'
// withCredentials sends the auth cookie when the server is on another origin (local dev).
export const socket = io(SERVER_URL, { autoConnect: false, withCredentials: true })
