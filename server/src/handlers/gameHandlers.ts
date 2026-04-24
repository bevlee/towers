import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { GAME_EVENTS, LOBBY_EVENTS, CARD_MAP } from '@towers/shared'
import type { GameState, PlayerState, CardInstance } from '@towers/shared'
import type { RoomManager, Room } from '../roomManager.js'
import type { TurnManager } from '../turnManager.js'
import { handleTurnTimeout } from './lobbyHandlers.js'
import { logger } from '../logger.js'
import { emitGameOverToBoth, emitGameStateToBoth } from './emit.js'
import { recordGameResult } from '../statsRecorder.js'

const PlayCardSchema = z.object({
  cardInstanceId: z.string().min(1),
})

const DiscardCardSchema = z.object({
  cardInstanceId: z.string().min(1),
})

const DrawDiscardChoiceSchema = z.object({
  discardCardInstanceId: z.string().min(1),
})

/**
 * Resolve the active room and current player for a card action, emitting an error
 * and returning null if any precondition fails (no room, wrong phase, wrong turn,
 * or the card is not in the player's hand).
 */
function resolveCardAction(
  socket: Socket,
  roomManager: RoomManager,
  cardInstanceId: string,
): { room: Room; state: GameState; currentPlayer: PlayerState; cardInstance: CardInstance } | null {
  const playerId = socket.data.playerId as string
  const roomId = socket.data.roomId as string

  const room = roomManager.getRoom(roomId)
  if (!room?.gameState || room.gameState.phase !== 'playing') return null

  const state = room.gameState
  const currentPlayer = state.players[state.currentPlayerIndex]
  if (currentPlayer.playerId !== playerId) {
    socket.emit(LOBBY_EVENTS.ERROR, { message: 'Not your turn' })
    return null
  }

  const cardInstance = currentPlayer.hand.find((c) => c.id === cardInstanceId)
  if (!cardInstance) {
    socket.emit(LOBBY_EVENTS.ERROR, { message: 'Card not in hand' })
    return null
  }

  return { room, state, currentPlayer, cardInstance }
}

/**
 * Register game-related Socket.IO event handlers on the given socket.
 */
export function registerGameHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
  turnManager: TurnManager,
): void {
  socket.on(GAME_EVENTS.PLAY_CARD, (payload: unknown) => {
    const parsed = PlayCardSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Invalid playCard payload' })
      return
    }

    const { cardInstanceId } = parsed.data
    const ctx = resolveCardAction(socket, roomManager, cardInstanceId)
    if (!ctx) return
    const { room, state, currentPlayer, cardInstance } = ctx
    const roomId = room.id

    if (state.awaitingDrawDiscard) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Must respond to draw-discard request first' })
      return
    }

    turnManager.clearTurnTimer(roomId)

    try {
      const resetState = turnManager.resetTimeouts(state)
      const result = turnManager.handlePlayCard(resetState, cardInstance.cardName)
      room.gameState = {
        ...result.state,
        lastPlayedCard: { cardName: cardInstance.cardName, playedBy: currentPlayer.playerId },
      }
      room.gameState = turnManager.addHistoryEntry(room.gameState, currentPlayer, 'play', cardInstance.cardName)

      if (result.winResult) {
        turnManager.cleanup(roomId)
        emitGameOverToBoth(io, room, result.winResult.winner, result.winResult.reason)
        const pbIds: Record<string, string> = {}
        if (room.player1?.pbUserId) pbIds[room.player1.playerId] = room.player1.pbUserId
        if (room.player2?.pbUserId) pbIds[room.player2.playerId] = room.player2.pbUserId
        recordGameResult(room.gameState!, pbIds)
        return
      }

      if (result.needsDrawDiscard) {
        const playerIndex = room.gameState.currentPlayerIndex
        room.gameState = turnManager.drawForPlayer(room.gameState, playerIndex)
        room.gameState = turnManager.resetTurnTimer({ ...room.gameState, awaitingDrawDiscard: true })

        const player = room.gameState.players[playerIndex]
        socket.emit(GAME_EVENTS.DRAW_DISCARD_REQUEST, { hand: player.hand })

        turnManager.startTurn(roomId, room.gameState, () => {
          handleTurnTimeout(io, roomId, roomManager, turnManager)
        })
        return
      }

      if (result.playAgain) {
        room.gameState = turnManager.resetTurnTimer(room.gameState)
        emitGameStateToBoth(io, room)
        turnManager.startTurn(roomId, room.gameState, () => {
          handleTurnTimeout(io, roomId, roomManager, turnManager)
        })
        return
      }

      room.gameState = turnManager.generateResources(room.gameState)
      room.gameState = turnManager.resetTurnTimer(room.gameState)
      emitGameStateToBoth(io, room)
      turnManager.startTurn(roomId, room.gameState, () => {
        handleTurnTimeout(io, roomId, roomManager, turnManager)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play card'
      logger.error({ roomId, playerId: currentPlayer.playerId, cardInstanceId, err }, 'Error playing card')
      socket.emit(LOBBY_EVENTS.ERROR, { message })
    }
  })

  socket.on(GAME_EVENTS.DISCARD_CARD, (payload: unknown) => {
    const parsed = DiscardCardSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Invalid discardCard payload' })
      return
    }

    const { cardInstanceId } = parsed.data
    const ctx = resolveCardAction(socket, roomManager, cardInstanceId)
    if (!ctx) return
    const { room, state, currentPlayer, cardInstance } = ctx
    const roomId = room.id

    if (state.awaitingDrawDiscard) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Use draw-discard choice to discard during draw-discard phase' })
      return
    }

    const def = CARD_MAP[cardInstance.cardName]
    if (def?.canDiscard === false) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'This card cannot be discarded' })
      return
    }

    turnManager.clearTurnTimer(roomId)

    try {
      const resetState = turnManager.resetTimeouts(state)
      const result = turnManager.handleDiscard(resetState, cardInstanceId)
      room.gameState = turnManager.generateResources(result.state)
      room.gameState = turnManager.resetTurnTimer({ ...room.gameState, lastPlayedCard: undefined })
      room.gameState = turnManager.addHistoryEntry(room.gameState, currentPlayer, 'discard', cardInstance.cardName)

      emitGameStateToBoth(io, room)

      turnManager.startTurn(roomId, room.gameState, () => {
        handleTurnTimeout(io, roomId, roomManager, turnManager)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to discard card'
      logger.error({ roomId, playerId: currentPlayer.playerId, cardInstanceId, err }, 'Error discarding card')
      socket.emit(LOBBY_EVENTS.ERROR, { message })
    }
  })

  socket.on(GAME_EVENTS.DRAW_DISCARD_CHOICE, (payload: unknown) => {
    const parsed = DrawDiscardChoiceSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Invalid drawDiscardChoice payload' })
      return
    }

    const { discardCardInstanceId } = parsed.data
    const ctx = resolveCardAction(socket, roomManager, discardCardInstanceId)
    if (!ctx) return
    const { room, state, currentPlayer, cardInstance: discardedCard } = ctx
    const roomId = room.id
    const playerIndex = state.currentPlayerIndex

    const def = CARD_MAP[discardedCard.cardName]
    if (def?.canDiscard === false) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'This card cannot be discarded' })
      return
    }

    turnManager.clearTurnTimer(roomId)

    const resetState = turnManager.resetTimeouts(state)

    const cardIdx = currentPlayer.hand.findIndex((c) => c.id === discardCardInstanceId)
    const updatedPlayer = { ...currentPlayer, hand: [...currentPlayer.hand] }
    updatedPlayer.hand.splice(cardIdx, 1)

    const players: [typeof updatedPlayer, typeof updatedPlayer] = [...resetState.players]
    players[playerIndex] = updatedPlayer

    room.gameState = { ...resetState, players, discardPile: [...resetState.discardPile, discardedCard], awaitingDrawDiscard: false }
    room.gameState = turnManager.drawForPlayer(room.gameState, playerIndex)
    room.gameState = turnManager.resetTurnTimer(room.gameState)
    room.gameState = turnManager.addHistoryEntry(room.gameState, currentPlayer, 'discard', discardedCard.cardName)

    emitGameStateToBoth(io, room)

    turnManager.startTurn(roomId, room.gameState, () => {
      handleTurnTimeout(io, roomId, roomManager, turnManager)
    })
  })
}
