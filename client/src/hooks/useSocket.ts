import { useEffect, useState } from 'react'
import { socket } from '../socket'

/** Connect on mount, disconnect on unmount. Returns connection state. */
export function useSocket() {
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    socket.connect()

    function onConnect() {
      setConnected(true)
    }
    function onDisconnect() {
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.disconnect()
    }
  }, [])

  return { connected }
}
