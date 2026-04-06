import { useEffect, useRef } from 'react'
import type { CardInstance } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import type { PlayerState } from '@towers/shared'
import { Card } from './Card'
import { describeEffects } from '../utils/cardText'

interface HandProps {
  hand: CardInstance[]
  player: PlayerState
  isYourTurn: boolean
  onPlay: (cardInstanceId: string) => void
  onDiscard: (cardInstanceId: string) => void
}

function getResourceForColor(color: string): 'ore' | 'mana' | 'troops' {
  if (color === 'red') return 'ore'
  if (color === 'blue') return 'mana'
  return 'troops'
}

export function Hand({ hand, player, isYourTurn, onPlay, onDiscard }: HandProps) {
  const prevCardIds = useRef<Set<string>>(new Set(hand.map((c) => c.id)))
  const newCardIds = useRef<Set<string>>(new Set<string>())

  useEffect(() => {
    const currentIds = new Set(hand.map((c) => c.id))
    const freshIds = new Set<string>()
    for (const id of currentIds) {
      if (!prevCardIds.current.has(id)) {
        freshIds.add(id)
      }
    }
    newCardIds.current = freshIds
    prevCardIds.current = currentIds
  }, [hand])

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3">
      {hand.map((card) => {
        const def = CARD_MAP[card.cardName]
        if (!def) return null

        const resource = getResourceForColor(def.color)
        const playable = player[resource] >= def.cost
        const isNew = newCardIds.current.has(card.id)

        return (
          <div key={card.id} className={isNew ? 'animate-card-draw' : ''}>
            <Card
              id={card.id}
              cardName={def.name}
              color={def.color}
              cost={def.cost}
              effectText={describeEffects(def)}
              playable={playable}
              isYourTurn={isYourTurn}
              canDiscard={def.canDiscard !== false}
              onPlay={() => onPlay(card.id)}
              onDiscard={() => onDiscard(card.id)}
            />
          </div>
        )
      })}
    </div>
  )
}
