import { useState } from 'react'
import type { CardDefinition } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { state } from '../theme/state'
import { useArtStyle } from '../hooks/useArtStyle'
import { CardArt } from './cardArt/CardArt'
import { describeEffects } from '../utils/cardText'

const textColors: Record<string, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
}

interface PreviewPosition {
  top: number
  left: number
}

function CardPreview({ def, top, left }: { def: CardDefinition } & PreviewPosition) {
  const artStyle = useArtStyle()

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
        className={`relative flex h-40 w-28 flex-col rounded-lg border-2 bg-stone-800 shadow-xl ${state.cardBorder[def.color]}`}
      >
        <div className="rounded-t-md bg-stone-700 px-2 py-1 text-center text-xs font-bold uppercase leading-tight tracking-wide text-amber-100">
          {def.name}
        </div>
        <div className="mx-1 mt-1 h-8 overflow-hidden rounded">
          <CardArt cardName={def.name} color={def.color} artStyle={artStyle} />
        </div>
        <div className="flex-1 px-2 py-1 text-center text-[10px] leading-tight text-stone-300">
          {describeEffects(def)}
        </div>
        <div className="flex items-center justify-end px-2 pb-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${state.cardCostBg[def.color]}`}
          >
            {def.cost}
          </div>
        </div>
      </div>
    </div>
  )
}

interface HoverCardNameProps {
  cardName: string
  className?: string
}

/**
 * A card name that shows a full card preview (art, effects, cost) on hover.
 * Falls back to plain colored text when the card isn't in CARD_MAP.
 */
export function HoverCardName({ cardName, className = '' }: HoverCardNameProps) {
  const [pos, setPos] = useState<PreviewPosition | null>(null)
  const def = CARD_MAP[cardName]
  const colorClass = def ? textColors[def.color] || 'text-amber-300' : 'text-amber-300'

  if (!def) {
    return <span className={`font-semibold ${colorClass} ${className}`}>{cardName}</span>
  }

  return (
    <>
      <span
        className={`cursor-help font-semibold ${colorClass} ${className}`}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setPos({ top: rect.top, left: rect.right })
        }}
        onMouseLeave={() => setPos(null)}
      >
        {cardName}
      </span>
      {pos && <CardPreview def={def} {...pos} />}
    </>
  )
}
