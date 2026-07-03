import { useEffect, useState } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Fetch JSON from the server API, tracking loading/error state and ignoring
 * responses that arrive after the URL has changed or the caller unmounted.
 */
export function useFetchJson<T>(
  url: string,
  notFoundMessage = 'Not found',
  failMessage = 'Request failed',
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? notFoundMessage : failMessage)
        return res.json() as Promise<T>
      })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: err instanceof Error ? err.message : failMessage })
      })

    return () => { cancelled = true }
  }, [url, notFoundMessage, failMessage])

  return state
}
