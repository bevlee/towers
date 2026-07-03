import { useState } from 'react'
import type { CardDefinition } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { state } from '../theme/state'
import { CardFace } from './CardFace'
import { describeEffects } from '../utils/cardText'

interface PreviewPosition {
  top: number
  left: number
}

function CardPreview({ def, top, left }: { def: CardDefinition } & PreviewPosition) {
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
      <CardFace
        cardName={def.name}
        color={def.color}
        cost={def.cost}
        effectText={describeEffects(def)}
        size="md"
        className="shadow-xl"
      />
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
  const colorClass = def ? state.cardText[def.color] : 'text-amber-300'

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
