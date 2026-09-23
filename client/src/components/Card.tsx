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
  /** Draw-discard phase: activating the card discards it instead of playing it. */
  discardMode?: boolean
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
  discardMode = false,
  onPlay,
  onDiscard,
}: CardProps) {
  const canPlay = playable && isYourTurn
  const canAct = isYourTurn
  const status = discardMode
    ? (canPlay ? 'Press to discard' : 'Cannot be discarded')
    : canPlay ? 'Press to play' : isYourTurn ? 'Not enough resources' : 'Not your turn'

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
    longPressRef.current = false
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
      {/* Wrapper holds the pointer handlers and hover lift; the discard button is a
          sibling of the role="button" card rather than nested inside it. */}
      <div
        className={`
          relative flex-shrink-0 cursor-pointer touch-manipulation transition-transform
          ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
        `}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        title={canPlay ? undefined : status}
      >
        <div
          role="button"
          tabIndex={canAct ? 0 : -1}
          aria-disabled={!canPlay}
          aria-label={`${cardName}, costs ${cost}. ${effectText.replace(/\.$/, '')}. ${status}`}
          className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick()
            }
          }}
        >
          <CardFace
            cardName={cardName}
            color={color}
            cost={cost}
            effectText={effectText}
            bottomLeft={<div className="h-6 w-6" />}
          />
        </div>
        {canDiscard && canAct && (
          // Positioned over CardFace's bottom-left slot (border + bottom-bar padding)
          <button
            className="absolute bottom-[4px] left-[6px] flex h-6 w-6 items-center justify-center rounded bg-stone-600 text-xs font-bold text-red-400 hover:bg-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 md:bottom-[8px] md:left-[10px]"
            onClick={(e) => {
              e.stopPropagation()
              onDiscard()
            }}
            aria-label={`Discard ${cardName}`}
            title="Discard"
          >
            -
          </button>
        )}
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
