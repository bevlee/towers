import type { CardDefinition, CardEffect, ConditionCheck } from '@towers/shared'

function targetLabel(target: string): string {
  if (target === 'self') return ''
  if (target === 'enemy') return ' enemy'
  return ' all'
}

function describeCondition(condition: ConditionCheck): string {
  if (condition.type === 'wall_zero') {
    return condition.target === 'enemy' ? 'enemy wall = 0' : 'wall = 0'
  }
  const sourceName = condition.source === 'mine' ? 'mine' : condition.source === 'monastery' ? 'monastery' : 'barracks'
  const op = condition.comparison === 'lt' ? '<' : condition.comparison === 'gt' ? '>' : '='
  return `${sourceName} ${op} enemy`
}

function describeEffect(effect: CardEffect): string {
  switch (effect.type) {
    case 'wall': {
      const sign = effect.amount > 0 ? '+' : ''
      return `${sign}${effect.amount} wall${targetLabel(effect.target)}`
    }
    case 'tower': {
      const sign = effect.amount > 0 ? '+' : ''
      return `${sign}${effect.amount} tower${targetLabel(effect.target)}`
    }
    case 'damage':
      return `${effect.amount} damage${effect.direct ? ' (direct)' : ''}`
    case 'resource': {
      const sign = effect.amount > 0 ? '+' : ''
      return `${sign}${effect.amount} ${effect.resource}${targetLabel(effect.target)}`
    }
    case 'level': {
      const sign = effect.amount > 0 ? '+' : ''
      const sourceName = effect.source === 'mine' ? 'mine' : effect.source === 'monastery' ? 'monastery' : 'barracks'
      return `${sign}${effect.amount} ${sourceName}${targetLabel(effect.target)}`
    }
    case 'selfDamage':
      return `${effect.amount} damage to self`
    case 'playAgain':
      return 'Play again'
    case 'swap':
      return `Swap ${effect.property}s`
    case 'steal':
      return `Steal ${effect.amount} ${effect.resource}`
    case 'drawDiscard':
      return 'Draw and discard'
    case 'copyLevel':
      return `Copy enemy ${effect.source} level`
    case 'conditional': {
      const cond = describeCondition(effect.condition)
      const trueBranch = effect.ifTrue.map(describeEffect).filter(Boolean).join(', ')
      const falseBranch = effect.ifFalse.map(describeEffect).filter(Boolean).join(', ')
      if (!falseBranch) return `If ${cond}, ${trueBranch}`
      return `If ${cond}, ${trueBranch}. Otherwise ${falseBranch}`
    }
    default:
      return ''
  }
}

/** Generate a short text description of a card's effects. */
export function describeEffects(card: CardDefinition): string {
  return card.effects.map(describeEffect).filter(Boolean).join('. ')
}
