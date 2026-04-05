import { useEffect, useState } from 'react'

/**
 * Client-side countdown that syncs with server values.
 * Decrements every second. Resyncs when serverValue or resetKey changes.
 * Use resetKey to force a resync even when the value stays the same (e.g. turn changes).
 */
export function useCountdown(serverValue: number, resetKey?: unknown): number {
  const [value, setValue] = useState(serverValue)

  // Resync when the server sends a new value or the reset key changes
  useEffect(() => {
    setValue(serverValue)
  }, [serverValue, resetKey])

  // Tick down every second
  useEffect(() => {
    if (value <= 0) return

    const timer = setInterval(() => {
      setValue((v) => Math.max(0, v - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [value > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  return value
}
