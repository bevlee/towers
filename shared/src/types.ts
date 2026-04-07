export type ResourceColor = 'red' | 'blue' | 'green'

export interface PlayerState {
  playerId: string
  username: string
  tower: number
  wall: number
  ore: number
  mana: number
  troops: number
  mineLevel: number
  monasteryLevel: number
  barracksLevel: number
  hand: CardInstance[]
}

export interface CardInstance {
  /** Unique instance ID (e.g., "strip-mine-0") */
  id: string
  /** References CardDefinition.name */
  cardName: string
}

export type ConditionCheck =
  | { type: 'compare_levels'; source: 'mine' | 'monastery' | 'barracks'; comparison: 'lt' | 'gt' | 'eq' }
  | { type: 'wall_zero'; target: 'self' | 'enemy' }

export type CardEffect =
  | { type: 'wall'; amount: number; target: 'self' | 'enemy' | 'all' }
  | { type: 'tower'; amount: number; target: 'self' | 'enemy' | 'all' }
  | { type: 'damage'; amount: number; direct: boolean }
  | { type: 'resource'; resource: 'ore' | 'mana' | 'troops'; amount: number; target: 'self' | 'enemy' | 'all' }
  | { type: 'level'; source: 'mine' | 'monastery' | 'barracks'; amount: number; target: 'self' | 'enemy' | 'all' }
  | { type: 'selfDamage'; amount: number }
  | { type: 'playAgain' }
  | { type: 'conditional'; condition: ConditionCheck; ifTrue: CardEffect[]; ifFalse: CardEffect[] }
  | { type: 'swap'; property: 'wall' }
  | { type: 'steal'; resource: 'ore' | 'mana' | 'troops'; amount: number }
  | { type: 'drawDiscard' }
  | { type: 'copyLevel'; source: 'mine' | 'monastery' | 'barracks' }

export interface CardDefinition {
  name: string
  cost: number
  copies: number
  color: ResourceColor
  effects: CardEffect[]
  /** When false, the card cannot be discarded (only played). Defaults to true. */
  canDiscard?: boolean
}

export interface GameHistoryEntry {
  turn: number
  playerId: string
  username: string
  action: 'play' | 'discard' | 'timeout_discard'
  cardName: string
}

export type GamePhase = 'waiting' | 'playing' | 'finished'

export interface GameState {
  phase: GamePhase
  players: [PlayerState, PlayerState]
  currentPlayerIndex: 0 | 1
  deck: CardInstance[]
  discardPile: CardInstance[]
  turnTimeRemaining: number
  turnTimer: number
  /** Consecutive timeouts per player index [p0, p1]. 3 in a row = forfeit. */
  consecutiveTimeouts: [number, number]
  winner?: string
  winReason?: 'tower_destroyed' | 'tower_built' | 'resources' | 'timeout' | 'afk' | 'forfeit'
  playAgainActive: boolean
  /** True while waiting for the current player to send DRAW_DISCARD_CHOICE. */
  awaitingDrawDiscard: boolean
  history: GameHistoryEntry[]
  turnNumber: number
  lastPlayedCard?: { cardName: string; playedBy: string }
}

export interface ClientGameState {
  phase: GamePhase
  you: PlayerState
  opponent: Omit<PlayerState, 'hand'> & { handSize: number }
  isYourTurn: boolean
  deckSize: number
  turnTimeRemaining: number
  turnNumber: number
  winner?: string
  winReason?: string
  lastPlayedCard?: { cardName: string; playedBy: string }
  history: GameHistoryEntry[]
}

export interface RoomInfo {
  id: string
  name: string
  player1: { playerId: string; username: string } | null
  player2: { playerId: string; username: string } | null
  turnTimer: number
}
