import type { ResourceColor } from '@towers/shared'

interface CardProps {
  cardName: string
  id: string
  color: ResourceColor
  cost: number
  effectText: string
  playable: boolean
  isYourTurn: boolean
  canDiscard: boolean
  onPlay: () => void
  onDiscard: () => void
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

export function Card({
  cardName,
  color,
  cost,
  effectText,
  playable,
  isYourTurn,
  canDiscard,
  onPlay,
  onDiscard,
}: CardProps) {
  const canPlay = playable && isYourTurn
  const canAct = isYourTurn

  return (
    <div
      className={`
        relative flex h-24 w-[4.25rem] flex-shrink-0 cursor-pointer flex-col rounded-lg border-2
        bg-stone-800 transition-transform
        sm:h-40 sm:w-28
        ${borderColors[color]}
        ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
      `}
      onClick={canPlay ? onPlay : undefined}
      title={canPlay ? 'Click to play' : isYourTurn ? 'Not enough resources' : "Not your turn"}
    >
      {/* Card name */}
      <div className="rounded-t-md bg-stone-700 px-1 py-0.5 text-center text-[8px] font-bold uppercase leading-tight text-amber-100 sm:px-2 sm:py-1 sm:text-xs sm:tracking-wide">
        {cardName}
      </div>

      {/* Art placeholder */}
      <div className={`mx-1 mt-0.5 h-4 rounded bg-gradient-to-b sm:mt-1 sm:h-8 ${gradientColors[color]}`} />

      {/* Effect text */}
      <div className="flex-1 px-1 py-0.5 text-center text-[7px] leading-tight text-stone-300 sm:px-2 sm:py-1 sm:text-[10px]">
        {effectText}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-1 pb-0.5 sm:px-2 sm:pb-1">
        {/* Discard button */}
        {canDiscard && canAct ? (
          <button
            className="flex h-4 w-4 items-center justify-center rounded bg-stone-600 text-[10px] font-bold text-red-400 hover:bg-stone-500 sm:h-6 sm:w-6 sm:text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onDiscard()
            }}
            title="Discard"
          >
            -
          </button>
        ) : (
          <div className="h-4 w-4 sm:h-6 sm:w-6" />
        )}

        {/* Cost circle */}
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white sm:h-7 sm:w-7 sm:text-sm ${costBgColors[color]}`}
        >
          {cost}
        </div>
      </div>
    </div>
  )
}
