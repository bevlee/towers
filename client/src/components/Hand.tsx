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
  pendingDrawDiscard?: boolean
  onDrawDiscardChoice?: (cardInstanceId: string) => void
}

function getResourceForColor(color: string): 'ore' | 'mana' | 'troops' {
  if (color === 'red') return 'ore'
  if (color === 'blue') return 'mana'
  return 'troops'
}

export function Hand({ hand, player, isYourTurn, onPlay, onDiscard, pendingDrawDiscard = false, onDrawDiscardChoice }: HandProps) {
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
    <div>
      {pendingDrawDiscard && (
        <div className="flex items-center justify-center gap-2 border-b border-red-800 bg-red-950/60 px-4 py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0 text-red-400">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-red-300">
            Choose a card to discard to continue your turn
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 px-2 py-2 sm:flex-nowrap sm:gap-x-2 sm:gap-y-0 sm:px-4 sm:py-3">
        {hand.map((card) => {
          const def = CARD_MAP[card.cardName]
          if (!def) return null

          const resource = getResourceForColor(def.color)
          const playable = !pendingDrawDiscard && player[resource] >= def.cost
          const isNew = newCardIds.current.has(card.id)

          const handlePlay = pendingDrawDiscard
            ? () => onDrawDiscardChoice?.(card.id)
            : () => onPlay(card.id)

          const handleDiscard = pendingDrawDiscard
            ? () => onDrawDiscardChoice?.(card.id)
            : () => onDiscard(card.id)

          return (
            <div
              key={card.id}
              className={[
                isNew ? 'animate-card-draw' : '',
                pendingDrawDiscard ? 'animate-pulse' : '',
              ].filter(Boolean).join(' ')}
            >
              <Card
                id={card.id}
                cardName={def.name}
                color={def.color}
                cost={def.cost}
                effectText={describeEffects(def)}
                playable={playable}
                isYourTurn={isYourTurn || pendingDrawDiscard}
                canDiscard={pendingDrawDiscard ? true : def.canDiscard !== false}
                onPlay={handlePlay}
                onDiscard={handleDiscard}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
