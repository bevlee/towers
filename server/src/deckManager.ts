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
 * Returns the drawn card (or null if deck is empty) and the remaining deck.
 */
export function drawCard(deck: CardInstance[]): {
  card: CardInstance | null
  remainingDeck: CardInstance[]
} {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] }
  }

  const [card, ...remainingDeck] = deck
  return { card, remainingDeck }
}
