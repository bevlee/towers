import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { LOBBY_EVENTS, GAME_EVENTS } from '@towers/shared'
import type { Room, RoomManager } from '../roomManager.js'
import type { GameConfig } from '@towers/shared'
import type { TurnManager } from '../turnManager.js'
import { createGame, defaultGameConfig, getClientState } from '../gameState.js'
import { logger } from '../logger.js'
import { endGame, handleTurnTimeout } from './turnFlow.js'
import { createBotSlot, isBotId, maybeScheduleBotTurn } from '../bot/botRunner.js'

const GameConfigSchema = z.object({
  seed: z.string().max(64).default(''),
  ore: z.number().int().min(0).max(999),
  mana: z.number().int().min(0).max(999),
  troops: z.number().int().min(0).max(999),
  mineLevel: z.number().int().min(1).max(10),
  monasteryLevel: z.number().int().min(1).max(10),
  barracksLevel: z.number().int().min(1).max(10),
  tower: z.number().int().min(1).max(200),
  wall: z.number().int().min(0).max(200),
})

const CreateRoomSchema = z.object({
  turnTimer: z.number().int().min(15).max(30),
  username: z.string().min(1).max(20),
  gameConfig: GameConfigSchema.optional(),
  bot: z.enum(['easy', 'hard']).optional(),
})

const JoinRoomSchema = z.object({
  roomId: z.string().uuid(),
  username: z.string().min(1).max(20),
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

    const { turnTimer, username, gameConfig: rawConfig, bot } = parsed.data
    const playerId = socket.data.playerId as string
    const gameConfig: GameConfig = rawConfig ?? defaultGameConfig()

    const room = roomManager.createRoom(`${username}'s game`, turnTimer, {
      playerId,
      username,
      socketId: socket.id,
      pbUserId: socket.data.pbUserId as string | undefined,
    }, gameConfig)

    socket.join(room.id)
    socket.data.roomId = room.id

    logger.info({ roomId: room.id, playerId }, 'Room created')

    // A bot game starts immediately — seat the bot as player2
    if (bot) {
      room.player2 = createBotSlot(bot)
      room.botDifficulty = bot
    }

    socket.emit(LOBBY_EVENTS.ROOM_CREATED, {
      room: {
        id: room.id,
        name: room.name,
        player1: { playerId, username },
        player2: room.player2 ? { playerId: room.player2.playerId, username: room.player2.username } : null,
        turnTimer: room.turnTimer,
        gameConfig: room.gameConfig,
      },
    })

    if (bot) {
      startGame(io, room, roomManager, turnManager)
    }

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
        pbUserId: socket.data.pbUserId as string | undefined,
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
        gameConfig: room.gameConfig,
      },
    })

    // Both players are now in the room — start the game
    if (room.player1 && room.player2) {
      startGame(io, room, roomManager, turnManager)
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

      const opponent = getOpponent(room, playerId)
      if (opponent) {
        io.to(opponent.socketId).emit(GAME_EVENTS.OPPONENT_DISCONNECTED, {
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

/** Create the game state for a full room, notify both players, and start the first turn. */
function startGame(
  io: Server,
  room: Room,
  roomManager: RoomManager,
  turnManager: TurnManager,
): void {
  if (!room.player1 || !room.player2) return

  const gameState = createGame(
    room.player1.playerId,
    room.player1.username,
    room.player2.playerId,
    room.player2.username,
    room.turnTimer,
    room.gameConfig,
  )

  // Generate resources for first player's first turn
  room.gameState = turnManager.generateResources(gameState)

  // Emit game state to each player (personalised view)
  io.to(room.player1.socketId).emit(GAME_EVENTS.GAME_START, {
    gameState: getClientState(room.gameState, room.player1.playerId),
  })
  io.to(room.player2.socketId).emit(GAME_EVENTS.GAME_START, {
    gameState: getClientState(room.gameState, room.player2.playerId),
  })

  // Start first turn timer
  turnManager.startTurn(room.id, room.gameState, () => {
    handleTurnTimeout(io, room.id, roomManager, turnManager)
  })
  maybeScheduleBotTurn(io, room.id, roomManager, turnManager)

  logger.info({ roomId: room.id, bot: room.botDifficulty }, 'Game started')
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
    const opponent = getOpponent(room, playerId)
    if (opponent) {
      endGame(io, room, turnManager, opponent.playerId, 'forfeit')
    } else {
      turnManager.cleanup(roomId)
    }
  }

  socket.leave(roomId)
  socket.data.roomId = undefined
  roomManager.leaveRoom(roomId, playerId)

  // A bot can't hold a room open — delete the room once no humans remain
  const remaining = roomManager.getRoom(roomId)
  if (remaining) {
    const humans = [remaining.player1, remaining.player2].filter(
      (p) => p && !isBotId(p.playerId),
    )
    if (humans.length === 0) {
      turnManager.cleanup(roomId)
      roomManager.deleteRoom(roomId)
    }
  }

  logger.info({ roomId, playerId }, 'Player left room')

  io.emit(LOBBY_EVENTS.ROOM_LIST, { rooms: roomManager.listOpenRooms() })
}

function getOpponent(room: Room, playerId: string) {
  if (room.player1?.playerId === playerId) return room.player2
  if (room.player2?.playerId === playerId) return room.player1
  return null
}

