import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { GAME_EVENTS, LOBBY_EVENTS, CARD_MAP } from '@towers/shared'
import type { GameState } from '@towers/shared'
import type { RoomManager, Room } from '../roomManager.js'
import type { TurnManager } from '../turnManager.js'
import { getClientState } from '../gameState.js'
import { handleTurnTimeout } from './lobbyHandlers.js'
import { logger } from '../logger.js'

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
    const playerId = socket.data.playerId as string
    const roomId = socket.data.roomId as string

    const room = roomManager.getRoom(roomId)
    if (!room?.gameState || room.gameState.phase !== 'playing') return

    const state = room.gameState

    // Validate it's this player's turn
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer.playerId !== playerId) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Not your turn' })
      return
    }

    // Reject play during draw-discard phase — player must respond with DRAW_DISCARD_CHOICE
    if (state.awaitingDrawDiscard) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Must respond to draw-discard request first' })
      return
    }

    // Find the card in hand by instance ID
    const cardInstance = currentPlayer.hand.find((c) => c.id === cardInstanceId)
    if (!cardInstance) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Card not in hand' })
      return
    }

    // Clear turn timer before processing
    turnManager.clearTurnTimer(roomId)

    try {
      // Player took an action — reset their consecutive timeout counter
      const resetState = turnManager.resetTimeouts(state)
      const result = turnManager.handlePlayCard(resetState, cardInstance.cardName)
      room.gameState = result.state

      // Record history entry and last played card
      room.gameState = {
        ...room.gameState,
        lastPlayedCard: { cardName: cardInstance.cardName, playedBy: currentPlayer.playerId },
        history: [
          ...room.gameState.history,
          {
            turn: room.gameState.turnNumber,
            playerId: currentPlayer.playerId,
            username: currentPlayer.username,
            action: 'play',
            cardName: cardInstance.cardName,
          },
        ],
      }

      // Check for win
      if (result.winResult) {
        turnManager.cleanup(roomId)
        emitGameOverToBoth(io, room, result.winResult.winner, result.winResult.reason)
        return
      }

      // If drawDiscard needed (Prism / Elven Scout): draw a card then ask player to discard
      if (result.needsDrawDiscard) {
        const playerIndex = room.gameState.currentPlayerIndex
        room.gameState = turnManager.drawForPlayer(room.gameState, playerIndex)
        room.gameState = { ...room.gameState, awaitingDrawDiscard: true, turnTimeRemaining: room.gameState.turnTimer }

        // Send the player their updated hand so they can choose which card to discard
        const player = room.gameState.players[playerIndex]
        socket.emit(GAME_EVENTS.DRAW_DISCARD_REQUEST, { hand: player.hand })

        // Start a timer so the player can't stall indefinitely during the discard choice
        turnManager.startTurn(roomId, room.gameState, () => {
          handleTurnTimeout(io, roomId, roomManager, turnManager)
        })
        return
      }

      // If playAgain, bump turnNumber so client timer resets, emit state
      if (result.playAgain) {
        room.gameState = {
          ...room.gameState,
          turnNumber: room.gameState.turnNumber + 1,
          turnTimeRemaining: room.gameState.turnTimer,
        }
        emitGameStateToBoth(io, room)
        turnManager.startTurn(roomId, room.gameState, () => {
          handleTurnTimeout(io, roomId, roomManager, turnManager)
        })
        return
      }

      // Normal turn end — generate resources for next player, emit state, start timer
      room.gameState = turnManager.generateResources(room.gameState)
      room.gameState = { ...room.gameState, turnTimeRemaining: room.gameState.turnTimer }

      emitGameStateToBoth(io, room)

      turnManager.startTurn(roomId, room.gameState, () => {
        handleTurnTimeout(io, roomId, roomManager, turnManager)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play card'
      logger.error({ roomId, playerId, cardInstanceId, err }, 'Error playing card')
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
    const playerId = socket.data.playerId as string
    const roomId = socket.data.roomId as string

    const room = roomManager.getRoom(roomId)
    if (!room?.gameState || room.gameState.phase !== 'playing') return

    const state = room.gameState
    const currentPlayer = state.players[state.currentPlayerIndex]

    if (currentPlayer.playerId !== playerId) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Not your turn' })
      return
    }

    // Reject discard during draw-discard phase — player must respond with DRAW_DISCARD_CHOICE
    if (state.awaitingDrawDiscard) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Use draw-discard choice to discard during draw-discard phase' })
      return
    }

    // Validate canDiscard (Lodestone check)
    const cardInstance = currentPlayer.hand.find((c) => c.id === cardInstanceId)
    if (!cardInstance) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Card not in hand' })
      return
    }
    const def = CARD_MAP[cardInstance.cardName]
    if (def?.canDiscard === false) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'This card cannot be discarded' })
      return
    }

    turnManager.clearTurnTimer(roomId)

    try {
      // Player took an action — reset their consecutive timeout counter
      const resetState = turnManager.resetTimeouts(state)
      const result = turnManager.handleDiscard(resetState, cardInstanceId)
      room.gameState = turnManager.generateResources(result.state)

      // Record history entry
      room.gameState = {
        ...room.gameState,
        lastPlayedCard: undefined,
        turnTimeRemaining: room.gameState.turnTimer,
        history: [
          ...room.gameState.history,
          {
            turn: room.gameState.turnNumber,
            playerId: currentPlayer.playerId,
            username: currentPlayer.username,
            action: 'discard',
            cardName: cardInstance.cardName,
          },
        ],
      }

      emitGameStateToBoth(io, room)

      turnManager.startTurn(roomId, room.gameState, () => {
        handleTurnTimeout(io, roomId, roomManager, turnManager)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to discard card'
      logger.error({ roomId, playerId, cardInstanceId, err }, 'Error discarding card')
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
    const playerId = socket.data.playerId as string
    const roomId = socket.data.roomId as string

    const room = roomManager.getRoom(roomId)
    if (!room?.gameState || room.gameState.phase !== 'playing') return

    const state = room.gameState
    const playerIndex = state.currentPlayerIndex
    const currentPlayer = state.players[playerIndex]

    if (currentPlayer.playerId !== playerId) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Not your turn' })
      return
    }

    // Cancel the draw-discard phase timer
    turnManager.clearTurnTimer(roomId)

    // Remove the chosen card from hand and add to discard pile
    const cardIdx = currentPlayer.hand.findIndex((c) => c.id === discardCardInstanceId)
    if (cardIdx === -1) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Card not in hand' })
      return
    }

    const discardedCard = currentPlayer.hand[cardIdx]

    // Validate canDiscard (Lodestone check)
    const def = CARD_MAP[discardedCard.cardName]
    if (def?.canDiscard === false) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'This card cannot be discarded' })
      return
    }

    // Player took an action — reset their consecutive timeout counter
    const resetState = turnManager.resetTimeouts(state)

    const updatedPlayer = { ...currentPlayer }
    updatedPlayer.hand = [...currentPlayer.hand]
    updatedPlayer.hand.splice(cardIdx, 1)

    const players: [typeof updatedPlayer, typeof updatedPlayer] = [...resetState.players]
    players[playerIndex] = updatedPlayer

    // Clear the draw-discard flag and draw a replacement card for the one originally played
    room.gameState = { ...resetState, players, discardPile: [...resetState.discardPile, discardedCard], awaitingDrawDiscard: false }
    room.gameState = turnManager.drawForPlayer(room.gameState, playerIndex)

    // Record history entry; bump turnNumber so client timer resets for the play-again turn
    room.gameState = {
      ...room.gameState,
      turnNumber: room.gameState.turnNumber + 1,
      turnTimeRemaining: room.gameState.turnTimer,
      history: [
        ...room.gameState.history,
        {
          turn: room.gameState.turnNumber,
          playerId: currentPlayer.playerId,
          username: currentPlayer.username,
          action: 'discard',
          cardName: discardedCard.cardName,
        },
      ],
    }

    // Always continue the current player's turn — all drawDiscard cards also grant playAgain
    emitGameStateToBoth(io, room)

    turnManager.startTurn(roomId, room.gameState, () => {
      handleTurnTimeout(io, roomId, roomManager, turnManager)
    })
  })
}

/** Emit personalised game state to both players in a room. */
function emitGameStateToBoth(
  io: Server,
  room: Room,
): void {
  if (!room.gameState) return
  if (room.player1) {
    io.to(room.player1.socketId).emit(GAME_EVENTS.GAME_STATE, {
      gameState: getClientState(room.gameState, room.player1.playerId),
    })
  }
  if (room.player2) {
    io.to(room.player2.socketId).emit(GAME_EVENTS.GAME_STATE, {
      gameState: getClientState(room.gameState, room.player2.playerId),
    })
  }
}

/** Emit game over to both players. */
function emitGameOverToBoth(
  io: Server,
  room: Room,
  winnerId: string,
  winReason: string,
): void {
  if (!room.gameState) return
  if (room.player1) {
    io.to(room.player1.socketId).emit(GAME_EVENTS.GAME_OVER, {
      winner: winnerId,
      winReason,
      finalState: getClientState(room.gameState, room.player1.playerId),
    })
  }
  if (room.player2) {
    io.to(room.player2.socketId).emit(GAME_EVENTS.GAME_OVER, {
      winner: winnerId,
      winReason,
      finalState: getClientState(room.gameState, room.player2.playerId),
    })
  }
}
