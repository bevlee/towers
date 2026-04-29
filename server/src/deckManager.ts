import type { CardInstance } from '@towers/shared'
import { ALL_CARDS } from '@towers/shared'

/**
 * Build a full deck of CardInstances from all card definitions.
 * Each CardDefinition with N copies produces N instances with unique IDs.
 */
export function buildDeck(): CardInstance[] {
  const deck: CardInstance[] = []

  for (const def of ALL_CARDS) {
    for (let i = 0; i < def.copies; i++) {
      deck.push({
        id: `${def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
        cardName: def.name,
      })
    }
  }

  return deck
}

/**
 * Fisher-Yates shuffle. Returns a new array — does not mutate the input.
 */
export function shuffleDeck(deck: CardInstance[]): CardInstance[] {
  const shuffled = [...deck]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }

  return shuffled
}

/** Hash a string to a 32-bit integer for use as a PRNG seed. */
function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return h
}

/**
 * Deterministic Fisher-Yates shuffle using mulberry32 PRNG.
 * Same seed always produces the same card order.
 */
export function seededShuffleDeck(deck: CardInstance[], seed: string): CardInstance[] {
  const shuffled = [...deck]

  let s = hashSeed(seed) | 0
  function rand(): number {
    s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }

  return shuffled
}

/**
 * Deal alternating cards to two hands from the top of the deck.
 * Returns the two hands and the remaining deck.
 */
export function dealHands(
  deck: CardInstance[],
  handSize: number,
): { hands: [CardInstance[], CardInstance[]]; remainingDeck: CardInstance[] } {
  const hand0: CardInstance[] = []
  const hand1: CardInstance[] = []
  const remaining = [...deck]

  for (let i = 0; i < handSize * 2; i++) {
    const card = remaining.shift()
    if (!card) break

    if (i % 2 === 0) {
      hand0.push(card)
    } else {
      hand1.push(card)
    }
  }

  return {
    hands: [hand0, hand1],
    remainingDeck: remaining,
  }
}

/**
 * Draw the top card from the deck.
 * If the deck is empty, shuffles the discard pile into a new deck first.
 * Returns the drawn card (or null if both are empty), remaining deck, and remaining discard pile.
 */
export function drawCard(
  deck: CardInstance[],
  discardPile: CardInstance[] = [],
): {
  card: CardInstance | null
  remainingDeck: CardInstance[]
  remainingDiscardPile: CardInstance[]
} {
  // If deck is empty, reshuffle discard pile into deck
  if (deck.length === 0) {
    if (discardPile.length === 0) {
      return { card: null, remainingDeck: [], remainingDiscardPile: [] }
    }
    deck = shuffleDeck(discardPile)
    discardPile = []
  }

  const [card, ...remainingDeck] = deck
  return { card, remainingDeck, remainingDiscardPile: discardPile }
}
