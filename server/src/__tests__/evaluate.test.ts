import { describe, it, expect } from 'vitest'
import { evaluateState, WIN_SCORE } from '../bot/evaluate.js'
import { makePlayer, makeState } from './botHelpers.js'

describe('evaluateState', () => {
  it('scores a symmetric state as zero', () => {
    const state = makeState()
    expect(evaluateState(state, 0)).toBe(0)
    expect(evaluateState(state, 1)).toBe(0)
  })

  it('is antisymmetric between the two players', () => {
    const state = makeState({
      players: [
        makePlayer({ playerId: 'p1', tower: 30, wall: 12, mineLevel: 4 }),
        makePlayer({ playerId: 'p2', tower: 15, ore: 40 }),
      ],
    })
    expect(evaluateState(state, 0)).toBeCloseTo(-evaluateState(state, 1))
  })

  it('prefers a higher own tower', () => {
    const low = makeState({
      players: [makePlayer({ playerId: 'p1', tower: 10 }), makePlayer({ playerId: 'p2' })],
    })
    const high = makeState({
      players: [makePlayer({ playerId: 'p1', tower: 30 }), makePlayer({ playerId: 'p2' })],
    })
    expect(evaluateState(high, 0)).toBeGreaterThan(evaluateState(low, 0))
  })

  it('prefers higher source levels (income)', () => {
    const low = makeState()
    const high = makeState({
      players: [makePlayer({ playerId: 'p1', mineLevel: 4 }), makePlayer({ playerId: 'p2' })],
    })
    expect(evaluateState(high, 0)).toBeGreaterThan(evaluateState(low, 0))
  })

  it('values income (a level) above a small resource stockpile', () => {
    const extraLevel = makeState({
      players: [makePlayer({ playerId: 'p1', mineLevel: 3 }), makePlayer({ playerId: 'p2' })],
    })
    const extraOre = makeState({
      players: [makePlayer({ playerId: 'p1', ore: 10 }), makePlayer({ playerId: 'p2' })],
    })
    expect(evaluateState(extraLevel, 0)).toBeGreaterThan(evaluateState(extraOre, 0))
  })

  it('scores a won state at WIN_SCORE', () => {
    const state = makeState({
      players: [makePlayer({ playerId: 'p1', tower: 50 }), makePlayer({ playerId: 'p2' })],
    })
    expect(evaluateState(state, 0)).toBe(WIN_SCORE)
    expect(evaluateState(state, 1)).toBe(-WIN_SCORE)
  })

  it('scores a lost state at -WIN_SCORE', () => {
    const state = makeState({
      players: [makePlayer({ playerId: 'p1', tower: 0 }), makePlayer({ playerId: 'p2' })],
    })
    expect(evaluateState(state, 0)).toBe(-WIN_SCORE)
  })
})
