import type { GameState } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { applyAction, legalActions } from './simulate.js'
import type { BotAction } from './simulate.js'
import { chooseGreedyAction } from './greedy.js'

/**
 * Depth-first search for a guaranteed win this turn using only cards already
 * in hand: either a single winning play, or a chain of play-again cards
 * ending in one. Runs on a drawless copy of the state so the chain can never
 * lean on unknown replacement draws, and skips draw-discard cards (Prism,
 * Elven Scout) whose outcome depends on the draw. Everything the search sees
 * — own hand, own resources, opponent tower/wall — is public and exact, so a
 * found win is provable, not sampled.
 */
function findForcedWin(state: GameState, botIndex: 0 | 1): BotAction | null {
  const drawless: GameState = { ...state, deck: [], discardPile: [] }
  return searchChain(drawless, botIndex)
}

/**
 * Remove the replacement card the bot drew after playing, restoring a
 * hand-only view. With the deck emptied, draws reshuffle the discard pile —
 * i.e. hand back the card just played — so without this the chain search
 * could replay the same play-again card forever.
 */
function stripReplacementDraw(state: GameState, botIndex: 0 | 1, handSizeBefore: number): GameState {
  const player = state.players[botIndex]
  if (player.hand.length < handSizeBefore) return state // nothing was drawn

  const players: [typeof player, typeof player] = [...state.players]
  players[botIndex] = { ...player, hand: player.hand.slice(0, -1) }
  return { ...state, players, deck: [], discardPile: [] }
}

function searchChain(state: GameState, botIndex: 0 | 1): BotAction | null {
  const handSizeBefore = state.players[botIndex].hand.length

  for (const action of legalActions(state, botIndex)) {
    if (action.type !== 'play') continue

    const def = CARD_MAP[action.cardName]
    if (def?.effects.some((e) => e.type === 'drawDiscard')) continue

    const result = applyAction(state, action)

    if (result.terminal && result.state.winner === state.players[botIndex].playerId) {
      return action
    }

    // Only a play-again keeps the turn alive for a deeper chain.
    if (!result.terminal && result.samePlayer) {
      const next = stripReplacementDraw(result.state, botIndex, handSizeBefore)
      if (searchChain(next, botIndex)) return action
    }
  }

  return null
}

/**
 * Hard bot: the greedy policy, plus forced wins it can prove.
 *
 * The only deviation from the easy bot is taking a same-turn winning line
 * (possibly a multi-card play-again chain) that greedy's one-action horizon
 * misses. That deviation is provably correct, so the hard bot is never worse.
 *
 * Broader lookahead was implemented and measured extensively before landing
 * here — MCTS (two variants), paranoid alpha-beta, and turn-depth search over
 * sampled opponent hands with several override-gating policies. Every variant
 * played at or below parity against plain greedy in head-to-head matches:
 * with hidden hands and decks, "certain across sampled worlds" still misfires
 * at exactly the critical moments, and those misfires cost more than the
 * foresight gains. See docs/plans/2026-07-03-bot-opponents-design.md.
 */
export async function chooseHardAction(
  state: GameState,
  botIndex: 0 | 1,
): Promise<BotAction | null> {
  const forcedWin = findForcedWin(state, botIndex)
  if (forcedWin) return forcedWin

  return chooseGreedyAction(state, botIndex)
}
