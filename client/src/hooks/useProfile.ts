import { useEffect, useState } from 'react'

const SERVER_URL = ''

interface UserRecord {
  id: string
  username: string
  wins: number
  losses: number
  win_tower_built: number
  win_tower_destroyed: number
  win_resources: number
}

interface ExpandedUser {
  id: string
  username: string
}

export interface MatchRow {
  id: string
  created: string
  winner: ExpandedUser
  loser: ExpandedUser
  win_reason: string
  turn_count: number
}

interface ProfileData {
  user: UserRecord | null
  matches: MatchRow[]
  totalPages: number
  loading: boolean
  error: string | null
}

export function useProfile(username: string, page: number): ProfileData {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [userRes, matchRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/profile/${encodeURIComponent(username)}`),
          fetch(`${SERVER_URL}/api/profile/${encodeURIComponent(username)}/matches?page=${page}`),
        ])

        if (!userRes.ok) throw new Error(userRes.status === 404 ? 'User not found' : 'Failed to load profile')
        if (!matchRes.ok) throw new Error('Failed to load matches')

        const u = await userRes.json()
        const m = await matchRes.json()

        if (cancelled) return
        setUser(u)
        setMatches(m.items)
        setTotalPages(Math.max(1, m.totalPages))
      } catch (err: any) {
        if (cancelled) return
        setError(err?.message ?? 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [username, page])

  return { user, matches, totalPages, loading, error }
}
