import type { GameState } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { canPlayCard } from '../cardEngine.js'
import { checkWin } from '../winChecker.js'
import { TurnManager } from '../turnManager.js'

export type BotAction =
  | { type: 'play'; cardName: string }
  | { type: 'discard'; cardName: string }

export interface ApplyResult {
  state: GameState
  /** True when the acting player keeps the turn (play-again / draw-discard). */
  samePlayer: boolean
  terminal: boolean
}

// TurnManager's state methods are pure; a single instance serves all simulations.
const tm = new TurnManager()

/**
 * Enumerate the legal actions for the given player, deduplicated by card name.
 */
export function legalActions(state: GameState, playerIndex: 0 | 1): BotAction[] {
  const player = state.players[playerIndex]
  const actions: BotAction[] = []
  const seen = new Set<string>()

  for (const card of player.hand) {
    if (seen.has(card.cardName)) continue
    seen.add(card.cardName)

    const def = CARD_MAP[card.cardName]
    if (!def) continue

    if (canPlayCard(player, def)) {
      actions.push({ type: 'play', cardName: card.cardName })
    }
    if (def.canDiscard !== false) {
      actions.push({ type: 'discard', cardName: card.cardName })
    }
  }

  return actions
}

/**
 * Pick the least valuable discardable card in hand — used to auto-resolve
 * draw-discard choices inside simulations. Prefers the cheapest card.
 */
export function chooseWorstCard(state: GameState, playerIndex: 0 | 1): string | null {
  const player = state.players[playerIndex]
  let worst: string | null = null
  let worstCost = Infinity

  for (const card of player.hand) {
    const def = CARD_MAP[card.cardName]
    if (!def || def.canDiscard === false) continue
    if (def.cost < worstCost) {
      worstCost = def.cost
      worst = card.cardName
    }
  }

  return worst
}

/** Remove one instance of the named card from a player's hand onto the discard pile. */
export function discardFromHand(state: GameState, playerIndex: 0 | 1, cardName: string): GameState {
  const player = state.players[playerIndex]
  const cardIdx = player.hand.findIndex((c) => c.cardName === cardName)
  if (cardIdx === -1) return state

  const discarded = player.hand[cardIdx]
  const newHand = [...player.hand]
  newHand.splice(cardIdx, 1)

  const players: [typeof player, typeof player] = [...state.players]
  players[playerIndex] = { ...player, hand: newHand }
  return { ...state, players, discardPile: [...state.discardPile, discarded] }
}

/** Finish a turn that passed to the other player: generate resources and re-check win. */
function finishTurnSwitch(state: GameState): ApplyResult {
  let newState = tm.generateResources(state)

  const winResult = checkWin(newState)
  if (winResult) {
    newState = { ...newState, phase: 'finished', winner: winResult.winner, winReason: winResult.reason }
    return { state: newState, samePlayer: false, terminal: true }
  }

  return { state: newState, samePlayer: false, terminal: false }
}

/**
 * Apply a bot action to a game state, advancing the turn exactly as the live
 * game does: cost + effects, win check, replacement draws, play-again,
 * inline draw-discard resolution, turn switch, and resource generation.
 */
export function applyAction(state: GameState, action: BotAction): ApplyResult {
  const playerIndex = state.currentPlayerIndex

  if (action.type === 'discard') {
    const player = state.players[playerIndex]
    const instance = player.hand.find((c) => c.cardName === action.cardName)
    if (!instance) throw new Error(`Card not in hand: ${action.cardName}`)
    const { state: discarded } = tm.handleDiscard(state, instance.id)
    return finishTurnSwitch(discarded)
  }

  const result = tm.handlePlayCard(state, action.cardName)
  let newState = result.state

  if (result.winResult) {
    return { state: newState, samePlayer: false, terminal: true }
  }

  if (result.needsDrawDiscard) {
    // Mirror the live flow: draw, discard a chosen card, draw the replacement.
    newState = tm.drawForPlayer(newState, playerIndex)
    const worst = chooseWorstCard(newState, playerIndex)
    if (worst) {
      newState = discardFromHand(newState, playerIndex, worst)
      newState = tm.drawForPlayer(newState, playerIndex)
    }
    // Both draw-discard cards grant play-again; the live handler keeps the turn.
    return { state: newState, samePlayer: true, terminal: false }
  }

  if (result.playAgain) {
    return { state: newState, samePlayer: true, terminal: false }
  }

  return finishTurnSwitch(newState)
}
