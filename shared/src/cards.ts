import type { CardDefinition } from './types.js'

// ============================================================
// RED CARDS (Ore / Mine / Walls)
// ============================================================

const redCards: CardDefinition[] = [
  {
    name: 'Strip Mine',
    cost: 0,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'level', source: 'mine', amount: -1, target: 'self' },
      { type: 'wall', amount: 10, target: 'self' },
      { type: 'resource', resource: 'mana', amount: 5, target: 'self' },
    ],
  },
  {
    name: 'Lucky Cache',
    cost: 0,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'resource', resource: 'ore', amount: 2, target: 'self' },
      { type: 'resource', resource: 'mana', amount: 2, target: 'self' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Brick Shortage',
    cost: 0,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'resource', resource: 'ore', amount: -8, target: 'all' },
    ],
  },
  {
    name: 'Earthquake',
    cost: 0,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'level', source: 'mine', amount: -1, target: 'all' },
    ],
  },
  {
    name: 'Friendly Terrain',
    cost: 1,
    copies: 2,
    color: 'red',
    effects: [
      { type: 'wall', amount: 1, target: 'self' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Work Overtime',
    cost: 2,
    copies: 2,
    color: 'red',
    effects: [
      { type: 'wall', amount: 5, target: 'self' },
      { type: 'resource', resource: 'mana', amount: -6, target: 'self' },
    ],
  },
  {
    name: 'Basic Wall',
    cost: 2,
    copies: 2,
    color: 'red',
    effects: [
      { type: 'wall', amount: 3, target: 'self' },
    ],
  },
  {
    name: 'Innovations',
    cost: 2,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'level', source: 'mine', amount: 1, target: 'all' },
      { type: 'resource', resource: 'mana', amount: 4, target: 'self' },
    ],
  },
  {
    name: 'Sturdy Wall',
    cost: 3,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 4, target: 'self' },
    ],
  },
  {
    name: 'Foundations',
    cost: 3,
    copies: 2,
    color: 'red',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'wall_zero', target: 'self' },
        ifTrue: [{ type: 'wall', amount: 6, target: 'self' }],
        ifFalse: [{ type: 'wall', amount: 3, target: 'self' }],
      },
    ],
  },
  {
    name: 'Miners',
    cost: 3,
    copies: 2,
    color: 'red',
    effects: [
      { type: 'level', source: 'mine', amount: 1, target: 'self' },
    ],
  },
  {
    name: 'Collapse!',
    cost: 4,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'level', source: 'mine', amount: -1, target: 'enemy' },
    ],
  },
  {
    name: 'Mother Lode',
    cost: 4,
    copies: 1,
    color: 'red',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'compare_levels', source: 'mine', comparison: 'lt' },
        ifTrue: [{ type: 'level', source: 'mine', amount: 2, target: 'self' }],
        ifFalse: [{ type: 'level', source: 'mine', amount: 1, target: 'self' }],
      },
    ],
  },
  {
    name: 'Copping the Tech',
    cost: 5,
    copies: 1,
    color: 'red',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'compare_levels', source: 'mine', comparison: 'lt' },
        ifTrue: [{ type: 'copyLevel', source: 'mine' }],
        ifFalse: [],
      },
    ],
  },
  {
    name: 'Big Wall',
    cost: 5,
    copies: 2,
    color: 'red',
    effects: [
      { type: 'wall', amount: 6, target: 'self' },
    ],
  },
  {
    name: 'New Equipment',
    cost: 6,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'level', source: 'mine', amount: 2, target: 'self' },
    ],
  },
  {
    name: 'Dwarven Miners',
    cost: 7,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 4, target: 'self' },
      { type: 'level', source: 'mine', amount: 1, target: 'self' },
    ],
  },
  {
    name: 'Forced Labor',
    cost: 7,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 9, target: 'self' },
      { type: 'resource', resource: 'troops', amount: -5, target: 'self' },
    ],
  },
  {
    name: 'Tremors',
    cost: 7,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: -5, target: 'all' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Reinforced Wall',
    cost: 8,
    copies: 2,
    color: 'red',
    effects: [
      { type: 'wall', amount: 8, target: 'self' },
    ],
  },
  {
    name: 'Secret Room',
    cost: 8,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'level', source: 'monastery', amount: 1, target: 'self' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Crystal Rocks',
    cost: 9,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 7, target: 'self' },
      { type: 'resource', resource: 'mana', amount: 7, target: 'self' },
    ],
  },
  {
    name: 'Portcullis',
    cost: 9,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 5, target: 'self' },
      { type: 'level', source: 'barracks', amount: 1, target: 'self' },
    ],
  },
  {
    name: 'Harmonic Ore',
    cost: 11,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 6, target: 'self' },
      { type: 'tower', amount: 3, target: 'self' },
    ],
  },
  {
    name: 'Mondo Wall',
    cost: 13,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 12, target: 'self' },
    ],
  },
  {
    name: 'Focused Designs',
    cost: 15,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 8, target: 'self' },
      { type: 'tower', amount: 5, target: 'self' },
    ],
  },
  {
    name: 'Great Wall',
    cost: 16,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 15, target: 'self' },
    ],
  },
  {
    name: 'Phase Shift',
    cost: 17,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'swap', property: 'wall' },
    ],
  },
  {
    name: 'Rock Launcher',
    cost: 18,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 6, target: 'self' },
      { type: 'damage', amount: 10, direct: false },
    ],
  },
  {
    name: "Dragon's Heart",
    cost: 24,
    copies: 1,
    color: 'red',
    effects: [
      { type: 'wall', amount: 20, target: 'self' },
      { type: 'tower', amount: 8, target: 'self' },
    ],
  },
]

// ============================================================
// BLUE CARDS (Mana / Monastery / Towers)
// ============================================================

const blueCards: CardDefinition[] = [
  {
    name: 'Quartz',
    cost: 1,
    copies: 2,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 1, target: 'self' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Gemstone Flaw',
    cost: 2,
    copies: 2,
    color: 'blue',
    effects: [
      { type: 'damage', amount: 3, direct: true },
    ],
  },
  {
    name: 'Prism',
    cost: 2,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'drawDiscard' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Amethyst',
    cost: 2,
    copies: 2,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 3, target: 'self' },
    ],
  },
  {
    name: 'Smoky Quartz',
    cost: 2,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'damage', amount: 1, direct: true },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Power Burn',
    cost: 3,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: -5, target: 'self' },
      { type: 'level', source: 'monastery', amount: 2, target: 'self' },
    ],
  },
  {
    name: 'Spell Weavers',
    cost: 3,
    copies: 2,
    color: 'blue',
    effects: [
      { type: 'level', source: 'monastery', amount: 1, target: 'self' },
    ],
  },
  {
    name: 'Ruby',
    cost: 3,
    copies: 2,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 5, target: 'self' },
    ],
  },
  {
    name: "Quarry's Help",
    cost: 4,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 7, target: 'self' },
      { type: 'resource', resource: 'ore', amount: -10, target: 'self' },
    ],
  },
  {
    name: 'Gem Spear',
    cost: 4,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'damage', amount: 5, direct: true },
    ],
  },
  {
    name: 'Solar Flare',
    cost: 4,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 2, target: 'self' },
      { type: 'damage', amount: 2, direct: true },
    ],
  },
  {
    name: 'Discord',
    cost: 5,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: -7, target: 'all' },
      { type: 'level', source: 'monastery', amount: -1, target: 'all' },
    ],
  },
  {
    name: 'Lodestone',
    cost: 5,
    copies: 1,
    color: 'blue',
    canDiscard: false,
    effects: [
      { type: 'tower', amount: 3, target: 'self' },
    ],
  },
  {
    name: 'Emerald',
    cost: 6,
    copies: 2,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 8, target: 'self' },
    ],
  },
  {
    name: 'Crystal Matrix',
    cost: 6,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'level', source: 'monastery', amount: 1, target: 'self' },
      { type: 'tower', amount: 3, target: 'self' },
      { type: 'tower', amount: 1, target: 'enemy' },
    ],
  },
  {
    name: 'Harmonic Vibe',
    cost: 7,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 5, target: 'self' },
      { type: 'tower', amount: 1, target: 'enemy' },
    ],
  },
  {
    name: 'Magic Drain',
    cost: 8,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'resource', resource: 'mana', amount: -8, target: 'enemy' },
    ],
  },
  {
    name: 'Sapphire',
    cost: 10,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 11, target: 'self' },
    ],
  },
  {
    name: 'Crystallize',
    cost: 8,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 11, target: 'self' },
      { type: 'wall', amount: -6, target: 'self' },
    ],
  },
  {
    name: 'Thief',
    cost: 10,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'steal', resource: 'mana', amount: 5 },
    ],
  },
  {
    name: 'Magic Vault',
    cost: 11,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'level', source: 'monastery', amount: 1, target: 'self' },
      { type: 'tower', amount: 6, target: 'self' },
    ],
  },
  {
    name: 'Succubus',
    cost: 14,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'damage', amount: 5, direct: true },
      { type: 'resource', resource: 'troops', amount: -8, target: 'enemy' },
    ],
  },
  {
    name: 'Diamond',
    cost: 15,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 15, target: 'self' },
    ],
  },
  {
    name: 'Tower Surge',
    cost: 18,
    copies: 1,
    color: 'blue',
    effects: [
      { type: 'tower', amount: 20, target: 'self' },
    ],
  },
]

// ============================================================
// GREEN CARDS (Troops / Barracks / Damage)
// ============================================================

const greenCards: CardDefinition[] = [
  {
    name: 'Full Moon',
    cost: 0,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'level', source: 'barracks', amount: 1, target: 'all' },
      { type: 'resource', resource: 'troops', amount: 3, target: 'self' },
    ],
  },
  {
    name: 'Mad Cow Disease',
    cost: 0,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'resource', resource: 'troops', amount: -6, target: 'all' },
    ],
  },
  {
    name: 'Moody Goblins',
    cost: 1,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'damage', amount: 4, direct: false },
      { type: 'resource', resource: 'mana', amount: -3, target: 'self' },
    ],
  },
  {
    name: 'Faery',
    cost: 1,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'damage', amount: 2, direct: false },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Elven Scout',
    cost: 2,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'drawDiscard' },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Goblin Mob',
    cost: 3,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'damage', amount: 6, direct: false },
      { type: 'selfDamage', amount: 3 },
    ],
  },
  {
    name: 'Husbandry',
    cost: 3,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'level', source: 'barracks', amount: 1, target: 'self' },
    ],
  },
  {
    name: 'Orc',
    cost: 3,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'damage', amount: 5, direct: false },
    ],
  },
  {
    name: 'Goblin Archers',
    cost: 4,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 3, direct: true },
      { type: 'selfDamage', amount: 1 },
    ],
  },
  {
    name: 'Slasher',
    cost: 5,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 6, direct: false },
    ],
  },
  {
    name: 'Dwarves',
    cost: 5,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'damage', amount: 4, direct: false },
      { type: 'wall', amount: 3, target: 'self' },
    ],
  },
  {
    name: 'Imp',
    cost: 5,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 6, direct: false },
      { type: 'resource', resource: 'ore', amount: -5, target: 'all' },
      { type: 'resource', resource: 'mana', amount: -5, target: 'all' },
      { type: 'resource', resource: 'troops', amount: -5, target: 'all' },
    ],
  },
  {
    name: 'Ogre',
    cost: 6,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'damage', amount: 7, direct: false },
    ],
  },
  {
    name: 'Little Snakes',
    cost: 6,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 4, direct: true },
    ],
  },
  {
    name: 'Rapid Sheep',
    cost: 6,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 6, direct: false },
      { type: 'resource', resource: 'troops', amount: -3, target: 'enemy' },
    ],
  },
  {
    name: 'Shadow Faerie',
    cost: 6,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 2, direct: true },
      { type: 'playAgain' },
    ],
  },
  {
    name: 'Troll Keeper',
    cost: 7,
    copies: 2,
    color: 'green',
    effects: [
      { type: 'level', source: 'barracks', amount: 2, target: 'self' },
    ],
  },
  {
    name: 'Spizzer',
    cost: 8,
    copies: 1,
    color: 'green',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'wall_zero', target: 'enemy' },
        ifTrue: [{ type: 'damage', amount: 10, direct: false }],
        ifFalse: [{ type: 'damage', amount: 6, direct: false }],
      },
    ],
  },
  {
    name: 'Tower Gremlin',
    cost: 8,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 2, direct: false },
      { type: 'wall', amount: 4, target: 'self' },
      { type: 'tower', amount: 2, target: 'self' },
    ],
  },
  {
    name: 'Unicorn',
    cost: 9,
    copies: 1,
    color: 'green',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'compare_levels', source: 'monastery', comparison: 'gt' },
        ifTrue: [{ type: 'damage', amount: 12, direct: false }],
        ifFalse: [{ type: 'damage', amount: 8, direct: false }],
      },
    ],
  },
  {
    name: 'Werewolf',
    cost: 9,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 9, direct: false },
      {
        type: 'conditional',
        condition: { type: 'wall_zero', target: 'enemy' },
        ifTrue: [{ type: 'playAgain' }],
        ifFalse: [],
      },
    ],
  },
  {
    name: 'Stone Giant',
    cost: 15,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 10, direct: false },
      { type: 'wall', amount: 4, target: 'self' },
    ],
  },
  {
    name: 'Vampire',
    cost: 17,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 10, direct: false },
      { type: 'resource', resource: 'troops', amount: -5, target: 'enemy' },
      { type: 'level', source: 'barracks', amount: -1, target: 'enemy' },
    ],
  },
  {
    name: 'Dragon',
    cost: 25,
    copies: 1,
    color: 'green',
    effects: [
      { type: 'damage', amount: 20, direct: false },
      { type: 'resource', resource: 'mana', amount: -10, target: 'enemy' },
      { type: 'level', source: 'barracks', amount: -1, target: 'enemy' },
    ],
  },
]

// ============================================================
// EXPORTS
// ============================================================

/** All card definitions (78 unique cards). */
export const ALL_CARDS: CardDefinition[] = [
  ...redCards,
  ...blueCards,
  ...greenCards,
]

/** Lookup a card definition by name. */
export const CARD_MAP: Record<string, CardDefinition> = Object.fromEntries(
  ALL_CARDS.map((card) => [card.name, card]),
)
