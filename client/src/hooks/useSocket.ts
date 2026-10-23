import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket'

const CONNECT_RETRY_MS = 3000

/**
 * Manages the Socket.IO connection lifecycle.
 * The socket connects only once the player has a name, so the server
 * middleware can verify it on handshake: from the auth cookie for accounts,
 * or from `guestName` for guests. Disconnects automatically on logout.
 */
export function useSocket(playing: boolean, guestName: string | null) {
  const [connected, setConnected] = useState(socket.connected)
  const hasConnected = useRef(false)

  // Register connect/disconnect listeners once for the lifetime of the app.
  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined
    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false) }
    // A server refusal (sign-in temporarily unavailable) doesn't auto-reconnect.
    function onConnectError() {
      if (!socket.active) retry = setTimeout(() => socket.connect(), CONNECT_RETRY_MS)
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    return () => {
      clearTimeout(retry)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
    }
  }, [])

  // Connect on sign-in; disconnect on logout.
  useEffect(() => {
    if (playing && !hasConnected.current) {
      socket.auth = guestName ? { guestName } : {}
      socket.connect()
      hasConnected.current = true
    }
    if (!playing && hasConnected.current) {
      socket.disconnect()
      hasConnected.current = false
    }
  }, [playing, guestName])

  return { connected }
}
