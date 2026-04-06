import { useEffect, useRef } from 'react'
import type { GameHistoryEntry, ResourceColor } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { describeEffects } from '../utils/cardText'

interface LastPlayedCardsProps {
  history: GameHistoryEntry[]
  yourPlayerId: string
}

const borderColors: Record<ResourceColor, string> = {
  red: 'border-red-600',
  blue: 'border-blue-600',
  green: 'border-green-600',
}

const gradientColors: Record<ResourceColor, string> = {
  red: 'from-red-800 to-red-950',
  blue: 'from-blue-800 to-blue-950',
  green: 'from-green-800 to-green-950',
}

const costBgColors: Record<ResourceColor, string> = {
  red: 'bg-red-700',
  blue: 'bg-blue-700',
  green: 'bg-green-700',
}

/** Collect the most recent consecutive actions by the same player from end of history. */
function getLastTurnCards(history: GameHistoryEntry[]): GameHistoryEntry[] {
  if (history.length === 0) return []

  const lastPlayer = history[history.length - 1].playerId
  const cards: GameHistoryEntry[] = []

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].playerId === lastPlayer) {
      cards.unshift(history[i])
    } else {
      break
    }
  }

  return cards
}

function PlayedCard({ entry, animate }: { entry: GameHistoryEntry; animate: boolean }) {
  const def = CARD_MAP[entry.cardName]
  if (!def) return null

  const isDiscard = entry.action !== 'play'

  return (
    <div className={animate ? 'animate-card-play' : ''}>
      <div
        className={`
          relative flex h-40 w-28 flex-shrink-0 flex-col rounded-lg border-2 bg-stone-800
          ${borderColors[def.color]}
          ${isDiscard ? 'opacity-50' : ''}
        `}
      >
        {/* Card name */}
        <div className="rounded-t-md bg-stone-700 px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-amber-100">
          {entry.cardName}
        </div>

        {/* Art placeholder */}
        <div className={`mx-1 mt-1 h-8 rounded bg-gradient-to-b ${gradientColors[def.color]}`} />

        {/* Effect text */}
        <div className="flex-1 px-2 py-1 text-center text-[10px] leading-tight text-stone-300">
          {describeEffects(def)}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end px-2 pb-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${costBgColors[def.color]}`}
          >
            {def.cost}
          </div>
        </div>

        {/* Discard badge */}
        {isDiscard && (
          <div className="absolute bottom-1 left-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase text-stone-20/70">
              discarded
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function LastPlayedCards({ history, yourPlayerId }: LastPlayedCardsProps) {
  const cards = getLastTurnCards(history)
  const prevLength = useRef(history.length)
  const shouldAnimate = useRef(false)

  useEffect(() => {
    shouldAnimate.current = history.length !== prevLength.current
    prevLength.current = history.length
  }, [history.length])

  if (cards.length === 0) return null

  const isYou = cards[0].playerId === yourPlayerId
  const label = isYou ? 'You played' : `${cards[0].username} played`

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
      <div className="flex gap-2">
        {cards.map((entry, i) => (
          <PlayedCard key={`${history.length}-${i}`} entry={entry} animate={shouldAnimate.current} />
        ))}
      </div>
    </div>
  )
}
