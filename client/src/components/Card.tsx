import { useEffect, useRef, useState } from 'react'
import type { ResourceColor } from '@towers/shared'
import { CardFace } from './CardFace'

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
          flex-shrink-0 cursor-pointer touch-manipulation transition-transform
          ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
        `}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        title={canPlay ? 'Click to play' : isYourTurn ? 'Not enough resources' : "Not your turn"}
      >
        <CardFace
          cardName={cardName}
          color={color}
          cost={cost}
          effectText={effectText}
          bottomLeft={
            canDiscard && canAct ? (
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
            )
          }
        />
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 sm:hidden"
          onClick={() => setShowPreview(false)}
          onPointerUp={() => setShowPreview(false)}
          onPointerCancel={() => setShowPreview(false)}
        >
          <CardFace cardName={cardName} color={color} cost={cost} effectText={effectText} size="lg" />
        </div>
      )}
    </>
  )
}
