import { useFetchJson } from './useFetchJson'

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
  const encoded = encodeURIComponent(username)
  const userQuery = useFetchJson<UserRecord>(
    `/api/profile/${encoded}`,
    'User not found',
    'Failed to load profile',
  )
  const matchQuery = useFetchJson<{ items: MatchRow[]; totalPages: number }>(
    `/api/profile/${encoded}/matches?page=${page}`,
    'Failed to load matches',
    'Failed to load matches',
  )

  return {
    user: userQuery.data,
    matches: matchQuery.data?.items ?? [],
    totalPages: Math.max(1, matchQuery.data?.totalPages ?? 1),
    loading: userQuery.loading || matchQuery.loading,
    error: userQuery.error ?? matchQuery.error,
  }
}
