import type { GameState } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { pb, isPbReady } from './pb.js'
import { logger } from './logger.js'

/** Map of in-game playerId → PocketBase user record ID. */
export type PbUserIds = Record<string, string>

/**
 * Fire-and-forget: record the finished game's result, update player win/loss
 * counters, and write every card play and discard from the game history.
 * Silently skips if PocketBase is not connected or a player is unauthenticated.
 */
export function recordGameResult(state: GameState, pbUserIds: PbUserIds): void {
  if (!isPbReady()) return
  if (state.phase !== 'finished' || !state.winner || !state.winReason) return

  const winner = state.players.find((p) => p.playerId === state.winner)
  const loser  = state.players.find((p) => p.playerId !== state.winner)
  if (!winner || !loser) return

  const winnerId = pbUserIds[winner.playerId]
  const loserId  = pbUserIds[loser.playerId]
  if (!winnerId || !loserId) return // one or both players not authenticated with PB

  void _persist(state, winnerId, loserId, pbUserIds)
}

const WIN_TYPE_FIELD: Record<string, string> = {
  tower_built:     'win_tower_built',
  tower_destroyed: 'win_tower_destroyed',
  resources:       'win_resources',
}

async function _persist(
  state: GameState,
  winnerId: string,
  loserId: string,
  pbUserIds: PbUserIds,
): Promise<void> {
  try {
    // 1. Create game record
    const game = await pb.collection('game_results').create({
      winner:     winnerId,
      loser:      loserId,
      win_reason: state.winReason,
      turn_count: state.turnNumber,
    })

    // 2. Bump win/loss counters with PocketBase's atomic "+" field modifiers —
    // no read-modify-write, so concurrent game finishes can't drop an increment.
    const winPatch: Record<string, number> = { 'wins+': 1 }
    const typeField = state.winReason ? WIN_TYPE_FIELD[state.winReason] : undefined
    if (typeField) {
      winPatch[`${typeField}+`] = 1
    }

    await Promise.all([
      pb.collection('users').update(winnerId, winPatch),
      pb.collection('users').update(loserId, { 'losses+': 1 }),
    ])

    // 3. Record every card play, discard, and timeout_discard from history.
    // sequence = position within (turn_number, player) — used to render plays in order.
    const seqCounters: Record<string, number> = {}
    await Promise.all(
      state.history
        .filter((entry) => pbUserIds[entry.playerId])
        .map((entry) => {
          const key = `${entry.turn}:${entry.playerId}`
          const sequence = seqCounters[key] ?? 0
          seqCounters[key] = sequence + 1
          return pb.collection('card_plays').create({
            game:        game.id,
            player:      pbUserIds[entry.playerId],
            card_name:   entry.cardName,
            card_color:  CARD_MAP[entry.cardName]?.color ?? 'red',
            action:      entry.action,
            turn_number: entry.turn,
            sequence,
          })
        }),
    )

    logger.info({ gameId: game.id, winReason: state.winReason }, 'Game stats recorded')
  } catch (err) {
    logger.error({ err }, 'Failed to record game stats')
  }
}
