import type { Server } from 'socket.io'
import { GAME_EVENTS, CARD_MAP } from '@towers/shared'
import type { GameState } from '@towers/shared'
import type { Room, RoomManager } from '../roomManager.js'
import type { TurnManager } from '../turnManager.js'
import { emitGameOverToBoth, emitGameStateToBoth, emitToBothPlayers } from './emit.js'
import { checkWin } from '../winChecker.js'
import { maybeScheduleBotTurn } from '../bot/botRunner.js'
import { logger } from '../logger.js'

/**
 * Shared turn-lifecycle sequences. Every path that ends a game or hands play
 * to the next player — socket handlers, turn timeouts, bot moves — goes
 * through these helpers so the ordering (win check, timer reset, emits, bot
 * scheduling) stays canonical.
 */

/** Mark the game finished, stop its timers, and emit game over to both players. */
export function endGame(
  io: Server,
  room: Room,
  turnManager: TurnManager,
  winnerId: string,
  reason: NonNullable<GameState['winReason']>,
): void {
  room.gameState = { ...room.gameState!, phase: 'finished', winner: winnerId, winReason: reason }
  turnManager.cleanup(room.id)
  emitGameOverToBoth(io, room, winnerId, reason)
}

/** Reset the turn timer, emit the new state, and arm the next timeout (and bot move, if any). */
export function continueTurn(
  io: Server,
  room: Room,
  roomManager: RoomManager,
  turnManager: TurnManager,
  botDelayMs?: number,
): void {
  room.gameState = turnManager.resetTurnTimer(room.gameState!)
  emitGameStateToBoth(io, room)
  turnManager.startTurn(room.id, room.gameState, () => {
    handleTurnTimeout(io, room.id, roomManager, turnManager)
  })
  maybeScheduleBotTurn(io, room.id, roomManager, turnManager, botDelayMs)
}

/** Generate resources for the incoming player, then either end the game or continue. */
export function finishTurn(
  io: Server,
  room: Room,
  roomManager: RoomManager,
  turnManager: TurnManager,
): void {
  room.gameState = turnManager.generateResources(room.gameState!)

  const win = checkWin(room.gameState)
  if (win) {
    endGame(io, room, turnManager, win.winner, win.reason)
    return
  }

  continueTurn(io, room, roomManager, turnManager)
}

/** Handle turn timeout — auto-discard a random card. Forfeit after 3 consecutive timeouts. */
export function handleTurnTimeout(
  io: Server,
  roomId: string,
  roomManager: RoomManager,
  turnManager: TurnManager,
): void {
  const room = roomManager.getRoom(roomId)
  if (!room?.gameState || room.gameState.phase !== 'playing') return

  // Track consecutive timeouts — forfeit if 3 in a row
  const { state: stateWithTimeout, shouldForfeit } = turnManager.recordTimeout(room.gameState)
  room.gameState = stateWithTimeout

  if (shouldForfeit) {
    const loserIdx = room.gameState.currentPlayerIndex
    const winnerId = room.gameState.players[loserIdx === 0 ? 1 : 0].playerId
    endGame(io, room, turnManager, winnerId, 'afk')
    logger.info({ roomId, winnerId }, 'Game ended by AFK forfeit')
    return
  }

  const playerIndex = room.gameState.currentPlayerIndex
  const currentPlayer = room.gameState.players[playerIndex]
  if (currentPlayer.hand.length === 0) return

  // During draw-discard phase: auto-discard the most recently drawn card (last in hand)
  // and advance the turn, forfeiting the play-again opportunity.
  if (room.gameState.awaitingDrawDiscard) {
    const cardToDiscard = currentPlayer.hand[currentPlayer.hand.length - 1]
    const updatedPlayer = { ...currentPlayer, hand: currentPlayer.hand.slice(0, -1) }
    const players = [...room.gameState.players] as typeof room.gameState.players
    players[playerIndex] = updatedPlayer

    room.gameState = {
      ...room.gameState,
      players,
      discardPile: [...room.gameState.discardPile, cardToDiscard],
      awaitingDrawDiscard: false,
    }

    room.gameState = turnManager.addHistoryEntry(room.gameState, currentPlayer, 'timeout_discard', cardToDiscard.cardName)
    room.gameState = turnManager.switchTurn(room.gameState)

    emitToBothPlayers(io, room, GAME_EVENTS.TURN_TIMEOUT, {
      discardedCardInstanceId: cardToDiscard.id,
    })
    finishTurn(io, room, roomManager, turnManager)
    return
  }

  // Pick a random discardable card, or any card if none are discardable
  const discardableCards = currentPlayer.hand.filter((c) => {
    const def = CARD_MAP[c.cardName]
    return def?.canDiscard !== false
  })

  const pool = discardableCards.length > 0 ? discardableCards : currentPlayer.hand
  const randomCard = pool[Math.floor(Math.random() * pool.length)]

  try {
    const result = turnManager.handleDiscard(room.gameState, randomCard.id)
    room.gameState = turnManager.addHistoryEntry(result.state, currentPlayer, 'timeout_discard', randomCard.cardName)

    emitToBothPlayers(io, room, GAME_EVENTS.TURN_TIMEOUT, {
      discardedCardInstanceId: randomCard.id,
    })
    finishTurn(io, room, roomManager, turnManager)
  } catch (err) {
    logger.error({ roomId, err }, 'Error during turn timeout')
  }
}
