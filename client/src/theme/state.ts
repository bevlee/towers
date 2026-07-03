// Central game-state color tokens. Tailwind JIT sees these literals.
export const state = {
  // "mine" / "yours" vs "theirs" — the primary identity split
  mine: {
    accent: 'text-amber-400',
    accentBorder: 'border-amber-500',
    tower: 'bg-amber-700',
    towerDark: 'bg-amber-800',
    wall: 'bg-amber-900',
    wallLight: 'bg-amber-800',
    towerNum: 'text-amber-400',
  },
  theirs: {
    accent: 'text-sky-400',
    accentBorder: 'border-sky-500',
    tower: 'bg-sky-700',
    towerDark: 'bg-sky-800',
    wall: 'bg-sky-900',
    wallLight: 'bg-sky-800',
    towerNum: 'text-sky-400',
  },
  // Semantic feedback
  gain: 'text-green-400',
  gainBorder: 'border-green-400',
  danger: 'text-red-400',
  dangerBg: 'bg-red-900',
  // Card color identity (resource color → semantic)
  cardBorder: {
    red: 'border-red-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
  } as const,
  cardCostBg: {
    red: 'bg-red-700',
    blue: 'bg-blue-700',
    green: 'bg-green-700',
  } as const,
  // Resource row backgrounds (matches card colors semantically)
  resourceRow: {
    ore: 'bg-red-900/70',    // red = ore / barracks
    mana: 'bg-blue-900/70',  // blue = mana / monastery
    troops: 'bg-green-900/70', // green = troops / ???
  } as const,
  // UI chrome
  chromeBg: 'bg-stone-900',
  chromeText: 'text-amber-100',
  disabled: 'opacity-60 grayscale',
}
