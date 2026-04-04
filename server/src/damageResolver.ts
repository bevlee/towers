import type { PlayerState } from '@towers/shared'

/**
 * Apply damage to a player. Regular damage hits wall first; overflow hits tower.
 * Direct damage bypasses wall entirely. Both wall and tower are clamped to 0.
 */
export function applyDamage(
  player: PlayerState,
  amount: number,
  direct: boolean,
): PlayerState {
  const result = { ...player }

  if (direct) {
    result.tower = Math.max(0, result.tower - amount)
    return result
  }

  // Regular damage: wall absorbs first
  const wallAbsorb = Math.min(result.wall, amount)
  result.wall = result.wall - wallAbsorb
  const overflow = amount - wallAbsorb
  result.tower = Math.max(0, result.tower - overflow)

  return result
}

/**
 * Apply self-damage to a player. Same rules as regular (non-direct) damage.
 */
export function applySelfDamage(
  player: PlayerState,
  amount: number,
): PlayerState {
  return applyDamage(player, amount, false)
}
