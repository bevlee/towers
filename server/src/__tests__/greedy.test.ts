import { describe, it, expect } from 'vitest'
import { chooseGreedyAction } from '../bot/greedy.js'
import { cardInstance, makePlayer, makeState } from './botHelpers.js'

function fillerDeck(n: number) {
  return Array.from({ length: n }, (_, i) => cardInstance('Basic Wall', 100 + i))
}

describe('chooseGreedyAction', () => {
  it('takes a lethal play when available', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({
          playerId: 'p1',
          mana: 20,
          hand: [cardInstance('Gemstone Flaw'), cardInstance('Ruby'), cardInstance('Amethyst')],
        }),
        makePlayer({ playerId: 'p2', tower: 3, wall: 20 }),
      ],
    })

    expect(chooseGreedyAction(state, 0)).toEqual({ type: 'play', cardName: 'Gemstone Flaw' })
  })

  it('takes a tower-build win when available', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({
          playerId: 'p1',
          tower: 45,
          mana: 20,
          hand: [cardInstance('Ruby'), cardInstance('Amethyst')],
        }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    expect(chooseGreedyAction(state, 0)).toEqual({ type: 'play', cardName: 'Ruby' })
  })

  it('prefers the stronger of two affordable builds', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({
          playerId: 'p1',
          mana: 20,
          hand: [cardInstance('Ruby'), cardInstance('Amethyst')], // +5 tower vs +3 tower
        }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    expect(chooseGreedyAction(state, 0)).toEqual({ type: 'play', cardName: 'Ruby' })
  })

  it('discards when nothing is affordable', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({
          playerId: 'p1',
          ore: 0,
          mana: 3,
          troops: 0,
          hand: [cardInstance('Sapphire'), cardInstance('Diamond')], // costs 10 and 15
        }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    const action = chooseGreedyAction(state, 0)
    expect(action?.type).toBe('discard')
  })

  it('never discards Lodestone', () => {
    const state = makeState({
      deck: fillerDeck(10),
      players: [
        makePlayer({
          playerId: 'p1',
          ore: 0,
          mana: 0,
          troops: 0,
          hand: [cardInstance('Lodestone'), cardInstance('Sapphire')],
        }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    expect(chooseGreedyAction(state, 0)).toEqual({ type: 'discard', cardName: 'Sapphire' })
  })

  it('returns null when no action is legal', () => {
    const state = makeState({
      players: [
        makePlayer({ playerId: 'p1', mana: 0, hand: [cardInstance('Lodestone')] }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    expect(chooseGreedyAction(state, 0)).toBeNull()
  })
})
