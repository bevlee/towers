import { useEffect, useRef, useState } from 'react'
import type { CardDefinition, GameHistoryEntry, ResourceColor } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { describeEffects } from '../utils/cardText'

interface GameHistoryProps {
  history: GameHistoryEntry[]
  yourPlayerId: string
}

const colorForCard: Record<string, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
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

interface HoverState {
  def: CardDefinition
  top: number
  left: number
}

function CardPreview({ def, top, left }: HoverState) {
  // Card is 112px wide (w-28). Place it to the right of the name; if there isn't
  // room, place it to the left of the cursor instead.
  const cardWidth = 112
  const cardHeight = 160
  const margin = 8
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768

  let finalLeft = left + margin
  if (finalLeft + cardWidth > viewportWidth - margin) {
    finalLeft = Math.max(margin, left - cardWidth - margin)
  }
  let finalTop = top
  if (finalTop + cardHeight > viewportHeight - margin) {
    finalTop = Math.max(margin, viewportHeight - cardHeight - margin)
  }

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ top: finalTop, left: finalLeft }}
    >
      <div
        className={`relative flex h-40 w-28 flex-col rounded-lg border-2 bg-stone-800 shadow-xl ${borderColors[def.color]}`}
      >
        <div className="rounded-t-md bg-stone-700 px-2 py-1 text-center text-xs font-bold uppercase leading-tight tracking-wide text-amber-100">
          {def.name}
        </div>
        <div className={`mx-1 mt-1 h-8 rounded bg-gradient-to-b ${gradientColors[def.color]}`} />
        <div className="flex-1 px-2 py-1 text-center text-[10px] leading-tight text-stone-300">
          {describeEffects(def)}
        </div>
        <div className="flex items-center justify-end px-2 pb-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${costBgColors[def.color]}`}
          >
            {def.cost}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GameHistory({ history, yourPlayerId }: GameHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)

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

  const showPreview = (e: React.MouseEvent<HTMLSpanElement>, def: CardDefinition) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHover({ def, top: rect.top, left: rect.right })
  }

  return (
    <>
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
                <span className="w-6 flex-shrink-0 text-right tabular-nums text-stone-600">{entry.turn}</span>
                <span className={isYou ? 'font-medium text-amber-200' : 'text-stone-400'}>
                  {name}
                </span>
                <span className="text-stone-500">{actionText}</span>
                {def ? (
                  <span
                    className={`cursor-help font-semibold ${cardColor}`}
                    onMouseEnter={(e) => showPreview(e, def)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {entry.cardName}
                  </span>
                ) : (
                  <span className={`font-semibold ${cardColor}`}>{entry.cardName}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {hover && <CardPreview {...hover} />}
    </>
  )
}
