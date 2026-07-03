import type { CardInstance, GameState, PlayerState } from '@towers/shared'
import {
  STARTING_LEVELS,
  STARTING_RESOURCES,
  STARTING_TOWER,
  STARTING_WALL,
} from '@towers/shared'

export function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: 'p1',
    username: 'Player 1',
    tower: STARTING_TOWER,
    wall: STARTING_WALL,
    ore: STARTING_RESOURCES,
    mana: STARTING_RESOURCES,
    troops: STARTING_RESOURCES,
    mineLevel: STARTING_LEVELS,
    monasteryLevel: STARTING_LEVELS,
    barracksLevel: STARTING_LEVELS,
    hand: [],
    ...overrides,
  }
}

export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    players: [makePlayer({ playerId: 'p1' }), makePlayer({ playerId: 'p2' })],
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    turnTimer: 20,
    consecutiveTimeouts: [0, 0],
    awaitingDrawDiscard: false,
    history: [],
    turnNumber: 1,
    timerKey: 0,
    ...overrides,
  }
}

export function cardInstance(cardName: string, copy = 0): CardInstance {
  return { id: `${cardName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${copy}`, cardName }
}
