import { useEffect, useRef } from 'react'
import type { GameHistoryEntry } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'

interface GameHistoryProps {
  history: GameHistoryEntry[]
  yourPlayerId: string
}

const colorForCard: Record<string, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
}

export function GameHistory({ history, yourPlayerId }: GameHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length])

  if (history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-stone-500">
        No moves yet
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2">
      <div className="flex flex-col gap-0.5">
        {history.map((entry, i) => {
          const isYou = entry.playerId === yourPlayerId
          const name = isYou ? 'You' : entry.username
          const def = CARD_MAP[entry.cardName]
          const cardColor = def ? colorForCard[def.color] || 'text-amber-300' : 'text-amber-300'

          let actionText: string
          if (entry.action === 'play') {
            actionText = 'played'
          } else if (entry.action === 'discard') {
            actionText = 'discarded'
          } else {
            actionText = 'timed out, discarded'
          }

          return (
            <div key={i} className="flex items-baseline gap-1.5 text-xs leading-relaxed">
              <span className="w-6 flex-shrink-0 text-right text-stone-600">{entry.turn}</span>
              <span className={isYou ? 'font-medium text-amber-200' : 'text-stone-400'}>
                {name}
              </span>
              <span className="text-stone-500">{actionText}</span>
              <span className={`font-semibold ${cardColor}`}>{entry.cardName}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
