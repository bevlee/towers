import { useEffect, useRef, useState } from 'react'
import type { ResourceColor } from '@towers/shared'
import { state } from '../theme/state'

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

  const [showPreview, setShowPreview] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressRef = useRef(false)

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearLongPressTimer()
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressRef.current = true
      setShowPreview(true)
      longPressTimerRef.current = null
    }, 500)
  }

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return
    clearLongPressTimer()
    if (showPreview) {
      setShowPreview(false)
    }
  }

  const handleClick = () => {
    if (longPressRef.current) {
      longPressRef.current = false
      return
    }
    if (canPlay) onPlay()
  }

  return (
    <>
      <div
        className={`
          relative flex h-28 w-20 flex-shrink-0 cursor-pointer touch-manipulation flex-col rounded-lg border-2
          bg-stone-800 transition-transform
          sm:h-40 sm:w-28
          ${state.cardBorder[color]}
          ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
        `}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        title={canPlay ? 'Click to play' : isYourTurn ? 'Not enough resources' : "Not your turn"}
      >
        {/* Card name */}
        <div className="rounded-t-md bg-stone-700 px-1 py-0.5 text-center text-[9px] font-bold uppercase leading-tight text-amber-100 sm:px-2 sm:py-1 sm:text-xs sm:tracking-wide">
          {cardName}
        </div>

        {/* Art placeholder */}
        <div className={`mx-1 mt-0.5 h-5 rounded bg-gradient-to-b sm:mt-1 sm:h-8 ${state.cardGradient[color]}`} />

        {/* Effect text */}
        <div className="flex-1 px-1 py-0.5 text-center text-[8px] leading-tight text-stone-300 sm:px-2 sm:py-1 sm:text-[10px]">
          {effectText}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-1 pb-0.5 sm:px-2 sm:pb-1">
          {/* Discard button */}
          {canDiscard && canAct ? (
            <button
              className="flex h-5 w-5 items-center justify-center rounded bg-stone-600 text-xs font-bold text-red-400 hover:bg-stone-500 sm:h-6 sm:w-6 sm:text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onDiscard()
              }}
              title="Discard"
            >
              -
            </button>
          ) : (
            <div className="h-5 w-5 sm:h-6 sm:w-6" />
          )}

          {/* Cost circle */}
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white sm:h-7 sm:w-7 sm:text-sm ${state.cardCostBg[color]}`}
          >
            {cost}
          </div>
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 sm:hidden"
          onClick={() => setShowPreview(false)}
          onPointerUp={() => setShowPreview(false)}
          onPointerCancel={() => setShowPreview(false)}
        >
          <div
            className={`relative flex h-80 w-56 flex-col rounded-xl border-4 bg-stone-800 ${state.cardBorder[color]}`}
          >
            {/* Card name */}
            <div className="rounded-t-md bg-stone-700 px-3 py-2 text-center text-lg font-bold uppercase leading-tight tracking-wide text-amber-100">
              {cardName}
            </div>

            {/* Art placeholder */}
            <div className={`mx-2 mt-2 h-20 rounded bg-gradient-to-b ${state.cardGradient[color]}`} />

            {/* Effect text */}
            <div className="flex-1 px-3 py-2 text-center text-sm leading-snug text-stone-300">
              {effectText}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-end px-3 pb-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white ${state.cardCostBg[color]}`}
              >
                {cost}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
