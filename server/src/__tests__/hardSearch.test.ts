import { describe, it, expect } from 'vitest'
import { chooseHardAction } from '../bot/hardSearch.js'
import { cardInstance, makePlayer, makeState } from './botHelpers.js'

function fillerDeck(n: number) {
  return Array.from({ length: n }, (_, i) => cardInstance('Basic Wall', 100 + i))
}

describe('chooseHardAction', () => {
  it('returns a legal action', async () => {
    const hand = [
      cardInstance('Ruby'),
      cardInstance('Basic Wall'),
      cardInstance('Orc'),
      cardInstance('Miners'),
      cardInstance('Amethyst'),
      cardInstance('Ogre'),
    ]
    const state = makeState({
      deck: fillerDeck(20),
      players: [
        makePlayer({ playerId: 'p1', ore: 8, mana: 8, troops: 8, hand }),
        makePlayer({ playerId: 'p2', hand: fillerDeck(6) }),
      ],
    })

    const action = await chooseHardAction(state, 0, { budgetMs: 150 })
    expect(action).not.toBeNull()
    const handNames = hand.map((c) => c.cardName)
    expect(handNames).toContain(action!.cardName)
  })

  it('finds an immediate lethal play', async () => {
    const hand = [
      cardInstance('Gemstone Flaw'), // 3 direct damage — lethal vs tower 3
      cardInstance('Ruby'),
      cardInstance('Basic Wall'),
      cardInstance('Miners'),
      cardInstance('Amethyst'),
      cardInstance('Orc'),
    ]
    const state = makeState({
      deck: fillerDeck(20),
      players: [
        makePlayer({ playerId: 'p1', ore: 8, mana: 8, troops: 8, hand }),
        makePlayer({ playerId: 'p2', tower: 3, wall: 30, hand: fillerDeck(6) }),
      ],
    })

    const action = await chooseHardAction(state, 0, { budgetMs: 300 })
    expect(action).toEqual({ type: 'play', cardName: 'Gemstone Flaw' })
  })

  it('finds a two-step lethal chain that greedy misses', async () => {
    // Bot tower 44: Ruby alone reaches 49 (no win), so greedy plays Ruby.
    // Quartz (+1 tower, play again) into Ruby reaches 50 and wins this turn —
    // certain in every sampled world, so the search must override greedy.
    const hand = [
      cardInstance('Quartz'),
      cardInstance('Ruby'),
      cardInstance('Basic Wall'),
      cardInstance('Orc'),
    ]
    const state = makeState({
      deck: fillerDeck(20),
      players: [
        makePlayer({ playerId: 'p1', tower: 44, ore: 8, mana: 10, troops: 8, hand }),
        makePlayer({ playerId: 'p2', hand: fillerDeck(6) }),
      ],
    })

    const action = await chooseHardAction(state, 0, { budgetMs: 500 })
    expect(action).toEqual({ type: 'play', cardName: 'Quartz' })
  })

  it('terminates on play-again cards when no win exists', async () => {
    // Regression: with the chain search's drawless state, draws reshuffle the
    // discard pile — the played Quartz must not come back and loop forever.
    const state = makeState({
      deck: fillerDeck(20),
      players: [
        makePlayer({ playerId: 'p1', mana: 10, hand: [cardInstance('Quartz'), cardInstance('Ruby')] }),
        makePlayer({ playerId: 'p2' }),
      ],
    })

    const action = await chooseHardAction(state, 0, { budgetMs: 200 })
    expect(action).not.toBeNull()
  })

  it('respects the time budget', async () => {
    const state = makeState({
      deck: fillerDeck(20),
      players: [
        makePlayer({ playerId: 'p1', ore: 8, mana: 8, troops: 8, hand: fillerDeck(6) }),
        makePlayer({ playerId: 'p2', hand: fillerDeck(6) }),
      ],
    })

    const start = Date.now()
    await chooseHardAction(state, 0, { budgetMs: 200 })
    expect(Date.now() - start).toBeLessThan(1500)
  })

  it('returns null when no action is legal', async () => {
    const state = makeState({
      players: [
        makePlayer({ playerId: 'p1', mana: 0, hand: [cardInstance('Lodestone')] }),
        makePlayer({ playerId: 'p2', hand: fillerDeck(6) }),
      ],
    })

    expect(await chooseHardAction(state, 0, { budgetMs: 100 })).toBeNull()
  })
})
