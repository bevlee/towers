import { describe, it, expect, afterEach } from 'vitest'
import type { Server, Socket } from 'socket.io'
import { GAME_EVENTS, LOBBY_EVENTS } from '@towers/shared'
import { RoomManager } from '../roomManager.js'
import { TurnManager } from '../turnManager.js'
import { registerLobbyHandlers } from '../handlers/lobbyHandlers.js'
import { isBotId } from '../bot/botRunner.js'

/** Stub io + socket pair that records emits and captures registered handlers. */
function stubSocketIo() {
  const emitted: { target: string; event: string; payload: unknown }[] = []
  const handlers = new Map<string, (payload: unknown) => void>()

  const io = {
    to(target: string) {
      return {
        emit(event: string, payload: unknown) {
          emitted.push({ target, event, payload })
        },
      }
    },
    emit(event: string, payload: unknown) {
      emitted.push({ target: '*', event, payload })
    },
  } as unknown as Server

  const socket = {
    id: 'sock-human',
    data: { playerId: 'human-1' },
    on(event: string, handler: (payload: unknown) => void) {
      handlers.set(event, handler)
    },
    emit(event: string, payload: unknown) {
      emitted.push({ target: 'self', event, payload })
    },
    join() {},
    leave() {},
  } as unknown as Socket

  return { io, socket, emitted, handlers }
}

describe('createRoom with a bot opponent', () => {
  const roomManager = new RoomManager()
  const turnManager = new TurnManager()
  let roomId: string | undefined

  afterEach(() => {
    if (roomId) turnManager.cleanup(roomId)
  })

  it('seats the bot and starts the game immediately', () => {
    const { io, socket, emitted, handlers } = stubSocketIo()
    registerLobbyHandlers(io, socket, roomManager, turnManager)

    handlers.get(LOBBY_EVENTS.CREATE_ROOM)!({
      turnTimer: 20,
      username: 'Human',
      bot: 'hard',
    })

    const gameStart = emitted.find((e) => e.event === GAME_EVENTS.GAME_START && e.target === 'sock-human')
    expect(gameStart).toBeDefined()

    const rooms = [...(roomManager as unknown as { rooms: Map<string, { id: string; player2: { playerId: string } | null; botDifficulty?: string; gameState: unknown }> }).rooms.values()]
    expect(rooms).toHaveLength(1)
    const room = rooms[0]
    roomId = room.id
    expect(room.player2).not.toBeNull()
    expect(isBotId(room.player2!.playerId)).toBe(true)
    expect(room.botDifficulty).toBe('hard')
    expect(room.gameState).not.toBeNull()
  })
})
