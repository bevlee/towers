import { useEffect, useState } from 'react'

/**
 * Client-side countdown. Starts from serverValue and ticks down every second.
 * Resets (restarts from serverValue) whenever timerKey or serverValue changes.
 */
export function useCountdown(serverValue: number, timerKey: number): number {
  const [value, setValue] = useState(serverValue)

  useEffect(() => {
    setValue(serverValue)

    if (serverValue <= 0) return

    const interval = setInterval(() => {
      setValue((v) => Math.max(0, v - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [timerKey, serverValue])

  return value
}
