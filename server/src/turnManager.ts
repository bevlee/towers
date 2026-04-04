import type { GameState } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
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
 * Manages turn flow, timers, and game-level time tracking for active rooms.
 */
export class TurnManager {
  private turnTimers: Map<string, NodeJS.Timeout> = new Map()
  private gameTimers: Map<string, NodeJS.Timeout> = new Map()
  private gameTimeRemaining: Map<string, number> = new Map()

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

  /**
   * Start the 10-minute game timer. Counts down gameTimeRemaining each second.
   * Calls onTimeout when the game clock reaches zero.
   */
  startGameTimer(roomId: string, initialSeconds: number, onTimeout: () => void): void {
    this.clearGameTimer(roomId)
    this.gameTimeRemaining.set(roomId, initialSeconds)

    const interval = setInterval(() => {
      const remaining = (this.gameTimeRemaining.get(roomId) ?? 0) - 1
      this.gameTimeRemaining.set(roomId, remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        this.gameTimers.delete(roomId)
        onTimeout()
      }
    }, 1000)

    this.gameTimers.set(roomId, interval)
  }

  /** Clear the game timer for a room. */
  clearGameTimer(roomId: string): void {
    const timer = this.gameTimers.get(roomId)
    if (timer) {
      clearInterval(timer)
      this.gameTimers.delete(roomId)
    }
  }

  /** Get the current game time remaining for a room. */
  getGameTimeRemaining(roomId: string): number {
    return this.gameTimeRemaining.get(roomId) ?? 0
  }

  /** Clear all timers for a room. */
  cleanup(roomId: string): void {
    this.clearTurnTimer(roomId)
    this.clearGameTimer(roomId)
    this.gameTimeRemaining.delete(roomId)
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

    // Remove from hand
    const newHand = [...player.hand]
    newHand.splice(cardIdx, 1)
    player.hand = newHand

    const players: [typeof player, typeof player] = [...state.players]
    players[idx] = player
    let newState: GameState = { ...state, players }

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
    }
  }

  /** Draw the top card from the deck and add it to the given player's hand. */
  drawForPlayer(state: GameState, playerIndex: 0 | 1): GameState {
    const { card, remainingDeck } = drawCard(state.deck)
    if (!card) {
      // Deck empty — no draw
      return state
    }

    const player = { ...state.players[playerIndex] }
    player.hand = [...player.hand, card]

    const players: [typeof player, typeof player] = [...state.players]
    players[playerIndex] = player

    return { ...state, players, deck: remainingDeck }
  }
}
