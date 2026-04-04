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
        relative flex h-52 w-32 flex-shrink-0 cursor-pointer flex-col rounded-lg border-2
        bg-stone-800 transition-transform
        ${borderColors[color]}
        ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
      `}
      onClick={canPlay ? onPlay : undefined}
      title={canPlay ? 'Click to play' : isYourTurn ? 'Not enough resources' : "Not your turn"}
    >
      {/* Card name */}
      <div className="rounded-t-md bg-stone-700 px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-amber-100">
        {cardName}
      </div>

      {/* Art placeholder */}
      <div className={`mx-1 mt-1 h-14 rounded bg-gradient-to-b ${gradientColors[color]}`} />

      {/* Effect text */}
      <div className="flex-1 px-2 py-1 text-center text-[10px] leading-tight text-stone-300">
        {effectText}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-2 pb-1">
        {/* Discard button */}
        {canDiscard && canAct ? (
          <button
            className="flex h-6 w-6 items-center justify-center rounded bg-stone-600 text-xs font-bold text-red-400 hover:bg-stone-500"
            onClick={(e) => {
              e.stopPropagation()
              onDiscard()
            }}
            title="Discard"
          >
            -
          </button>
        ) : (
          <div className="h-6 w-6" />
        )}

        {/* Cost circle */}
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${costBgColors[color]}`}
        >
          {cost}
        </div>
      </div>
    </div>
  )
}
