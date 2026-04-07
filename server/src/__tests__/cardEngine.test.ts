import { describe, it, expect } from 'vitest'
import type { GameState, PlayerState, CardInstance } from '@towers/shared'
import { CARD_MAP, STARTING_TOWER, STARTING_WALL, STARTING_RESOURCES, STARTING_LEVELS } from '@towers/shared'
import { applyDamage, applySelfDamage } from '../damageResolver.js'
import { checkWin } from '../winChecker.js'
import { canPlayCard, deductCost, executeEffects, playCard } from '../cardEngine.js'

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
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

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    players: [makePlayer({ playerId: 'p1' }), makePlayer({ playerId: 'p2' })],
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    turnTimeRemaining: 20,
    turnTimer: 20,
    consecutiveTimeouts: [0, 0],
    playAgainActive: false,
    awaitingDrawDiscard: false,
    history: [],
    turnNumber: 1,
    ...overrides,
  }
}

function cardInstance(cardName: string): CardInstance {
  return { id: `${cardName}-0`, cardName }
}

// ─── Damage Resolver ────────────────────────────────────────────

describe('damageResolver', () => {
  it('direct damage bypasses wall', () => {
    const player = makePlayer({ tower: 20, wall: 10 })
    const result = applyDamage(player, 5, true)
    expect(result.tower).toBe(15)
    expect(result.wall).toBe(10)
  })

  it('regular damage is absorbed by wall first', () => {
    const player = makePlayer({ tower: 20, wall: 10 })
    const result = applyDamage(player, 7, false)
    expect(result.wall).toBe(3)
    expect(result.tower).toBe(20)
  })

  it('regular damage overflows to tower', () => {
    const player = makePlayer({ tower: 20, wall: 3 })
    const result = applyDamage(player, 7, false)
    expect(result.wall).toBe(0)
    expect(result.tower).toBe(16)
  })

  it('damage with no wall hits tower directly', () => {
    const player = makePlayer({ tower: 20, wall: 0 })
    const result = applyDamage(player, 5, false)
    expect(result.tower).toBe(15)
    expect(result.wall).toBe(0)
  })

  it('tower clamps to 0', () => {
    const player = makePlayer({ tower: 3, wall: 0 })
    const result = applyDamage(player, 10, false)
    expect(result.tower).toBe(0)
  })

  it('applySelfDamage uses regular damage rules', () => {
    const player = makePlayer({ tower: 20, wall: 2 })
    const result = applySelfDamage(player, 5)
    expect(result.wall).toBe(0)
    expect(result.tower).toBe(17)
  })

  it('does not mutate original player', () => {
    const player = makePlayer({ tower: 20, wall: 5 })
    applyDamage(player, 3, false)
    expect(player.wall).toBe(5)
    expect(player.tower).toBe(20)
  })
})

// ─── Win Checker ────────────────────────────────────────────────

describe('winChecker', () => {
  it('returns null when no win condition met', () => {
    const state = makeState()
    expect(checkWin(state)).toBeNull()
  })

  it('detects tower destroyed', () => {
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', tower: 0 })
    const result = checkWin(state)
    expect(result).toEqual({ winner: 'p1', reason: 'tower_destroyed' })
  })

  it('detects tower built', () => {
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', tower: 50 })
    const result = checkWin(state)
    expect(result).toEqual({ winner: 'p1', reason: 'tower_built' })
  })

  it('detects resource victory', () => {
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', ore: 150, mana: 150, troops: 150 })
    const result = checkWin(state)
    expect(result).toEqual({ winner: 'p1', reason: 'resources' })
  })

  it('resource victory requires ALL three resources', () => {
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', ore: 150, mana: 150, troops: 100 })
    expect(checkWin(state)).toBeNull()
  })

  it('simultaneous tower destruction: current player wins', () => {
    const state = makeState({ currentPlayerIndex: 0 })
    state.players[0] = makePlayer({ playerId: 'p1', tower: 0 })
    state.players[1] = makePlayer({ playerId: 'p2', tower: 0 })
    const result = checkWin(state)
    expect(result).toEqual({ winner: 'p1', reason: 'tower_destroyed' })
  })
})

// ─── canPlayCard ────────────────────────────────────────────────

describe('canPlayCard', () => {
  it('returns true when player can afford the card', () => {
    const player = makePlayer({ ore: 10 })
    expect(canPlayCard(player, CARD_MAP['Big Wall'])).toBe(true)
  })

  it('returns false when player cannot afford the card', () => {
    const player = makePlayer({ ore: 2 })
    expect(canPlayCard(player, CARD_MAP['Big Wall'])).toBe(false)
  })

  it('zero cost cards are always playable', () => {
    const player = makePlayer({ ore: 0 })
    expect(canPlayCard(player, CARD_MAP['Strip Mine'])).toBe(true)
  })

  it('checks mana for blue cards', () => {
    const player = makePlayer({ mana: 1 })
    expect(canPlayCard(player, CARD_MAP['Amethyst'])).toBe(false) // cost 2
  })

  it('checks troops for green cards', () => {
    const player = makePlayer({ troops: 10 })
    expect(canPlayCard(player, CARD_MAP['Orc'])).toBe(true) // cost 3
  })
})

// ─── deductCost ─────────────────────────────────────────────────

describe('deductCost', () => {
  it('deducts ore for red cards', () => {
    const player = makePlayer({ ore: 10 })
    const result = deductCost(player, CARD_MAP['Big Wall'])
    expect(result.ore).toBe(5) // Big Wall costs 5
  })

  it('deducts mana for blue cards', () => {
    const player = makePlayer({ mana: 10 })
    const result = deductCost(player, CARD_MAP['Ruby'])
    expect(result.mana).toBe(7) // Ruby costs 3
  })

  it('deducts troops for green cards', () => {
    const player = makePlayer({ troops: 10 })
    const result = deductCost(player, CARD_MAP['Orc'])
    expect(result.troops).toBe(7) // Orc costs 3
  })
})

// ─── Card Effects ───────────────────────────────────────────────

describe('card effects', () => {
  // --- Strip Mine: -1 mine, +10 wall, +5 mana ---
  it('Strip Mine: -1 mine, +10 wall, +5 mana', () => {
    const card = CARD_MAP['Strip Mine']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mineLevel).toBe(1) // 2-1, clamped to MIN_LEVEL=1
    expect(result.players[0].wall).toBe(15) // 5+10
    expect(result.players[0].mana).toBe(10) // 5+5
  })

  // --- Lucky Cache: +2 ore, +2 mana, play again ---
  it('Lucky Cache: +2 ore, +2 mana, play again', () => {
    const card = CARD_MAP['Lucky Cache']
    const state = makeState()
    const { state: result, playAgain } = executeEffects(state, 0, card.effects)
    expect(result.players[0].ore).toBe(7)
    expect(result.players[0].mana).toBe(7)
    expect(playAgain).toBe(true)
  })

  // --- Foundations: conditional wall=0 → +6, else +3 ---
  it('Foundations: +6 wall when wall is 0', () => {
    const card = CARD_MAP['Foundations']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', wall: 0 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].wall).toBe(6)
  })

  it('Foundations: +3 wall when wall > 0', () => {
    const card = CARD_MAP['Foundations']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].wall).toBe(8) // 5+3
  })

  // --- Mother Lode: if mine < enemy mine → +2 mine, else +1 ---
  it('Mother Lode: +2 mine when mine < enemy', () => {
    const card = CARD_MAP['Mother Lode']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', mineLevel: 2 })
    state.players[1] = makePlayer({ playerId: 'p2', mineLevel: 5 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mineLevel).toBe(4)
  })

  it('Mother Lode: +1 mine when mine >= enemy', () => {
    const card = CARD_MAP['Mother Lode']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', mineLevel: 5 })
    state.players[1] = makePlayer({ playerId: 'p2', mineLevel: 3 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mineLevel).toBe(6)
  })

  // --- Copping the Tech: if mine < enemy → copy enemy mine ---
  it('Copping the Tech: copies enemy mine level when lower', () => {
    const card = CARD_MAP['Copping the Tech']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', mineLevel: 2 })
    state.players[1] = makePlayer({ playerId: 'p2', mineLevel: 8 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mineLevel).toBe(8)
  })

  it('Copping the Tech: no change when mine >= enemy', () => {
    const card = CARD_MAP['Copping the Tech']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', mineLevel: 5 })
    state.players[1] = makePlayer({ playerId: 'p2', mineLevel: 3 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mineLevel).toBe(5)
  })

  // --- Phase Shift: swap walls ---
  it('Phase Shift: swaps walls between players', () => {
    const card = CARD_MAP['Phase Shift']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', wall: 15 })
    state.players[1] = makePlayer({ playerId: 'p2', wall: 3 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].wall).toBe(3)
    expect(result.players[1].wall).toBe(15)
  })

  // --- Thief: steal 5 mana ---
  it('Thief: steals 5 mana from enemy', () => {
    const card = CARD_MAP['Thief']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', mana: 10 })
    state.players[1] = makePlayer({ playerId: 'p2', mana: 8 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mana).toBe(15)
    expect(result.players[1].mana).toBe(3)
  })

  it('Thief: steals only what enemy has if less than 5', () => {
    const card = CARD_MAP['Thief']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', mana: 10 })
    state.players[1] = makePlayer({ playerId: 'p2', mana: 2 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mana).toBe(12)
    expect(result.players[1].mana).toBe(0)
  })

  // --- Tremors: both walls -5, play again ---
  it('Tremors: -5 to both walls, play again', () => {
    const card = CARD_MAP['Tremors']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', wall: 10 })
    state.players[1] = makePlayer({ playerId: 'p2', wall: 8 })
    const { state: result, playAgain } = executeEffects(state, 0, card.effects)
    expect(result.players[0].wall).toBe(5)
    expect(result.players[1].wall).toBe(3)
    expect(playAgain).toBe(true)
  })

  // --- Discord: -7 to ALL towers, -1 monastery all ---
  it('Discord: -7 all towers, -1 all monastery', () => {
    const card = CARD_MAP['Discord']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].tower).toBe(13) // 20-7
    expect(result.players[1].tower).toBe(13)
    expect(result.players[0].monasteryLevel).toBe(1) // 2-1, clamped to 1
    expect(result.players[1].monasteryLevel).toBe(1)
  })

  // --- Goblin Archers: 3 direct tower damage, 1 self damage ---
  it('Goblin Archers: 3 direct to enemy tower, 1 self damage', () => {
    const card = CARD_MAP['Goblin Archers']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[1].tower).toBe(17) // 20-3 direct
    expect(result.players[1].wall).toBe(5)   // wall untouched
    // Self damage: 1 absorbed by wall
    expect(result.players[0].wall).toBe(4)
    expect(result.players[0].tower).toBe(20)
  })

  // --- Spizzer: if enemy wall=0 → 10 damage, else 6 ---
  it('Spizzer: 10 damage when enemy wall = 0', () => {
    const card = CARD_MAP['Spizzer']
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', wall: 0 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[1].tower).toBe(10) // 20-10
  })

  it('Spizzer: 6 damage when enemy has wall', () => {
    const card = CARD_MAP['Spizzer']
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', wall: 3 })
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[1].wall).toBe(0)
    expect(result.players[1].tower).toBe(17) // 20 - (6-3)
  })

  // --- Unicorn: if monastery > enemy → 12, else 8 ---
  it('Unicorn: 12 damage when monastery > enemy', () => {
    const card = CARD_MAP['Unicorn']
    const state = makeState()
    state.players[0] = makePlayer({ playerId: 'p1', monasteryLevel: 5 })
    state.players[1] = makePlayer({ playerId: 'p2', monasteryLevel: 2 })
    const { state: result } = executeEffects(state, 0, card.effects)
    // 12 damage: 5 wall absorbed, 7 to tower
    expect(result.players[1].wall).toBe(0)
    expect(result.players[1].tower).toBe(13)
  })

  it('Unicorn: 8 damage when monastery <= enemy', () => {
    const card = CARD_MAP['Unicorn']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    // Equal monastery levels → 8 damage: 5 wall, 3 to tower
    expect(result.players[1].wall).toBe(0)
    expect(result.players[1].tower).toBe(17)
  })

  // --- Werewolf: 9 damage, if enemy wall=0 play again ---
  it('Werewolf: 9 damage + play again when enemy wall=0', () => {
    const card = CARD_MAP['Werewolf']
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', wall: 0 })
    const { state: result, playAgain } = executeEffects(state, 0, card.effects)
    expect(result.players[1].tower).toBe(11) // 20-9
    expect(playAgain).toBe(true)
  })

  it('Werewolf: 9 damage, play again when wall breaks to 0', () => {
    const card = CARD_MAP['Werewolf']
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', wall: 4 })
    const { state: result, playAgain } = executeEffects(state, 0, card.effects)
    // 9 damage: 4 wall, 5 to tower. Wall is now 0, so play again triggers
    expect(result.players[1].wall).toBe(0)
    expect(result.players[1].tower).toBe(15)
    expect(playAgain).toBe(true)
  })

  it('Werewolf: 9 damage, no play again when wall survives', () => {
    const card = CARD_MAP['Werewolf']
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', wall: 15 })
    const { state: result, playAgain } = executeEffects(state, 0, card.effects)
    // 9 damage fully absorbed by wall. Wall > 0, no play again
    expect(result.players[1].wall).toBe(6)
    expect(result.players[1].tower).toBe(20)
    expect(playAgain).toBe(false)
  })

  // --- Brick Shortage: all lose 8 ore ---
  it('Brick Shortage: all players lose 8 ore, clamped to 0', () => {
    const card = CARD_MAP['Brick Shortage']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].ore).toBe(0) // 5-8, clamped
    expect(result.players[1].ore).toBe(0)
  })

  // --- Prism: draw/discard + play again ---
  it('Prism: sets drawDiscard and playAgain flags', () => {
    const card = CARD_MAP['Prism']
    const state = makeState()
    const { playAgain, needsDrawDiscard } = executeEffects(state, 0, card.effects)
    expect(needsDrawDiscard).toBe(true)
    expect(playAgain).toBe(true)
  })

  // --- Elven Scout: same as Prism ---
  it('Elven Scout: sets drawDiscard and playAgain flags', () => {
    const card = CARD_MAP['Elven Scout']
    const state = makeState()
    const { playAgain, needsDrawDiscard } = executeEffects(state, 0, card.effects)
    expect(needsDrawDiscard).toBe(true)
    expect(playAgain).toBe(true)
  })

  // --- Lodestone: canDiscard = false ---
  it('Lodestone: canDiscard is false', () => {
    const card = CARD_MAP['Lodestone']
    expect(card.canDiscard).toBe(false)
  })

  it('Lodestone: +3 tower', () => {
    const card = CARD_MAP['Lodestone']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].tower).toBe(23)
  })

  // --- Earthquake: -1 mine to all ---
  it('Earthquake: -1 mine to all, clamped to MIN_LEVEL', () => {
    const card = CARD_MAP['Earthquake']
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].mineLevel).toBe(1) // 2-1
    expect(result.players[1].mineLevel).toBe(1)
  })

  // --- Dragon: 20 damage, -10 mana, -1 barracks to enemy ---
  it('Dragon: 20 damage, enemy loses 10 mana and 1 barracks', () => {
    const card = CARD_MAP['Dragon']
    const state = makeState()
    state.players[1] = makePlayer({ playerId: 'p2', wall: 5, mana: 15, barracksLevel: 3 })
    const { state: result } = executeEffects(state, 0, card.effects)
    // 20 damage: 5 wall, 15 to tower
    expect(result.players[1].wall).toBe(0)
    expect(result.players[1].tower).toBe(5)
    expect(result.players[1].mana).toBe(5) // 15-10
    expect(result.players[1].barracksLevel).toBe(2) // 3-1
  })

  // --- Dragon's Heart: +20 wall, +8 tower ---
  it("Dragon's Heart: +20 wall, +8 tower", () => {
    const card = CARD_MAP["Dragon's Heart"]
    const state = makeState()
    const { state: result } = executeEffects(state, 0, card.effects)
    expect(result.players[0].wall).toBe(25) // 5+20
    expect(result.players[0].tower).toBe(28) // 20+8
  })

  // --- Friendly Terrain: +1 wall, play again ---
  it('Friendly Terrain: +1 wall, play again', () => {
    const card = CARD_MAP['Friendly Terrain']
    const state = makeState()
    const { state: result, playAgain } = executeEffects(state, 0, card.effects)
    expect(result.players[0].wall).toBe(6)
    expect(playAgain).toBe(true)
  })
})

// ─── playCard (high-level) ──────────────────────────────────────

describe('playCard', () => {
  it('deducts cost, removes from hand, executes effects', () => {
    const state = makeState()
    state.players[0] = makePlayer({
      playerId: 'p1',
      ore: 10,
      hand: [cardInstance('Basic Wall')],
    })
    const { state: result } = playCard(state, 0, 'Basic Wall')
    expect(result.players[0].ore).toBe(8) // 10-2
    expect(result.players[0].wall).toBe(8) // 5+3
    expect(result.players[0].hand).toHaveLength(0)
  })

  it('throws when card not in hand', () => {
    const state = makeState()
    expect(() => playCard(state, 0, 'Basic Wall')).toThrow('Card not in hand')
  })

  it('throws when cannot afford card', () => {
    const state = makeState()
    state.players[0] = makePlayer({
      playerId: 'p1',
      ore: 0,
      hand: [cardInstance('Big Wall')],
    })
    expect(() => playCard(state, 0, 'Big Wall')).toThrow('Cannot afford card')
  })
})
