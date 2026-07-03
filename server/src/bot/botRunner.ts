import crypto from 'node:crypto'
import type { Server } from 'socket.io'
import type { RoomManager } from '../roomManager.js'
import type { TurnManager } from '../turnManager.js'
import { continueTurn, endGame, finishTurn, handleTurnTimeout } from '../handlers/turnFlow.js'
import { logger } from '../logger.js'
import { chooseGreedyAction } from './greedy.js'
import { chooseHardAction } from './hardSearch.js'
import { chooseWorstCard, discardFromHand } from './simulate.js'
import type { BotAction } from './simulate.js'

export type BotDifficulty = 'easy' | 'hard'

/** Sentinel socket id for bot players — emitting to it is a harmless no-op. */
export const BOT_SOCKET_ID = 'bot'

/** Pause before the bot acts, so moves feel considered rather than instant. */
const BOT_THINK_DELAY_MS = 1200
/** Shorter pause between chained play-again moves. */
const BOT_CHAIN_DELAY_MS = 700

const BOT_ID_PREFIX = 'bot:'

export function isBotId(playerId: string): boolean {
  return playerId.startsWith(BOT_ID_PREFIX)
}

/** Create the player2 slot for a bot opponent. */
export function createBotSlot(difficulty: BotDifficulty) {
  return {
    playerId: `${BOT_ID_PREFIX}${crypto.randomUUID()}`,
    username: difficulty === 'easy' ? 'Bot (Easy)' : 'Bot (Hard)',
    socketId: BOT_SOCKET_ID,
  }
}

/**
 * If the room's current player is a bot, schedule its move after a short
 * "thinking" delay. Safe to call after any turn transition — it no-ops when
 * it is not a bot's turn. The regular turn timer keeps running as a fallback.
 */
export function maybeScheduleBotTurn(
  io: Server,
  roomId: string,
  roomManager: RoomManager,
  turnManager: TurnManager,
  delayMs: number = BOT_THINK_DELAY_MS,
): void {
  const room = roomManager.getRoom(roomId)
  if (!room?.gameState || room.gameState.phase !== 'playing') return

  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex]
  if (!isBotId(currentPlayer.playerId)) return

  setTimeout(() => {
    runBotTurn(io, roomId, roomManager, turnManager).catch((err) => {
      logger.error({ roomId, err }, 'Bot turn failed')
    })
  }, delayMs)
}

interface RunBotTurnOptions {
  rescheduleDelayMs?: number
}

/**
 * Execute one bot action, mirroring the socket handlers' flow: choose a card,
 * apply it through the TurnManager, record history, check wins, generate
 * resources on turn end, emit state, and restart timers. Chained turns
 * (play-again) reschedule themselves.
 */
export async function runBotTurn(
  io: Server,
  roomId: string,
  roomManager: RoomManager,
  turnManager: TurnManager,
  options: RunBotTurnOptions = {},
): Promise<void> {
  const room = roomManager.getRoom(roomId)
  if (!room?.gameState || room.gameState.phase !== 'playing') return

  const state = room.gameState
  const playerIndex = state.currentPlayerIndex
  const bot = state.players[playerIndex]
  if (!isBotId(bot.playerId)) return

  const action = await chooseBotAction(room.botDifficulty ?? 'easy', state, playerIndex)

  // The game may have ended (forfeit/disconnect) while the hard bot was thinking.
  const freshRoom = roomManager.getRoom(roomId)
  if (!freshRoom?.gameState || freshRoom.gameState.phase !== 'playing') return
  if (freshRoom.gameState !== state) return

  if (!action) {
    // Nothing legal to do — let the turn timer's random discard resolve it.
    return
  }

  turnManager.clearTurnTimer(roomId)
  const resetState = turnManager.resetTimeouts(state)

  try {
    if (action.type === 'discard') {
      applyBotDiscard(io, room, roomManager, turnManager, resetState, action.cardName)
    } else {
      applyBotPlay(io, room, roomManager, turnManager, resetState, action.cardName, options)
    }
  } catch (err) {
    logger.error({ roomId, action, err }, 'Error applying bot action')
    // Restart the timer so the game can still advance via timeout.
    turnManager.startTurn(roomId, room.gameState, () => {
      handleTurnTimeout(io, roomId, roomManager, turnManager)
    })
  }
}

async function chooseBotAction(
  difficulty: BotDifficulty,
  state: Parameters<typeof chooseGreedyAction>[0],
  playerIndex: 0 | 1,
): Promise<BotAction | null> {
  if (difficulty === 'hard') {
    return chooseHardAction(state, playerIndex)
  }
  return chooseGreedyAction(state, playerIndex)
}

function applyBotPlay(
  io: Server,
  room: NonNullable<ReturnType<RoomManager['getRoom']>>,
  roomManager: RoomManager,
  turnManager: TurnManager,
  state: NonNullable<typeof room.gameState>,
  cardName: string,
  options: RunBotTurnOptions,
): void {
  const playerIndex = state.currentPlayerIndex
  const bot = state.players[playerIndex]

  const result = turnManager.handlePlayCard(state, cardName)
  room.gameState = {
    ...result.state,
    lastPlayedCard: { cardName, playedBy: bot.playerId },
  }
  room.gameState = turnManager.addHistoryEntry(room.gameState, bot, 'play', cardName)

  if (result.winResult) {
    endGame(io, room, turnManager, result.winResult.winner, result.winResult.reason)
    return
  }

  let keepTurn = result.playAgain

  if (result.needsDrawDiscard) {
    // Resolve the draw-discard inline: draw, ditch the worst card, draw again.
    room.gameState = turnManager.drawForPlayer(room.gameState, playerIndex)
    const worst = chooseWorstCard(room.gameState, playerIndex)
    if (worst) {
      room.gameState = discardFromHand(room.gameState, playerIndex, worst)
      room.gameState = turnManager.addHistoryEntry(room.gameState, bot, 'discard', worst)
      room.gameState = turnManager.drawForPlayer(room.gameState, playerIndex)
    }
    // The live draw-discard flow keeps the turn (both cards grant play-again).
    keepTurn = true
  }

  if (keepTurn) {
    continueTurn(io, room, roomManager, turnManager, options.rescheduleDelayMs ?? BOT_CHAIN_DELAY_MS)
    return
  }

  finishTurn(io, room, roomManager, turnManager)
}

function applyBotDiscard(
  io: Server,
  room: NonNullable<ReturnType<RoomManager['getRoom']>>,
  roomManager: RoomManager,
  turnManager: TurnManager,
  state: NonNullable<typeof room.gameState>,
  cardName: string,
): void {
  const playerIndex = state.currentPlayerIndex
  const bot = state.players[playerIndex]
  const instance = bot.hand.find((c) => c.cardName === cardName)
  if (!instance) throw new Error(`Bot discard not in hand: ${cardName}`)

  const result = turnManager.handleDiscard(state, instance.id)
  room.gameState = { ...result.state, lastPlayedCard: undefined }
  room.gameState = turnManager.addHistoryEntry(room.gameState, bot, 'discard', cardName)

  finishTurn(io, room, roomManager, turnManager)
}
