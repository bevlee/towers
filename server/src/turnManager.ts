import type { GameState } from '@towers/shared'
import { CARD_MAP, MAX_CONSECUTIVE_TIMEOUTS } from '@towers/shared'
import { playCard } from './cardEngine.js'
import { drawCard } from './deckManager.js'
import { checkWin } from './winChecker.js'

interface WinResult {
  winner: string
  reason: 'tower_destroyed' | 'tower_built' | 'resources'
}

interface PlayCardResult {
  state: GameState
  playAgain: boolean
  needsDrawDiscard: boolean
  winResult: WinResult | null
}

interface DiscardResult {
  state: GameState
}

/**
 * Manages turn flow and timers for active rooms.
 */
export class TurnManager {
  private turnTimers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Start a turn timer for the given room. Calls onTimeout when time expires.
   */
  startTurn(roomId: string, state: GameState, onTimeout: () => void): void {
    this.clearTurnTimer(roomId)

    const timer = setTimeout(() => {
      onTimeout()
    }, state.turnTimer * 1000)

    this.turnTimers.set(roomId, timer)
  }

  /** Clear the turn timer for a room without triggering the callback. */
  clearTurnTimer(roomId: string): void {
    const timer = this.turnTimers.get(roomId)
    if (timer) {
      clearTimeout(timer)
      this.turnTimers.delete(roomId)
    }
  }

  /** Clear all timers for a room. */
  cleanup(roomId: string): void {
    this.clearTurnTimer(roomId)
  }

  /**
   * Increment consecutive timeout counter for the current player.
   * Returns the updated state and whether the player should forfeit.
   */
  recordTimeout(state: GameState): { state: GameState; shouldForfeit: boolean } {
    const idx = state.currentPlayerIndex
    const consecutiveTimeouts: [number, number] = [...state.consecutiveTimeouts]
    consecutiveTimeouts[idx] += 1

    const shouldForfeit = consecutiveTimeouts[idx] >= MAX_CONSECUTIVE_TIMEOUTS
    return {
      state: { ...state, consecutiveTimeouts },
      shouldForfeit,
    }
  }

  /** Reset consecutive timeout counter for the current player (they took an action). */
  resetTimeouts(state: GameState): GameState {
    const idx = state.currentPlayerIndex
    if (state.consecutiveTimeouts[idx] === 0) return state
    const consecutiveTimeouts: [number, number] = [...state.consecutiveTimeouts]
    consecutiveTimeouts[idx] = 0
    return { ...state, consecutiveTimeouts }
  }

  /**
   * Generate resources for the current player based on their source levels.
   * ore += mineLevel, mana += monasteryLevel, troops += barracksLevel.
   */
  generateResources(state: GameState): GameState {
    const idx = state.currentPlayerIndex
    const player = { ...state.players[idx] }

    player.ore += player.mineLevel
    player.mana += player.monasteryLevel
    player.troops += player.barracksLevel

    const players: [typeof player, typeof player] = [...state.players]
    players[idx] = player
    return { ...state, players }
  }

  /**
   * Handle a player playing a card.
   *
   * 1. Execute the card via cardEngine.playCard()
   * 2. Check win via winChecker.checkWin()
   * 3. If no win and no playAgain, draw a card and switch turns
   * 4. If playAgain, keep the same player's turn
   */
  handlePlayCard(state: GameState, cardName: string): PlayCardResult {
    const playerIndex = state.currentPlayerIndex

    // Execute the card
    const result = playCard(state, playerIndex, cardName)
    let newState = result.state

    // Check for a win
    const winResult = checkWin(newState)
    if (winResult) {
      newState = {
        ...newState,
        phase: 'finished',
        winner: winResult.winner,
        winReason: winResult.reason,
      }
      return {
        state: newState,
        playAgain: false,
        needsDrawDiscard: result.needsDrawDiscard,
        winResult,
      }
    }

    // If needsDrawDiscard, pause here — the handler will draw a card
    // and ask the player which card to discard before continuing
    if (result.needsDrawDiscard) {
      return {
        state: { ...newState, playAgainActive: result.playAgain },
        playAgain: result.playAgain,
        needsDrawDiscard: true,
        winResult: null,
      }
    }

    if (result.playAgain) {
      // Play again: draw a replacement card, but don't switch turns or generate resources
      newState = this.drawForPlayer(newState, playerIndex)
      return {
        state: { ...newState, playAgainActive: true },
        playAgain: true,
        needsDrawDiscard: false,
        winResult: null,
      }
    }

    // Normal turn end: draw a card and switch turns
    newState = this.drawForPlayer(newState, playerIndex)
    newState = this.switchTurn(newState)
    newState = { ...newState, playAgainActive: false }

    return {
      state: newState,
      playAgain: false,
      needsDrawDiscard: false,
      winResult: null,
    }
  }

  /**
   * Handle a player discarding a card.
   * Removes the card from hand, draws a replacement, and switches turns.
   */
  handleDiscard(state: GameState, cardInstanceId: string): DiscardResult {
    const idx = state.currentPlayerIndex
    const player = { ...state.players[idx] }

    // Validate card is in hand
    const cardIdx = player.hand.findIndex((c) => c.id === cardInstanceId)
    if (cardIdx === -1) {
      throw new Error(`Card not in hand: ${cardInstanceId}`)
    }

    // Check canDiscard (Lodestone)
    const card = player.hand[cardIdx]
    const def = CARD_MAP[card.cardName]
    if (def && def.canDiscard === false) {
      throw new Error(`Card cannot be discarded: ${card.cardName}`)
    }

    // Remove from hand and add to discard pile
    const discardedCard = player.hand[cardIdx]
    const newHand = [...player.hand]
    newHand.splice(cardIdx, 1)
    player.hand = newHand

    const players: [typeof player, typeof player] = [...state.players]
    players[idx] = player
    let newState: GameState = { ...state, players, discardPile: [...state.discardPile, discardedCard] }

    // Draw replacement
    newState = this.drawForPlayer(newState, idx)

    // Switch turns
    newState = this.switchTurn(newState)
    newState = { ...newState, playAgainActive: false }

    return { state: newState }
  }

  /** Toggle currentPlayerIndex between 0 and 1. */
  switchTurn(state: GameState): GameState {
    return {
      ...state,
      currentPlayerIndex: state.currentPlayerIndex === 0 ? 1 : 0,
      turnNumber: state.turnNumber + 1,
    }
  }

  /** Draw the top card from the deck and add it to the given player's hand. */
  drawForPlayer(state: GameState, playerIndex: 0 | 1): GameState {
    const { card, remainingDeck, remainingDiscardPile } = drawCard(state.deck, state.discardPile)
    if (!card) {
      // Both deck and discard pile empty — no draw
      return state
    }

    const player = { ...state.players[playerIndex] }
    player.hand = [...player.hand, card]

    const players: [typeof player, typeof player] = [...state.players]
    players[playerIndex] = player

    return { ...state, players, deck: remainingDeck, discardPile: remainingDiscardPile }
  }
}
