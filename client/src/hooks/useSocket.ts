import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket'

/**
 * Manages the Socket.IO connection lifecycle.
 * The socket connects only once a PocketBase auth token is available so the
 * server middleware can verify the player's identity on handshake.
 * Disconnects automatically when the token is cleared (logout).
 */
export function useSocket(token?: string | null) {
  const [connected, setConnected] = useState(socket.connected)
  const hasConnected = useRef(false)

  // Register connect/disconnect listeners once for the lifetime of the app.
  useEffect(() => {
    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false) }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  // Connect when the token first becomes available; disconnect on logout.
  useEffect(() => {
    if (token && !hasConnected.current) {
      socket.auth = { pbToken: token }
      socket.connect()
      hasConnected.current = true
    }
    if (!token && hasConnected.current) {
      socket.disconnect()
      hasConnected.current = false
    }
  }, [token])

  return { connected }
}
