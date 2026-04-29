import { useEffect, useState, useCallback } from 'react'
import type { GameConfig, RoomInfo } from '@towers/shared'
import { LOBBY_EVENTS } from '@towers/shared'
import type { RoomListPayload, RoomCreatedPayload, RoomJoinedPayload, ErrorPayload } from '@towers/shared'
import { socket } from '../socket'

export function useLobby() {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onRoomList(payload: RoomListPayload) {
      setRooms(payload.rooms)
    }

    function onRoomCreated(payload: RoomCreatedPayload) {
      setCurrentRoom(payload.room)
    }

    function onRoomJoined(payload: RoomJoinedPayload) {
      setCurrentRoom(payload.room)
    }

    function onError(payload: ErrorPayload) {
      setError(payload.message)
    }

    socket.on(LOBBY_EVENTS.ROOM_LIST, onRoomList)
    socket.on(LOBBY_EVENTS.ROOM_CREATED, onRoomCreated)
    socket.on(LOBBY_EVENTS.ROOM_JOINED, onRoomJoined)
    socket.on(LOBBY_EVENTS.ERROR, onError)

    return () => {
      socket.off(LOBBY_EVENTS.ROOM_LIST, onRoomList)
      socket.off(LOBBY_EVENTS.ROOM_CREATED, onRoomCreated)
      socket.off(LOBBY_EVENTS.ROOM_JOINED, onRoomJoined)
      socket.off(LOBBY_EVENTS.ERROR, onError)
    }
  }, [])

  const listRooms = useCallback(() => {
    socket.emit(LOBBY_EVENTS.LIST_ROOMS)
  }, [])

  const createRoom = useCallback((turnTimer: number, username: string, gameConfig: GameConfig) => {
    setError(null)
    socket.emit(LOBBY_EVENTS.CREATE_ROOM, { turnTimer, username, gameConfig })
  }, [])

  const joinRoom = useCallback((roomId: string, username: string) => {
    setError(null)
    socket.emit(LOBBY_EVENTS.JOIN_ROOM, { roomId, username })
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    socket.emit(LOBBY_EVENTS.LEAVE_ROOM, { roomId })
    setCurrentRoom(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { rooms, currentRoom, error, listRooms, createRoom, joinRoom, leaveRoom, clearError }
}
