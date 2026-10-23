import type { GameState } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import type { PoolClient } from 'pg'
import { pool } from './db.js'
import { logger } from './logger.js'

/** Map of in-game playerId → auth user ID. */
export type UserIds = Record<string, string>

/**
 * Fire-and-forget: record the finished game's result, update player win/loss
 * counters, and write every card play and discard from the game history.
 * Silently skips if the database is not configured or a player is unauthenticated.
 */
export function recordGameResult(state: GameState, userIds: UserIds): void {
  if (!pool) return
  if (state.phase !== 'finished' || !state.winner || !state.winReason) return

  const winner = state.players.find((p) => p.playerId === state.winner)
  const loser  = state.players.find((p) => p.playerId !== state.winner)
  if (!winner || !loser) return

  const winnerId = userIds[winner.playerId]
  const loserId  = userIds[loser.playerId]
  if (!winnerId || !loserId) return // one or both players not signed in

  void persist(state, winnerId, loserId, userIds)
}

// Column names are fixed here, never taken from input, so interpolating them is safe.
const WIN_TYPE_COLUMN: Record<string, string> = {
  tower_built:     'win_tower_built',
  tower_destroyed: 'win_tower_destroyed',
  resources:       'win_resources',
  // AFK (3 consecutive timeouts) is a forfeit for stats purposes
  forfeit:         'win_forfeit',
  afk:             'win_forfeit',
}

async function persist(
  state: GameState,
  winnerId: string,
  loserId: string,
  userIds: UserIds,
): Promise<void> {
  let client: PoolClient | undefined
  try {
    client = await pool!.connect()
    await client.query('BEGIN')

    // Lock both players in a fixed order first, so two games between the same
    // players finishing at once (A beats B while B beats A) can't deadlock.
    await client.query('SELECT 1 FROM players WHERE id = ANY($1) ORDER BY id FOR UPDATE', [[winnerId, loserId]])

    const { rows: [game] } = await client.query<{ id: string }>(
      `INSERT INTO game_results (winner, loser, win_reason, turn_count)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [winnerId, loserId, state.winReason, state.turnNumber],
    )

    const typeColumn = state.winReason ? WIN_TYPE_COLUMN[state.winReason] : undefined
    await client.query(
      `UPDATE players SET wins = wins + 1${typeColumn ? `, ${typeColumn} = ${typeColumn} + 1` : ''} WHERE id = $1`,
      [winnerId],
    )
    await client.query('UPDATE players SET losses = losses + 1 WHERE id = $1', [loserId])

    // sequence = position within (turn_number, player) — used to render plays in order.
    const seqCounters: Record<string, number> = {}
    const plays = state.history
      .filter((entry) => userIds[entry.playerId])
      .map((entry) => {
        const key = `${entry.turn}:${entry.playerId}`
        const sequence = seqCounters[key] ?? 0
        seqCounters[key] = sequence + 1
        return [
          userIds[entry.playerId],
          entry.cardName,
          CARD_MAP[entry.cardName]?.color ?? 'red',
          entry.action,
          entry.turn,
          sequence,
        ]
      })
    if (plays.length > 0) {
      await client.query(
        `INSERT INTO card_plays (game, player, card_name, card_color, action, turn_number, sequence)
         SELECT $1, * FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::int[], $7::int[])`,
        [game.id, ...plays[0].map((_, col) => plays.map((row) => row[col]))],
      )
    }

    await client.query('COMMIT')
    logger.info({ gameId: game.id, winReason: state.winReason }, 'Game stats recorded')
  } catch (err) {
    await client?.query('ROLLBACK').catch(() => {})
    logger.error({ err }, 'Failed to record game stats')
  } finally {
    client?.release()
  }
}
