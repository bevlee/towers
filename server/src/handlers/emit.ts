import type { Server } from 'socket.io'
import { GAME_EVENTS } from '@towers/shared'
import type { Room } from '../roomManager.js'
import { getClientState } from '../gameState.js'
import { recordGameResult } from '../statsRecorder.js'

/** Emit an event to both players in a room. */
export function emitToBothPlayers(io: Server, room: Room, event: string, payload: unknown): void {
  if (room.player1) io.to(room.player1.socketId).emit(event, payload)
  if (room.player2) io.to(room.player2.socketId).emit(event, payload)
}

/** Emit personalised game state to both players. */
export function emitGameStateToBoth(io: Server, room: Room): void {
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

/** Emit game over to both players and record stats to PocketBase. */
export function emitGameOverToBoth(io: Server, room: Room, winnerId: string, winReason: string): void {
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

  const pbIds: Record<string, string> = {}
  if (room.player1?.pbUserId) pbIds[room.player1.playerId] = room.player1.pbUserId
  if (room.player2?.pbUserId) pbIds[room.player2.playerId] = room.player2.pbUserId
  recordGameResult(room.gameState, pbIds)
}
