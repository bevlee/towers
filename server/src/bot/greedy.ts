import type { GameState } from '@towers/shared'
import { evaluateState } from './evaluate.js'
import { applyAction, chooseWorstCard, legalActions } from './simulate.js'
import type { ApplyResult, BotAction } from './simulate.js'

/** Small bonus for keeping the turn — an extra action is worth tempo. */
const PLAY_AGAIN_BONUS = 5
/** Discarding gives up a card and the turn; prefer playing when close. */
const DISCARD_PENALTY = 3

/**
 * The greedy policy's score for taking `action` with the given outcome, from
 * the mover's perspective. Shared with the hard bot's opponent model so both
 * agree on what a greedy player would do.
 */
export function scoreActionResult(action: BotAction, result: ApplyResult, mover: 0 | 1): number {
  let score = evaluateState(result.state, mover)
  if (result.samePlayer && !result.terminal) score += PLAY_AGAIN_BONUS
  if (action.type === 'discard') score -= DISCARD_PENALTY
  return score
}

/**
 * Easy bot: simulate every legal action one ply deep with the real engine and
 * pick the one whose resulting state evaluates best. Returns null only when
 * no action is legal (unaffordable, undiscardable hand).
 */
export function chooseGreedyAction(state: GameState, playerIndex: 0 | 1): BotAction | null {
  const actions = legalActions(state, playerIndex)
  if (actions.length === 0) return null

  // Of the discard options, only the least valuable card is worth considering.
  const worstCard = chooseWorstCard(state, playerIndex)
  const candidates = actions.filter(
    (a) => a.type === 'play' || a.cardName === worstCard,
  )

  let best: BotAction | null = null
  let bestScore = -Infinity

  for (const action of candidates) {
    const result = applyAction(state, action)
    const score = scoreActionResult(action, result, playerIndex)

    if (score > bestScore) {
      bestScore = score
      best = action
    }
  }

  return best
}
