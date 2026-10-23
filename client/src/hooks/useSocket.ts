import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket'

/**
 * Manages the Socket.IO connection lifecycle.
 * The socket connects only once the player is signed in so the server
 * middleware can verify their identity from the auth cookie on handshake.
 * Disconnects automatically on logout.
 */
export function useSocket(signedIn: boolean) {
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

  // Connect on sign-in; disconnect on logout.
  useEffect(() => {
    if (signedIn && !hasConnected.current) {
      socket.connect()
      hasConnected.current = true
    }
    if (!signedIn && hasConnected.current) {
      socket.disconnect()
      hasConnected.current = false
    }
  }, [signedIn])

  return { connected }
}
