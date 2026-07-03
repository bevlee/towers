import type { GameState, PlayerState } from '@towers/shared'
import { WIN_RESOURCES, WIN_TOWER } from '@towers/shared'
import { checkWin } from '../winChecker.js'

/** Score assigned to a terminal (won/lost) state. */
export const WIN_SCORE = 10000

const TOWER_WEIGHT = 3
const WALL_WEIGHT = 1
const LEVEL_WEIGHT = 8
const RESOURCE_WEIGHT = 0.4
/** Reward balanced accumulation toward the resource victory. */
const MIN_RESOURCE_WEIGHT = 1

/** Heuristic value of one player's position, ignoring the opponent. */
function scorePlayer(p: PlayerState): number {
  let score =
    TOWER_WEIGHT * p.tower +
    WALL_WEIGHT * p.wall +
    LEVEL_WEIGHT * (p.mineLevel + p.monasteryLevel + p.barracksLevel) +
    RESOURCE_WEIGHT * (p.ore + p.mana + p.troops) +
    MIN_RESOURCE_WEIGHT * Math.min(p.ore, p.mana, p.troops, WIN_RESOURCES)

  // A tower close to the build-win threshold is worth extra tempo.
  if (p.tower > WIN_TOWER - 10) score += 2 * (p.tower - (WIN_TOWER - 10))
  // A nearly destroyed tower is in danger beyond its raw height.
  if (p.tower < 10) score -= 2 * (10 - p.tower)

  return score
}

/**
 * Evaluate a game state from the given player's perspective.
 * Positive = good for that player. Terminal states score ±WIN_SCORE.
 */
export function evaluateState(state: GameState, playerIndex: 0 | 1): number {
  const winResult = checkWin(state)
  if (winResult) {
    return winResult.winner === state.players[playerIndex].playerId ? WIN_SCORE : -WIN_SCORE
  }

  const self = state.players[playerIndex]
  const enemy = state.players[playerIndex === 0 ? 1 : 0]
  return scorePlayer(self) - scorePlayer(enemy)
}
