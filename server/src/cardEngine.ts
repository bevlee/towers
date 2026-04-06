import type {
  CardDefinition,
  CardEffect,
  ConditionCheck,
  GameState,
  PlayerState,
} from '@towers/shared'
import { CARD_MAP, MIN_LEVEL } from '@towers/shared'
import { applyDamage, applySelfDamage } from './damageResolver.js'

interface EffectResult {
  state: GameState
  playAgain: boolean
  needsDrawDiscard: boolean
}

/** Map card color to the resource it costs. */
const COLOR_RESOURCE = {
  red: 'ore',
  blue: 'mana',
  green: 'troops',
} as const

/**
 * Check if a player can afford to play a card.
 */
export function canPlayCard(player: PlayerState, card: CardDefinition): boolean {
  const resource = COLOR_RESOURCE[card.color]
  return player[resource] >= card.cost
}

/**
 * Deduct the card's cost from the appropriate resource. Returns a new PlayerState.
 */
export function deductCost(player: PlayerState, card: CardDefinition): PlayerState {
  const resource = COLOR_RESOURCE[card.color]
  return {
    ...player,
    [resource]: player[resource] - card.cost,
  }
}

/** Get the level property name for a source. */
function levelKey(source: 'mine' | 'monastery' | 'barracks'): keyof PlayerState {
  const map = {
    mine: 'mineLevel',
    monastery: 'monasteryLevel',
    barracks: 'barracksLevel',
  } as const
  return map[source]
}

/** Clamp a resource value to minimum 0. */
function clampResource(value: number): number {
  return Math.max(0, value)
}

/** Clamp a level value to minimum MIN_LEVEL. */
function clampLevel(value: number): number {
  return Math.max(MIN_LEVEL, value)
}

/** Get the opponent index. */
function opponentIndex(idx: 0 | 1): 0 | 1 {
  return idx === 0 ? 1 : 0
}

/**
 * Update a player in the game state tuple, returning a new GameState.
 */
function updatePlayer(state: GameState, idx: 0 | 1, player: PlayerState): GameState {
  const players: [PlayerState, PlayerState] = [...state.players]
  players[idx] = player
  return { ...state, players }
}

/**
 * Evaluate a condition against the current game state.
 */
function evaluateCondition(
  state: GameState,
  playerIndex: 0 | 1,
  condition: ConditionCheck,
): boolean {
  const self = state.players[playerIndex]
  const enemy = state.players[opponentIndex(playerIndex)]

  switch (condition.type) {
    case 'compare_levels': {
      const key = levelKey(condition.source) as 'mineLevel' | 'monasteryLevel' | 'barracksLevel'
      const selfLevel = self[key]
      const enemyLevel = enemy[key]
      switch (condition.comparison) {
        case 'lt':
          return selfLevel < enemyLevel
        case 'gt':
          return selfLevel > enemyLevel
        case 'eq':
          return selfLevel === enemyLevel
      }
      break
    }
    case 'wall_zero': {
      const target = condition.target === 'self' ? self : enemy
      return target.wall === 0
    }
  }
}

/**
 * Apply a wall or tower effect with target resolution.
 */
function applyStatEffect(
  state: GameState,
  playerIndex: 0 | 1,
  property: 'wall' | 'tower',
  amount: number,
  target: 'self' | 'enemy' | 'all',
): GameState {
  const selfIdx = playerIndex
  const enemyIdx = opponentIndex(playerIndex)

  const applyTo = (s: GameState, idx: 0 | 1): GameState => {
    const player = { ...s.players[idx] }
    player[property] = Math.max(0, player[property] + amount)
    return updatePlayer(s, idx, player)
  }

  switch (target) {
    case 'self':
      return applyTo(state, selfIdx)
    case 'enemy':
      return applyTo(state, enemyIdx)
    case 'all':
      return applyTo(applyTo(state, selfIdx), enemyIdx)
  }
}

/**
 * Apply a resource effect with target resolution.
 */
function applyResourceEffect(
  state: GameState,
  playerIndex: 0 | 1,
  resource: 'ore' | 'mana' | 'troops',
  amount: number,
  target: 'self' | 'enemy' | 'all',
): GameState {
  const selfIdx = playerIndex
  const enemyIdx = opponentIndex(playerIndex)

  const applyTo = (s: GameState, idx: 0 | 1): GameState => {
    const player = { ...s.players[idx] }
    player[resource] = clampResource(player[resource] + amount)
    return updatePlayer(s, idx, player)
  }

  switch (target) {
    case 'self':
      return applyTo(state, selfIdx)
    case 'enemy':
      return applyTo(state, enemyIdx)
    case 'all':
      return applyTo(applyTo(state, selfIdx), enemyIdx)
  }
}

/**
 * Apply a level effect with target resolution.
 */
function applyLevelEffect(
  state: GameState,
  playerIndex: 0 | 1,
  source: 'mine' | 'monastery' | 'barracks',
  amount: number,
  target: 'self' | 'enemy' | 'all',
): GameState {
  const selfIdx = playerIndex
  const enemyIdx = opponentIndex(playerIndex)
  const key = levelKey(source) as 'mineLevel' | 'monasteryLevel' | 'barracksLevel'

  const applyTo = (s: GameState, idx: 0 | 1): GameState => {
    const player = { ...s.players[idx] }
    player[key] = clampLevel(player[key] + amount)
    return updatePlayer(s, idx, player)
  }

  switch (target) {
    case 'self':
      return applyTo(state, selfIdx)
    case 'enemy':
      return applyTo(state, enemyIdx)
    case 'all':
      return applyTo(applyTo(state, selfIdx), enemyIdx)
  }
}

/**
 * Execute a list of card effects in sequence. Returns updated state and flags.
 */
export function executeEffects(
  state: GameState,
  playerIndex: 0 | 1,
  effects: CardEffect[],
): EffectResult {
  let current = state
  let playAgain = false
  let needsDrawDiscard = false

  for (const effect of effects) {
    switch (effect.type) {
      case 'wall':
        current = applyStatEffect(current, playerIndex, 'wall', effect.amount, effect.target)
        break

      case 'tower':
        current = applyStatEffect(current, playerIndex, 'tower', effect.amount, effect.target)
        break

      case 'damage': {
        const enemyIdx = opponentIndex(playerIndex)
        const damaged = applyDamage(current.players[enemyIdx], effect.amount, effect.direct)
        current = updatePlayer(current, enemyIdx, damaged)
        break
      }

      case 'resource':
        current = applyResourceEffect(
          current,
          playerIndex,
          effect.resource,
          effect.amount,
          effect.target,
        )
        break

      case 'level':
        current = applyLevelEffect(
          current,
          playerIndex,
          effect.source,
          effect.amount,
          effect.target,
        )
        break

      case 'selfDamage': {
        const selfDamaged = applySelfDamage(current.players[playerIndex], effect.amount)
        current = updatePlayer(current, playerIndex, selfDamaged)
        break
      }

      case 'playAgain':
        playAgain = true
        break

      case 'conditional': {
        const condResult = evaluateCondition(current, playerIndex, effect.condition)
        const branchEffects = condResult ? effect.ifTrue : effect.ifFalse
        const branchResult = executeEffects(current, playerIndex, branchEffects)
        current = branchResult.state
        if (branchResult.playAgain) playAgain = true
        if (branchResult.needsDrawDiscard) needsDrawDiscard = true
        break
      }

      case 'swap': {
        const selfIdx = playerIndex
        const enemyIdx = opponentIndex(playerIndex)
        const selfPlayer = { ...current.players[selfIdx] }
        const enemyPlayer = { ...current.players[enemyIdx] }
        const temp = selfPlayer[effect.property]
        selfPlayer[effect.property] = enemyPlayer[effect.property]
        enemyPlayer[effect.property] = temp
        current = updatePlayer(current, selfIdx, selfPlayer)
        current = updatePlayer(current, enemyIdx, enemyPlayer)
        break
      }

      case 'steal': {
        const enemyIdx = opponentIndex(playerIndex)
        const enemy = current.players[enemyIdx]
        const stolen = Math.min(effect.amount, enemy[effect.resource])
        const updatedEnemy = { ...enemy, [effect.resource]: enemy[effect.resource] - stolen }
        const self = current.players[playerIndex]
        const updatedSelf = { ...self, [effect.resource]: self[effect.resource] + stolen }
        current = updatePlayer(current, enemyIdx, updatedEnemy)
        current = updatePlayer(current, playerIndex, updatedSelf)
        break
      }

      case 'drawDiscard':
        needsDrawDiscard = true
        break

      case 'copyLevel': {
        const key = levelKey(effect.source) as 'mineLevel' | 'monasteryLevel' | 'barracksLevel'
        const enemyLevel = current.players[opponentIndex(playerIndex)][key]
        const selfPlayer = { ...current.players[playerIndex] }
        selfPlayer[key] = enemyLevel
        current = updatePlayer(current, playerIndex, selfPlayer)
        break
      }
    }
  }

  return { state: current, playAgain, needsDrawDiscard }
}

/**
 * High-level function: look up card, validate playable, deduct cost,
 * execute effects, remove card from hand. Returns updated state and flags.
 *
 * @throws Error if card not found, not in hand, or not affordable.
 */
export function playCard(
  state: GameState,
  playerIndex: 0 | 1,
  cardName: string,
): EffectResult {
  const cardDef = CARD_MAP[cardName]
  if (!cardDef) {
    throw new Error(`Card not found: ${cardName}`)
  }

  const player = state.players[playerIndex]

  const cardIdx = player.hand.findIndex((c) => c.cardName === cardName)
  if (cardIdx === -1) {
    throw new Error(`Card not in hand: ${cardName}`)
  }

  if (!canPlayCard(player, cardDef)) {
    throw new Error(`Cannot afford card: ${cardName}`)
  }

  // Deduct cost
  const afterCost = deductCost(player, cardDef)

  // Remove card from hand and add to discard pile
  const playedCard = afterCost.hand[cardIdx]
  const newHand = [...afterCost.hand]
  newHand.splice(cardIdx, 1)
  const updatedPlayer = { ...afterCost, hand: newHand }

  let updatedState = updatePlayer(state, playerIndex, updatedPlayer)
  updatedState = { ...updatedState, discardPile: [...updatedState.discardPile, playedCard] }

  // Execute effects
  return executeEffects(updatedState, playerIndex, cardDef.effects)
}
