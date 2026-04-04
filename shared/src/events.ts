// ---- Lobby event names ----
export const LOBBY_EVENTS = {
  LIST_ROOMS: 'listRooms',
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  ROOM_LIST: 'roomList',
  ROOM_CREATED: 'roomCreated',
  ROOM_JOINED: 'roomJoined',
  ERROR: 'error',
} as const

// ---- Game event names ----
export const GAME_EVENTS = {
  GAME_START: 'gameStart',
  GAME_STATE: 'gameState',
  PLAY_CARD: 'playCard',
  DISCARD_CARD: 'discardCard',
  DRAW_DISCARD_CHOICE: 'drawDiscardChoice',
  DRAW_DISCARD_REQUEST: 'drawDiscardRequest',
  TURN_TIMEOUT: 'turnTimeout',
  GAME_OVER: 'gameOver',
  OPPONENT_DISCONNECTED: 'opponentDisconnected',
} as const

// ---- Lobby payload types ----

export interface ListRoomsPayload {
  // no fields needed
}

export interface CreateRoomPayload {
  name: string
  turnTimer: number
  username: string
}

export interface JoinRoomPayload {
  roomId: string
  username: string
}

export interface LeaveRoomPayload {
  roomId: string
}

export interface RoomListPayload {
  rooms: import('./types.js').RoomInfo[]
}

export interface RoomCreatedPayload {
  room: import('./types.js').RoomInfo
}

export interface RoomJoinedPayload {
  room: import('./types.js').RoomInfo
}

export interface ErrorPayload {
  message: string
}

// ---- Game payload types ----

export interface GameStartPayload {
  gameState: import('./types.js').ClientGameState
}

export interface GameStatePayload {
  gameState: import('./types.js').ClientGameState
}

export interface PlayCardPayload {
  cardInstanceId: string
}

export interface DiscardCardPayload {
  cardInstanceId: string
}

export interface DrawDiscardRequestPayload {
  hand: import('./types.js').CardInstance[]
}

export interface DrawDiscardChoicePayload {
  discardCardInstanceId: string
}

export interface TurnTimeoutPayload {
  discardedCardInstanceId: string
}

export interface GameOverPayload {
  winner: string
  winReason: string
  finalState: import('./types.js').ClientGameState
}

export interface OpponentDisconnectedPayload {
  message: string
}
