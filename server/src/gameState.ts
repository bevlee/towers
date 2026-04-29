import type {
  CardInstance,
  ClientGameState,
  GameConfig,
  GameState,
  PlayerState,
} from '@towers/shared'
import {
  HAND_SIZE,
  STARTING_LEVELS,
  STARTING_RESOURCES,
  STARTING_TOWER,
  STARTING_WALL,
} from '@towers/shared'
import { buildDeck, dealHands, seededShuffleDeck, shuffleDeck } from './deckManager.js'

export function defaultGameConfig(): GameConfig {
  return {
    seed: '',
    ore: STARTING_RESOURCES,
    mana: STARTING_RESOURCES,
    troops: STARTING_RESOURCES,
    mineLevel: STARTING_LEVELS,
    monasteryLevel: STARTING_LEVELS,
    barracksLevel: STARTING_LEVELS,
    tower: STARTING_TOWER,
    wall: STARTING_WALL,
  }
}

/**
 * Create the initial PlayerState for a player with their dealt hand.
 */
export function createInitialPlayerState(
  playerId: string,
  username: string,
  hand: CardInstance[],
  config: GameConfig,
): PlayerState {
  return {
    playerId,
    username,
    tower: config.tower,
    wall: config.wall,
    ore: config.ore,
    mana: config.mana,
    troops: config.troops,
    mineLevel: config.mineLevel,
    monasteryLevel: config.monasteryLevel,
    barracksLevel: config.barracksLevel,
    hand,
  }
}

/**
 * Create a full initial GameState for two players.
 * Builds and shuffles the deck (seeded if config.seed is non-empty), deals hands, and initialises all state.
 */
export function createGame(
  p1Id: string,
  p1Name: string,
  p2Id: string,
  p2Name: string,
  turnTimer: number,
  config: GameConfig,
): GameState {
  const rawDeck = buildDeck()
  const deck = config.seed ? seededShuffleDeck(rawDeck, config.seed) : shuffleDeck(rawDeck)
  const { hands, remainingDeck } = dealHands(deck, HAND_SIZE)

  const player1 = createInitialPlayerState(p1Id, p1Name, hands[0], config)
  const player2 = createInitialPlayerState(p2Id, p2Name, hands[1], config)

  return {
    phase: 'playing',
    players: [player1, player2],
    currentPlayerIndex: 0,
    deck: remainingDeck,
    discardPile: [],
    turnTimer,
    consecutiveTimeouts: [0, 0],
    awaitingDrawDiscard: false,
    history: [],
    turnNumber: 1,
    timerKey: 0,
  }
}

/**
 * Project full server GameState into a client-safe view for the given player.
 * The opponent's hand is hidden and replaced with a handSize count.
 */
export function getClientState(
  state: GameState,
  playerId: string,
): ClientGameState {
  const playerIndex = state.players.findIndex((p) => p.playerId === playerId)
  if (playerIndex === -1) {
    throw new Error(`Player not found in game: ${playerId}`)
  }

  const opponentIndex = playerIndex === 0 ? 1 : 0
  const you = state.players[playerIndex]
  const opp = state.players[opponentIndex]

  const { hand: _hand, ...oppWithoutHand } = opp
  const opponent = { ...oppWithoutHand, handSize: opp.hand.length }

  return {
    phase: state.phase,
    you,
    opponent,
    isYourTurn: state.currentPlayerIndex === playerIndex,
    deckSize: state.deck.length,
    turnTimer: state.turnTimer,
    turnNumber: state.turnNumber,
    timerKey: state.timerKey,
    winner: state.winner,
    winReason: state.winReason,
    lastPlayedCard: state.lastPlayedCard,
    history: state.history,
  }
}
