import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import type { MatchRow } from '../hooks/useProfile'

interface ProfilePageProps {
  selfUsername: string | null
}

const WIN_REASON_LABEL: Record<string, string> = {
  tower_destroyed: 'Tower destroyed',
  tower_built:     'Tower built',
  resources:       'Resources',
  timeout:         'Timeout',
  afk:             'AFK',
  forfeit:         'Forfeit',
}

export function ProfilePage({ selfUsername }: ProfilePageProps) {
  const { username = '' } = useParams<{ username: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const { user, matches, totalPages, loading, error } = useProfile(username, page)

  function goToPage(p: number) {
    setSearchParams({ page: String(p) })
  }

  return (
    <div className="min-h-screen bg-stone-900 px-4 py-6 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="text-amber-400 hover:text-amber-300">← Back to lobby</Link>
          {selfUsername && selfUsername !== username && (
            <Link to={`/profile/${selfUsername}`} className="text-sm text-stone-400 hover:text-stone-200">
              View my profile
            </Link>
          )}
        </div>

        {loading && <p className="text-stone-400">Loading…</p>}
        {error && <p className="rounded border border-red-800/50 bg-red-950/30 p-3 text-red-400">{error}</p>}

        {user && (
          <>
            <h1 className="mb-4 text-3xl font-bold text-amber-400">
              {user.username}
              {selfUsername === user.username && <span className="ml-2 text-sm text-stone-400">(you)</span>}
            </h1>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <StatTile label="Wins"   value={user.wins   ?? 0} />
              <StatTile label="Losses" value={user.losses ?? 0} />
              <StatTile label="Win %"  value={winRate(user.wins, user.losses)} />
            </div>

            <div className="mb-8 rounded-lg border border-stone-700 bg-stone-800 p-4">
              <h2 className="mb-3 text-sm uppercase tracking-wide text-stone-400">Wins by type</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Breakdown label="Tower destroyed" value={user.win_tower_destroyed ?? 0} />
                <Breakdown label="Tower built"     value={user.win_tower_built     ?? 0} />
                <Breakdown label="Resources"       value={user.win_resources       ?? 0} />
              </div>
            </div>

            <h2 className="mb-3 text-lg font-bold text-amber-400">
              Match history {totalPages > 1 && <span className="text-sm font-normal text-stone-400">(page {page} of {totalPages})</span>}
            </h2>

            {matches.length === 0 ? (
              <p className="text-stone-400">No matches yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} viewerId={user.id} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-stone-700 bg-stone-800 p-4 text-center">
      <div className="text-xs uppercase tracking-wide text-stone-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-amber-200">{value}</div>
    </div>
  )
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-stone-400">{label}</div>
      <div className="mt-1 text-xl font-bold text-amber-200">{value}</div>
    </div>
  )
}

function MatchCard({ match, viewerId }: { match: MatchRow; viewerId: string }) {
  const isWin = match.winner.id === viewerId
  const opponent = isWin ? match.loser : match.winner
  const reasonLabel = WIN_REASON_LABEL[match.win_reason] ?? match.win_reason

  return (
    <Link
      to={`/match/${match.id}`}
      className="flex items-center justify-between rounded-lg border border-stone-700 bg-stone-800 px-4 py-3 transition-colors hover:border-amber-600"
    >
      <div className="flex items-center gap-3">
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${isWin ? 'bg-emerald-700 text-emerald-100' : 'bg-red-900 text-red-100'}`}>
          {isWin ? 'WIN' : 'LOSS'}
        </span>
        <div>
          <div className="text-sm">
            vs <Link
              to={`/profile/${opponent.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-amber-300 hover:text-amber-200"
            >
              {opponent.username}
            </Link>
          </div>
          <div className="text-xs text-stone-400">
            {reasonLabel} • {match.turn_count} turns • {formatDate(match.created)}
          </div>
        </div>
      </div>
      <span className="text-stone-500">→</span>
    </Link>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded border border-stone-600 px-3 py-1 text-sm hover:border-amber-500 disabled:opacity-30"
      >
        ← Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded px-3 py-1 text-sm ${
            p === page
              ? 'bg-amber-600 text-white'
              : 'border border-stone-600 hover:border-amber-500'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded border border-stone-600 px-3 py-1 text-sm hover:border-amber-500 disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  )
}

function winRate(wins: number, losses: number): string {
  const total = (wins ?? 0) + (losses ?? 0)
  if (total === 0) return '—'
  return `${Math.round((wins / total) * 100)}%`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
