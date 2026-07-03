import { useFetchJson } from './useFetchJson'

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
  const { data, loading, error } = useFetchJson<Match & { plays: Play[] }>(
    `/api/match/${encodeURIComponent(matchId)}`,
    'Match not found',
    'Failed to load match',
  )
  return { match: data, plays: data?.plays ?? [], loading, error }
}
