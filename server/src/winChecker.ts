import type { GameState } from '@towers/shared'
import { WIN_TOWER, WIN_RESOURCES } from '@towers/shared'

interface WinResult {
  winner: string
  reason: 'tower_destroyed' | 'tower_built' | 'resources'
}

/**
 * Check if a win condition has been met after a card is played.
 *
 * Priority:
 * 1. Tower destroyed (<= 0) -- opponent wins
 * 2. Tower built (>= WIN_TOWER) -- that player wins
 * 3. Resource victory (all three resources >= WIN_RESOURCES)
 *
 * If both players meet a win condition simultaneously, the current player wins.
 */
export function checkWin(state: GameState): WinResult | null {
  const [p0, p1] = state.players
  const currentIdx = state.currentPlayerIndex
  const current = state.players[currentIdx]
  const opponent = state.players[currentIdx === 0 ? 1 : 0]

  // 1. Tower destroyed
  const p0Destroyed = p0.tower <= 0
  const p1Destroyed = p1.tower <= 0

  if (p0Destroyed && p1Destroyed) {
    return { winner: current.playerId, reason: 'tower_destroyed' }
  }
  if (p0Destroyed) {
    return { winner: p1.playerId, reason: 'tower_destroyed' }
  }
  if (p1Destroyed) {
    return { winner: p0.playerId, reason: 'tower_destroyed' }
  }

  // 2. Tower built
  const p0Built = p0.tower >= WIN_TOWER
  const p1Built = p1.tower >= WIN_TOWER

  if (p0Built && p1Built) {
    return { winner: current.playerId, reason: 'tower_built' }
  }
  if (p0Built) {
    return { winner: p0.playerId, reason: 'tower_built' }
  }
  if (p1Built) {
    return { winner: p1.playerId, reason: 'tower_built' }
  }

  // 3. Resource victory
  const hasResourceWin = (p: typeof p0) =>
    p.ore >= WIN_RESOURCES && p.mana >= WIN_RESOURCES && p.troops >= WIN_RESOURCES

  const p0Resources = hasResourceWin(p0)
  const p1Resources = hasResourceWin(p1)

  if (p0Resources && p1Resources) {
    return { winner: current.playerId, reason: 'resources' }
  }
  if (p0Resources) {
    return { winner: p0.playerId, reason: 'resources' }
  }
  if (p1Resources) {
    return { winner: p1.playerId, reason: 'resources' }
  }

  return null
}
