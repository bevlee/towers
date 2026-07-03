import { describe, it, expect } from 'vitest'
import { applyAction, legalActions } from '../bot/simulate.js'
import { cardInstance, makePlayer, makeState } from './botHelpers.js'

/** A deck of filler cards to draw from during simulations. */
function fillerDeck(n: number) {
  return Array.from({ length: n }, (_, i) => cardInstance('Basic Wall', 100 + i))
}

describe('legalActions', () => {
  it('offers play for affordable cards and discard for discardable ones', () => {
    const state = makeState({
      players: [
        makePlayer({ playerId: 'p1', mana: 5, hand: [cardInstance('Quartz')] }),
        makePlayer({ playerId: 'p2' }),
      ],
    })
    const actions = legalActions(state, 0)
    expect(actions).toContainEqual({ type: 'play', cardName: 'Quartz' })
    expect(actions).toContainEqual({ type: 'discard', cardName: 'Quartz' })
  })

  it('does not offer play for unaffordable cards', () => {
    const state = makeState({
      players: [
        makePlayer({ playerId: 'p1', mana: 3, hand: [cardInstance('Sapphire')] }), // cost 10
        makePlayer({ playerId: 'p2' }),
      ],
    })
    const actions = legalActions(state, 0)
    expect(actions).not.toContainEqual({ type: 'play', cardName: 'Sapphire' })
    expect(actions).toContainEqual({ type: 'discard', cardName: 'Sapphire' })
  })

  it('never offers discarding Lodestone', () => {
    const state = makeState({
      players: [
        makePlayer({ playerId: 'p1', mana: 0, hand: [cardInstance('Lodestone')] }),
        makePlayer({ playerId: 'p2' }),
      ],
    })
    const actions = legalActions(state, 0)
    expect(actions).not.toContainEqual({ type: 'discard', cardName: 'Lodestone' })
  })

  it('dedupes duplicate card names', () => {
    const state = makeState({
      players: [
        makePlayer({
          playerId: 'p1',
          ore: 10,
          hand: [cardInstance('Basic Wall', 0), cardInstance('Basic Wall', 1)],
        }),
        makePlayer({ playerId: 'p2' }),
      ],
    })
    const plays = legalActions(state, 0).filter((a) => a.type === 'play')
    expect(plays).toHaveLength(1)
  })
})

describe('applyAction', () => {
  it('plays a normal card: draws a replacement, switches turn, generates resources', () => {
    const hand = [cardInstance('Basic Wall'), ...[1, 2, 3, 4, 5].map((i) => cardInstance('Ruby', i))]
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'p1', ore: 10, hand }),
        makePlayer({ playerId: 'p2', ore: 5, mineLevel: 2 }),
      ],
    })

    const result = applyAction(state, { type: 'play', cardName: 'Basic Wall' })

    expect(result.samePlayer).toBe(false)
    expect(result.terminal).toBe(false)
    expect(result.state.currentPlayerIndex).toBe(1)
    expect(result.state.players[0].hand).toHaveLength(6)
    expect(result.state.players[0].wall).toBe(5 + 3)
    // Opponent generated resources at the start of their turn
    expect(result.state.players[1].ore).toBe(5 + 2)
  })

  it('keeps the turn on a play-again card', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'p1', mana: 5, hand: [cardInstance('Quartz')] }),
        makePlayer({ playerId: 'p2', ore: 5 }),
      ],
    })

    const result = applyAction(state, { type: 'play', cardName: 'Quartz' })

    expect(result.samePlayer).toBe(true)
    expect(result.state.currentPlayerIndex).toBe(0)
    expect(result.state.players[0].hand).toHaveLength(1)
    // No resource generation for anyone on play-again
    expect(result.state.players[1].ore).toBe(5)
  })

  it('resolves a draw-discard card inline and keeps the turn', () => {
    const hand = [cardInstance('Prism'), ...[1, 2, 3, 4, 5].map((i) => cardInstance('Ruby', i))]
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'p1', mana: 5, hand }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    const result = applyAction(state, { type: 'play', cardName: 'Prism' })

    expect(result.samePlayer).toBe(true)
    expect(result.state.currentPlayerIndex).toBe(0)
    // played Prism, drew, auto-discarded one, drew replacement → back to 6
    expect(result.state.players[0].hand).toHaveLength(6)
    // Prism + the auto-discarded card
    expect(result.state.discardPile).toHaveLength(2)
  })

  it('marks a winning play as terminal', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'p1', mana: 5, hand: [cardInstance('Gemstone Flaw')] }),
        makePlayer({ playerId: 'p2', tower: 3 }),
      ],
    })

    const result = applyAction(state, { type: 'play', cardName: 'Gemstone Flaw' })

    expect(result.terminal).toBe(true)
    expect(result.state.phase).toBe('finished')
    expect(result.state.winner).toBe('p1')
  })

  it('discards: removes the card, draws, switches turn, generates resources', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({ playerId: 'p1', hand: [cardInstance('Sapphire')] }),
        makePlayer({ playerId: 'p2', troops: 5, barracksLevel: 2 }),
      ],
    })

    const result = applyAction(state, { type: 'discard', cardName: 'Sapphire' })

    expect(result.samePlayer).toBe(false)
    expect(result.state.currentPlayerIndex).toBe(1)
    expect(result.state.players[0].hand.map((c) => c.cardName)).not.toContain('Sapphire')
    expect(result.state.players[0].hand).toHaveLength(1)
    expect(result.state.players[1].troops).toBe(5 + 2)
  })
})
