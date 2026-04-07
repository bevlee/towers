import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { LOBBY_EVENTS, GAME_EVENTS, CARD_MAP } from '@towers/shared'
import type { GameState } from '@towers/shared'
import type { RoomManager } from '../roomManager.js'
import type { TurnManager } from '../turnManager.js'
import { createGame, getClientState } from '../gameState.js'
import { logger } from '../logger.js'

const CreateRoomSchema = z.object({
  turnTimer: z.number().int().min(15).max(30),
  username: z.string().min(1).max(30),
})

const JoinRoomSchema = z.object({
  roomId: z.string().uuid(),
  username: z.string().min(1).max(30),
})

const LeaveRoomSchema = z.object({
  roomId: z.string().uuid(),
})

/**
 * Register lobby-related Socket.IO event handlers on the given socket.
 */
export function registerLobbyHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
  turnManager: TurnManager,
): void {
  socket.on(LOBBY_EVENTS.LIST_ROOMS, () => {
    socket.emit(LOBBY_EVENTS.ROOM_LIST, { rooms: roomManager.listOpenRooms() })
  })

  socket.on(LOBBY_EVENTS.CREATE_ROOM, (payload: unknown) => {
    const parsed = CreateRoomSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Invalid createRoom payload' })
      return
    }

    const { turnTimer, username } = parsed.data
    const playerId = socket.data.playerId as string

    const room = roomManager.createRoom(`${username}'s game`, turnTimer, {
      playerId,
      username,
      socketId: socket.id,
    })

    socket.join(room.id)
    socket.data.roomId = room.id

    logger.info({ roomId: room.id, playerId }, 'Room created')

    socket.emit(LOBBY_EVENTS.ROOM_CREATED, {
      room: {
        id: room.id,
        name: room.name,
        player1: { playerId, username },
        player2: null,
        turnTimer: room.turnTimer,
      },
    })

    // Broadcast updated room list to everyone
    io.emit(LOBBY_EVENTS.ROOM_LIST, { rooms: roomManager.listOpenRooms() })
  })

  socket.on(LOBBY_EVENTS.JOIN_ROOM, (payload: unknown) => {
    const parsed = JoinRoomSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Invalid joinRoom payload' })
      return
    }

    const { roomId, username } = parsed.data
    const playerId = socket.data.playerId as string

    let room
    try {
      room = roomManager.joinRoom(roomId, {
        playerId,
        username,
        socketId: socket.id,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room'
      socket.emit(LOBBY_EVENTS.ERROR, { message })
      return
    }

    socket.join(roomId)
    socket.data.roomId = roomId

    logger.info({ roomId, playerId }, 'Player joined room')

    // Always notify the joining player so the client tracks currentRoom
    socket.emit(LOBBY_EVENTS.ROOM_JOINED, {
      room: {
        id: room.id,
        name: room.name,
        player1: room.player1 ? { playerId: room.player1.playerId, username: room.player1.username } : null,
        player2: room.player2 ? { playerId: room.player2.playerId, username: room.player2.username } : null,
        turnTimer: room.turnTimer,
      },
    })

    // Both players are now in the room — start the game
    if (room.player1 && room.player2) {
      const gameState = createGame(
        room.player1.playerId,
        room.player1.username,
        room.player2.playerId,
        room.player2.username,
        room.turnTimer,
      )
      room.gameState = gameState

      // Generate resources for first player's first turn
      room.gameState = turnManager.generateResources(room.gameState)

      // Emit game state to each player (personalised view)
      const p1Socket = room.player1.socketId
      const p2Socket = room.player2.socketId

      io.to(p1Socket).emit(GAME_EVENTS.GAME_START, {
        gameState: getClientState(room.gameState, room.player1.playerId),
      })
      io.to(p2Socket).emit(GAME_EVENTS.GAME_START, {
        gameState: getClientState(room.gameState, room.player2.playerId),
      })

      // Start first turn timer
      turnManager.startTurn(room.id, room.gameState, () => {
        handleTurnTimeout(io, room.id, roomManager, turnManager)
      })

      logger.info({ roomId: room.id }, 'Game started')
    }

    // Broadcast updated room list
    io.emit(LOBBY_EVENTS.ROOM_LIST, { rooms: roomManager.listOpenRooms() })
  })

  socket.on(LOBBY_EVENTS.LEAVE_ROOM, (payload: unknown) => {
    const parsed = LeaveRoomSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(LOBBY_EVENTS.ERROR, { message: 'Invalid leaveRoom payload' })
      return
    }

    const { roomId } = parsed.data
    const playerId = socket.data.playerId as string

    handlePlayerLeave(io, socket, roomId, playerId, roomManager, turnManager)
  })

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId as string | undefined
    const playerId = socket.data.playerId as string | undefined
    if (!roomId || !playerId) return

    const room = roomManager.getRoom(roomId)
    if (!room) return

    // If a game is in progress, give a 5-second grace period for reconnection
    if (room.gameState && room.gameState.phase === 'playing') {
      logger.info({ roomId, playerId }, 'Player disconnected during game, starting grace period')

      const opponentSocketId = getOpponentSocketId(room, playerId)
      if (opponentSocketId) {
        io.to(opponentSocketId).emit(GAME_EVENTS.OPPONENT_DISCONNECTED, {
          message: 'Opponent disconnected. Waiting 5 seconds for reconnection...',
        })
      }

      setTimeout(() => {
        // Check if the player reconnected (socket ID would be updated)
        const currentRoom = roomManager.getRoom(roomId)
        if (!currentRoom) return

        const playerStillGone =
          (currentRoom.player1?.playerId === playerId && currentRoom.player1?.socketId === socket.id) ||
          (currentRoom.player2?.playerId === playerId && currentRoom.player2?.socketId === socket.id)

        if (playerStillGone) {
          // Player did not reconnect — forfeit
          handlePlayerLeave(io, socket, roomId, playerId, roomManager, turnManager)
        }
      }, 5000)
    } else {
      handlePlayerLeave(io, socket, roomId, playerId, roomManager, turnManager)
    }
  })
}

/** Handle a player leaving a room (voluntary or disconnect). */
function handlePlayerLeave(
  io: Server,
  socket: Socket,
  roomId: string,
  playerId: string,
  roomManager: RoomManager,
  turnManager: TurnManager,
): void {
  const room = roomManager.getRoom(roomId)
  if (!room) return

  // If game in progress, the other player wins by forfeit
  if (room.gameState && room.gameState.phase === 'playing') {
    const opponentSocketId = getOpponentSocketId(room, playerId)
    const opponentId = getOpponentPlayerId(room, playerId)

    if (opponentSocketId && opponentId && room.gameState) {
      room.gameState = {
        ...room.gameState,
        phase: 'finished',
        winner: opponentId,
        winReason: 'forfeit',
      }

      io.to(opponentSocketId).emit(GAME_EVENTS.GAME_OVER, {
        winner: opponentId,
        winReason: 'forfeit',
        finalState: getClientState(room.gameState, opponentId),
      })
    }

    turnManager.cleanup(roomId)
  }

  socket.leave(roomId)
  socket.data.roomId = undefined
  roomManager.leaveRoom(roomId, playerId)

  logger.info({ roomId, playerId }, 'Player left room')

  io.emit(LOBBY_EVENTS.ROOM_LIST, { rooms: roomManager.listOpenRooms() })
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

    room.gameState = {
      ...room.gameState,
      phase: 'finished',
      winner: winnerId,
      winReason: 'afk',
    }

    turnManager.cleanup(roomId)
    emitGameOverToBoth(io, room, winnerId, 'afk')
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
      playAgainActive: false,
    }

    room.gameState = {
      ...room.gameState,
      history: [
        ...room.gameState.history,
        {
          turn: room.gameState.turnNumber,
          playerId: currentPlayer.playerId,
          username: currentPlayer.username,
          action: 'timeout_discard' as const,
          cardName: cardToDiscard.cardName,
        },
      ],
    }

    room.gameState = turnManager.switchTurn(room.gameState)
    room.gameState = turnManager.generateResources(room.gameState)
    room.gameState = { ...room.gameState, turnTimeRemaining: room.gameState.turnTimer }

    emitToBothPlayers(io, room, GAME_EVENTS.TURN_TIMEOUT, {
      discardedCardInstanceId: cardToDiscard.id,
    })
    emitGameStateToBoth(io, room)

    turnManager.startTurn(roomId, room.gameState, () => {
      handleTurnTimeout(io, roomId, roomManager, turnManager)
    })
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
    room.gameState = turnManager.generateResources(result.state)

    // Record timeout discard in history
    room.gameState = {
      ...room.gameState,
      turnTimeRemaining: room.gameState.turnTimer,
      history: [
        ...room.gameState.history,
        {
          turn: room.gameState.turnNumber,
          playerId: currentPlayer.playerId,
          username: currentPlayer.username,
          action: 'timeout_discard' as const,
          cardName: randomCard.cardName,
        },
      ],
    }

    // Emit timeout notification
    emitToBothPlayers(io, room, GAME_EVENTS.TURN_TIMEOUT, {
      discardedCardInstanceId: randomCard.id,
    })

    // Emit updated state
    emitGameStateToBoth(io, room)

    // Start next turn timer
    turnManager.startTurn(roomId, room.gameState, () => {
      handleTurnTimeout(io, roomId, roomManager, turnManager)
    })
  } catch (err) {
    logger.error({ roomId, err }, 'Error during turn timeout')
  }
}

/** Get the opponent's socket ID. */
function getOpponentSocketId(room: { player1: { playerId: string; socketId: string } | null; player2: { playerId: string; socketId: string } | null }, playerId: string): string | undefined {
  if (room.player1?.playerId === playerId) return room.player2?.socketId
  if (room.player2?.playerId === playerId) return room.player1?.socketId
  return undefined
}

/** Get the opponent's player ID. */
function getOpponentPlayerId(room: { player1: { playerId: string } | null; player2: { playerId: string } | null }, playerId: string): string | undefined {
  if (room.player1?.playerId === playerId) return room.player2?.playerId
  if (room.player2?.playerId === playerId) return room.player1?.playerId
  return undefined
}

/** Emit an event to both players in a room. */
function emitToBothPlayers(io: Server, room: { player1: { socketId: string } | null; player2: { socketId: string } | null }, event: string, payload: unknown): void {
  if (room.player1) io.to(room.player1.socketId).emit(event, payload)
  if (room.player2) io.to(room.player2.socketId).emit(event, payload)
}

/** Emit personalised game state to both players. */
function emitGameStateToBoth(io: Server, room: { player1: { playerId: string; socketId: string } | null; player2: { playerId: string; socketId: string } | null; gameState: GameState | null }): void {
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
function emitGameOverToBoth(io: Server, room: { player1: { playerId: string; socketId: string } | null; player2: { playerId: string; socketId: string } | null; gameState: GameState | null }, winnerId: string, winReason: string): void {
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
