import { describe, it, expect, afterEach } from 'vitest'
import type { GameState } from '@towers/shared'
import { GAME_EVENTS } from '@towers/shared'
import type { Server } from 'socket.io'
import { RoomManager } from '../roomManager.js'
import { TurnManager } from '../turnManager.js'
import { handleTurnTimeout } from '../handlers/turnFlow.js'
import { defaultGameConfig } from '../gameState.js'
import { cardInstance, makePlayer, makeState } from './botHelpers.js'

function stubIo() {
  const events: { target: string; event: string; payload: unknown }[] = []
  const io = {
    to(target: string) {
      return {
        emit(event: string, payload: unknown) {
          events.push({ target, event, payload })
        },
      }
    },
  } as unknown as Server
  return { io, events }
}

function setupRoom(gameState: GameState) {
  const roomManager = new RoomManager()
  const turnManager = new TurnManager()
  const room = roomManager.createRoom(
    'test room',
    20,
    { playerId: 'p1', username: 'P1', socketId: 'sock-1' },
    defaultGameConfig(),
  )
  room.player2 = { playerId: 'p2', username: 'P2', socketId: 'sock-2' }
  room.gameState = gameState
  return { roomManager, turnManager, room }
}

const deck = Array.from({ length: 10 }, (_, i) => cardInstance('Basic Wall', 100 + i))

describe('handleTurnTimeout', () => {
  let cleanup: (() => void) | null = null
  afterEach(() => cleanup?.())

  it('during draw-discard, discards the newest discardable card, refills the hand and passes the turn', () => {
    // Hand after a drawDiscard card: the newest draw (last) is an undiscardable Lodestone
    const hand = [cardInstance('Ruby', 1), cardInstance('Ruby', 2), cardInstance('Lodestone', 1)]
    const state = makeState({
      deck: [...deck],
      awaitingDrawDiscard: true,
      players: [makePlayer({ playerId: 'p1', hand }), makePlayer({ playerId: 'p2' })],
    })
    const { io, events } = stubIo()
    const { roomManager, turnManager, room } = setupRoom(state)
    cleanup = () => turnManager.cleanup(room.id)

    handleTurnTimeout(io, room.id, roomManager, turnManager)

    const after = room.gameState!
    const p1Hand = after.players[0].hand
    expect(after.awaitingDrawDiscard).toBe(false)
    expect(after.currentPlayerIndex).toBe(1)
    expect(p1Hand).toHaveLength(hand.length) // discarded one, redrew one
    expect(p1Hand.map((c) => c.id)).toContain('lodestone-1')
    expect(p1Hand.map((c) => c.id)).not.toContain('ruby-2')
    expect(after.discardPile.map((c) => c.id)).toEqual(['ruby-2'])
    expect(events.some((e) => e.event === GAME_EVENTS.TURN_TIMEOUT)).toBe(true)
  })

  it('force-discards when every card in hand is undiscardable, so the game does not stall', () => {
    const hand = [cardInstance('Lodestone', 1), cardInstance('Lodestone', 2)]
    const state = makeState({
      deck: [...deck],
      players: [makePlayer({ playerId: 'p1', hand }), makePlayer({ playerId: 'p2' })],
    })
    const { io } = stubIo()
    const { roomManager, turnManager, room } = setupRoom(state)
    cleanup = () => turnManager.cleanup(room.id)

    handleTurnTimeout(io, room.id, roomManager, turnManager)

    const after = room.gameState!
    expect(after.currentPlayerIndex).toBe(1)
    expect(after.discardPile).toHaveLength(1)
    expect(after.discardPile[0].cardName).toBe('Lodestone')
    expect(after.players[0].hand).toHaveLength(hand.length)
  })
})
