import { useParams, Link } from 'react-router-dom'
import { useMatch } from '../hooks/useMatch'
import type { Play } from '../hooks/useMatch'
import { HoverCardName } from '../components/HoverCardName'

const ACTION_LABEL: Record<Play['action'], string> = {
  play:             'played',
  discard:          'discarded',
  timeout_discard: 'timeout-discarded',
}

const WIN_REASON_LABEL: Record<string, string> = {
  tower_destroyed: 'Tower destroyed',
  tower_built:     'Tower built',
  resources:       'Resources',
  timeout:         'Timeout',
  afk:             'AFK',
  forfeit:         'Forfeit',
}

export function MatchPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { match, plays, loading, error } = useMatch(id)

  return (
    <div className="min-h-screen bg-stone-900 px-4 py-6 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <Link to="/" className="text-amber-400 hover:text-amber-300">← Back</Link>
        </div>

        {loading && <p className="text-stone-400">Loading…</p>}
        {error && <p className="rounded border border-red-800/50 bg-red-950/30 p-3 text-red-400">{error}</p>}

        {match && (
          <>
            <div className="mb-6 rounded-lg border border-stone-700 bg-stone-800 p-4">
              <h1 className="text-2xl font-bold text-amber-400">
                <Link to={`/profile/${match.winner.username}`} className="hover:text-amber-300">
                  {match.winner.username}
                </Link>
                <span className="mx-2 text-stone-500">vs</span>
                <Link to={`/profile/${match.loser.username}`} className="hover:text-amber-300">
                  {match.loser.username}
                </Link>
              </h1>
              <p className="mt-2 text-sm text-stone-400">
                Winner: <span className="text-emerald-400">{match.winner.username}</span> ({WIN_REASON_LABEL[match.win_reason] ?? match.win_reason})
                {' • '}{match.turn_count} turns
                {' • '}{new Date(match.created).toLocaleString()}
              </p>
            </div>

            {plays.length === 0 ? (
              <p className="text-stone-400">No plays recorded for this match.</p>
            ) : (
              <TurnList plays={plays} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TurnList({ plays }: { plays: Play[] }) {
  const turns = groupByTurn(plays)

  return (
    <div className="flex flex-col gap-3">
      {turns.map(({ turnNumber, playerName, plays: turnPlays }) => (
        <div key={turnNumber} className="rounded-lg border border-stone-700 bg-stone-800 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-bold text-amber-300">Turn {turnNumber}</span>
            <Link
              to={`/profile/${playerName}`}
              className="text-sm text-stone-300 hover:text-amber-300"
            >
              {playerName}
            </Link>
          </div>
          <ul className="ml-4 flex flex-col gap-1">
            {turnPlays.map((p) => (
              <li key={p.id} className="text-sm text-stone-300">
                <span className="text-stone-500">•</span> {ACTION_LABEL[p.action]}{' '}
                <HoverCardName cardName={p.card_name} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

interface TurnGroup {
  turnNumber: number
  playerName: string
  plays: Play[]
}

function groupByTurn(plays: Play[]): TurnGroup[] {
  const groups = new Map<number, TurnGroup>()
  for (const p of plays) {
    let g = groups.get(p.turn_number)
    if (!g) {
      g = { turnNumber: p.turn_number, playerName: p.player.username, plays: [] }
      groups.set(p.turn_number, g)
    }
    g.plays.push(p)
  }
  return Array.from(groups.values()).sort((a, b) => a.turnNumber - b.turnNumber)
}
