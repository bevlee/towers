import type { GameConfig, GameState, RoomInfo } from '@towers/shared'
import crypto from 'node:crypto'

interface PlayerSlot {
  playerId: string
  username: string
  socketId: string
}

export interface Room {
  id: string
  name: string
  player1: PlayerSlot | null
  player2: PlayerSlot | null
  turnTimer: number
  gameState: GameState | null
  gameConfig: GameConfig
}

/**
 * In-memory room management for the Two Towers lobby.
 */
export class RoomManager {
  private rooms: Map<string, Room> = new Map()

  /** Create a new room with the given player as player1. */
  createRoom(name: string, turnTimer: number, player: PlayerSlot, gameConfig: GameConfig): Room {
    const id = crypto.randomUUID()
    const room: Room = {
      id,
      name,
      player1: player,
      player2: null,
      turnTimer,
      gameState: null,
      gameConfig,
    }
    this.rooms.set(id, room)
    return room
  }

  /** Join an existing room as player2. Throws if room is full or not found. */
  joinRoom(roomId: string, player: PlayerSlot): Room {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error(`Room not found: ${roomId}`)
    }
    if (room.player1?.playerId === player.playerId) {
      throw new Error(`Cannot join your own room: ${roomId}`)
    }
    if (room.player2) {
      throw new Error(`Room is full: ${roomId}`)
    }
    room.player2 = player
    return room
  }

  /** Remove a player from a room. Deletes the room if it becomes empty. */
  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    if (room.player1?.playerId === playerId) {
      room.player1 = room.player2
      room.player2 = null
    } else if (room.player2?.playerId === playerId) {
      room.player2 = null
    }

    // Delete room if empty
    if (!room.player1 && !room.player2) {
      this.rooms.delete(roomId)
    }
  }

  /** Get a room by ID. */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  /** List all rooms that are waiting for a second player (no player2 and no game started). */
  listOpenRooms(): RoomInfo[] {
    const open: RoomInfo[] = []

    for (const room of this.rooms.values()) {
      if (!room.player2 && !room.gameState) {
        open.push(this.toRoomInfo(room))
      }
    }

    return open
  }

  /** Delete a room by ID. */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId)
  }

  /** Find a room by a connected socket ID. Returns the room and the player's ID. */
  getRoomBySocketId(socketId: string): { room: Room; playerId: string } | undefined {
    for (const room of this.rooms.values()) {
      if (room.player1?.socketId === socketId) {
        return { room, playerId: room.player1.playerId }
      }
      if (room.player2?.socketId === socketId) {
        return { room, playerId: room.player2.playerId }
      }
    }
    return undefined
  }

  /** Convert a Room to the client-safe RoomInfo shape. */
  private toRoomInfo(room: Room): RoomInfo {
    return {
      id: room.id,
      name: room.name,
      player1: room.player1
        ? { playerId: room.player1.playerId, username: room.player1.username }
        : null,
      player2: room.player2
        ? { playerId: room.player2.playerId, username: room.player2.username }
        : null,
      turnTimer: room.turnTimer,
      gameConfig: room.gameConfig,
    }
  }
}
