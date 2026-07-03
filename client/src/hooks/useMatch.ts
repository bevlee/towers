import { useEffect, useState } from 'react'

const SERVER_URL = ''

interface ExpandedUser {
  id: string
  username: string
}

export interface Match {
  id: string
  created: string
  winner: ExpandedUser
  loser: ExpandedUser
  win_reason: string
  turn_count: number
}

export interface Play {
  id: string
  player: ExpandedUser
  card_name: string
  card_color: string
  action: 'play' | 'discard' | 'timeout_discard'
  turn_number: number
  sequence: number
}

interface MatchData {
  match: Match | null
  plays: Play[]
  loading: boolean
  error: string | null
}

export function useMatch(matchId: string): MatchData {
  const [match, setMatch] = useState<Match | null>(null)
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${SERVER_URL}/api/match/${encodeURIComponent(matchId)}`)
        if (!res.ok) throw new Error(res.status === 404 ? 'Match not found' : 'Failed to load match')
        const data = await res.json()
        if (cancelled) return
        const { plays: rawPlays, ...matchData } = data
        setMatch(matchData)
        setPlays(rawPlays)
      } catch (err: any) {
        if (cancelled) return
        setError(err?.message ?? 'Failed to load match')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [matchId])

  return { match, plays, loading, error }
}
