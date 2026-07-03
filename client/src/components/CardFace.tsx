import type { ReactNode } from 'react'
import type { ResourceColor } from '@towers/shared'
import { state } from '../theme/state'
import { useArtStyle } from '../hooks/useArtStyle'
import { CardArt } from './cardArt/CardArt'

/**
 * The card face — name banner, art, effect text, cost circle — shared by the
 * hand, the played-cards stack, and the hover / long-press previews.
 *
 * `sm` is the responsive in-game size (small on phones, full at sm:), `md` is
 * the fixed hover-preview size, `lg` the fixed long-press modal size.
 */
const SIZES = {
  sm: {
    frame:  'h-28 w-20 rounded-lg border-2 sm:h-40 sm:w-28',
    name:   'px-1 py-0.5 text-[9px] sm:px-2 sm:py-1 sm:text-xs sm:tracking-wide',
    art:    'mx-1 mt-0.5 h-5 sm:mt-1 sm:h-8',
    effect: 'px-1 py-0.5 text-[9px] leading-tight sm:px-2 sm:py-1 sm:text-[10px]',
    bottom: 'px-1 pb-0.5 sm:px-2 sm:pb-1',
    cost:   'h-6 w-6 text-xs sm:h-7 sm:w-7 sm:text-sm',
  },
  md: {
    frame:  'h-40 w-28 rounded-lg border-2',
    name:   'px-2 py-1 text-xs tracking-wide',
    art:    'mx-1 mt-1 h-8',
    effect: 'px-2 py-1 text-[10px] leading-tight',
    bottom: 'px-2 pb-1',
    cost:   'h-7 w-7 text-sm',
  },
  lg: {
    frame:  'h-80 w-56 rounded-xl border-4',
    name:   'px-3 py-2 text-lg tracking-wide',
    art:    'mx-2 mt-2 h-20',
    effect: 'px-3 py-2 text-sm leading-snug',
    bottom: 'px-3 pb-3',
    cost:   'h-14 w-14 text-2xl',
  },
} as const

interface CardFaceProps {
  cardName: string
  color: ResourceColor
  cost: number
  effectText: ReactNode
  size?: keyof typeof SIZES
  className?: string
  /** Slot before the cost circle (e.g. the discard button); omit to right-align the cost. */
  bottomLeft?: ReactNode
  /** Overlays positioned against the card frame (e.g. the discard badge). */
  children?: ReactNode
}

export function CardFace({
  cardName,
  color,
  cost,
  effectText,
  size = 'sm',
  className = '',
  bottomLeft,
  children,
}: CardFaceProps) {
  const artStyle = useArtStyle()
  const s = SIZES[size]

  return (
    <div className={`relative flex flex-col bg-stone-800 ${s.frame} ${state.cardBorder[color]} ${className}`}>
      {/* Card name */}
      <div className={`rounded-t-md bg-stone-700 text-center font-bold uppercase leading-tight text-amber-100 ${s.name}`}>
        {cardName}
      </div>

      {/* Card art */}
      <div className={`overflow-hidden rounded ${s.art}`}>
        <CardArt cardName={cardName} color={color} artStyle={artStyle} />
      </div>

      {/* Effect text */}
      <div className={`flex-1 text-center text-stone-300 ${s.effect}`}>
        {effectText}
      </div>

      {/* Bottom bar */}
      <div className={`flex items-center ${bottomLeft !== undefined ? 'justify-between' : 'justify-end'} ${s.bottom}`}>
        {bottomLeft}
        <div className={`flex items-center justify-center rounded-full font-bold text-white ${s.cost} ${state.cardCostBg[color]}`}>
          {cost}
        </div>
      </div>

      {children}
    </div>
  )
}
