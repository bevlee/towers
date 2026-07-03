import { describe, it, expect, afterEach } from 'vitest'
import type { GameState } from '@towers/shared'
import { GAME_EVENTS } from '@towers/shared'
import type { Server } from 'socket.io'
import { RoomManager } from '../roomManager.js'
import { TurnManager } from '../turnManager.js'
import { createBotSlot, isBotId, runBotTurn } from '../bot/botRunner.js'
import { defaultGameConfig } from '../gameState.js'
import { cardInstance, makePlayer, makeState } from './botHelpers.js'

function fillerDeck(n: number) {
  return Array.from({ length: n }, (_, i) => cardInstance('Basic Wall', 100 + i))
}

/** Minimal io stub that records every emitted event. */
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
    emit(event: string, payload: unknown) {
      events.push({ target: '*', event, payload })
    },
  } as unknown as Server
  return { io, events }
}

function setupBotRoom(gameState: GameState, difficulty: 'easy' | 'hard' = 'easy') {
  const roomManager = new RoomManager()
  const turnManager = new TurnManager()
  const bot = createBotSlot(difficulty)

  // Rewrite the bot player id into the game state's player2 slot
  gameState.players[1] = { ...gameState.players[1], playerId: bot.playerId, username: bot.username }
  if (gameState.winner === 'p2') gameState.winner = bot.playerId

  const room = roomManager.createRoom(
    'test room',
    20,
    { playerId: 'human', username: 'Human', socketId: 'sock-human' },
    defaultGameConfig(),
  )
  room.player2 = bot
  room.botDifficulty = difficulty
  room.gameState = gameState

  return { roomManager, turnManager, room, bot }
}

describe('createBotSlot / isBotId', () => {
  it('creates bot slots recognised by isBotId', () => {
    const bot = createBotSlot('easy')
    expect(isBotId(bot.playerId)).toBe(true)
    expect(isBotId('some-human-uuid')).toBe(false)
    expect(bot.username).toContain('Easy')
  })
})

describe('runBotTurn', () => {
  let cleanup: (() => void) | null = null
  afterEach(() => cleanup?.())

  it('plays a card, switches turn to the human, and emits state', async () => {
    const state = makeState({
      currentPlayerIndex: 1,
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'human', username: 'Human' }),
        makePlayer({ playerId: 'p2', mana: 20, hand: [cardInstance('Ruby')] }),
      ],
    })
    const { io, events } = stubIo()
    const { roomManager, turnManager, room, bot } = setupBotRoom(state)
    cleanup = () => turnManager.cleanup(room.id)

    await runBotTurn(io, room.id, roomManager, turnManager)

    expect(room.gameState!.currentPlayerIndex).toBe(0)
    expect(room.gameState!.history.at(-1)).toMatchObject({ playerId: bot.playerId, action: 'play', cardName: 'Ruby' })
    expect(events.some((e) => e.event === GAME_EVENTS.GAME_STATE && e.target === 'sock-human')).toBe(true)
  })

  it('emits game over when the bot wins', async () => {
    const state = makeState({
      currentPlayerIndex: 1,
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'human', username: 'Human', tower: 3, wall: 0 }),
        makePlayer({ playerId: 'p2', mana: 20, hand: [cardInstance('Gemstone Flaw')] }),
      ],
    })
    const { io, events } = stubIo()
    const { roomManager, turnManager, room, bot } = setupBotRoom(state)
    cleanup = () => turnManager.cleanup(room.id)

    await runBotTurn(io, room.id, roomManager, turnManager)

    expect(room.gameState!.phase).toBe('finished')
    expect(room.gameState!.winner).toBe(bot.playerId)
    const gameOver = events.find((e) => e.event === GAME_EVENTS.GAME_OVER && e.target === 'sock-human')
    expect(gameOver).toBeDefined()
  })

  it('keeps the turn and reschedules on a play-again card', async () => {
    const state = makeState({
      currentPlayerIndex: 1,
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'human', username: 'Human' }),
        makePlayer({ playerId: 'p2', mana: 5, hand: [cardInstance('Quartz')] }),
      ],
    })
    const { io } = stubIo()
    const { roomManager, turnManager, room } = setupBotRoom(state)
    cleanup = () => turnManager.cleanup(room.id)

    await runBotTurn(io, room.id, roomManager, turnManager, { rescheduleDelayMs: 1 })
    expect(room.gameState!.currentPlayerIndex).toBe(1)

    // Wait for the rescheduled follow-up move (plays the drawn Basic Wall or discards)
    await new Promise((r) => setTimeout(r, 200))
    expect(room.gameState!.currentPlayerIndex).toBe(0)
  })

  it('does nothing when it is not the bot turn', async () => {
    const state = makeState({
      currentPlayerIndex: 0,
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'human', username: 'Human', hand: [cardInstance('Ruby')] }),
        makePlayer({ playerId: 'p2', hand: [cardInstance('Quartz')] }),
      ],
    })
    const { io, events } = stubIo()
    const { roomManager, turnManager, room } = setupBotRoom(state)
    cleanup = () => turnManager.cleanup(room.id)

    await runBotTurn(io, room.id, roomManager, turnManager)

    expect(room.gameState!.currentPlayerIndex).toBe(0)
    expect(events).toHaveLength(0)
  })
})
