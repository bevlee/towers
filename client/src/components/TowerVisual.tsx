import { useEffect, useRef, useState } from 'react'
import { WIN_TOWER } from '@towers/shared'

interface TowerVisualProps {
  tower: number
  wall: number
  side: 'left' | 'right'
}

const MAX_WALL = 80
const BRICK_HEIGHT = 8
const BRICK_GAP = 2
const ANIM_DURATION = 2500

interface ChangeInfo {
  state: 'none' | 'increase' | 'decrease'
  delta: number
}

function useChangeDetect(value: number): ChangeInfo {
  const prevRef = useRef(value)
  const [change, setChange] = useState<ChangeInfo>({ state: 'none', delta: 0 })

  useEffect(() => {
    if (prevRef.current !== value) {
      const delta = value - prevRef.current
      setChange({
        state: delta > 0 ? 'increase' : 'decrease',
        delta,
      })
      prevRef.current = value
      const timer = setTimeout(() => setChange({ state: 'none', delta: 0 }), ANIM_DURATION)
      return () => clearTimeout(timer)
    }
  }, [value])

  return change
}

function brickCount(value: number, max: number, maxBricks: number): number {
  if (value <= 0) return 0
  return Math.max(1, Math.round((value / max) * maxBricks))
}

function structureAnimClass(state: ChangeInfo['state']): string {
  if (state === 'increase') return 'tower-glow-green'
  if (state === 'decrease') return 'tower-shake tower-flash-red'
  return ''
}

function DeltaFloat({ change }: { change: ChangeInfo }) {
  if (change.state === 'none') return null
  const isPositive = change.delta > 0
  const text = isPositive ? `+${change.delta}` : `${change.delta}`
  const color = isPositive ? 'text-green-400' : 'text-red-400'

  return (
    <div className={`delta-float pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-lg font-black ${color}`}>
      {text}
    </div>
  )
}

function TowerStructure({ bricks, side, change }: { bricks: number; side: 'left' | 'right'; change: ChangeInfo }) {
  const color = side === 'left' ? 'bg-amber-700' : 'bg-sky-700'
  const colorDark = side === 'left' ? 'bg-amber-800' : 'bg-sky-800'
  const animClass = structureAnimClass(change.state)

  return (
    <div className={`relative flex flex-col-reverse items-center ${animClass}`}>
      <DeltaFloat change={change} />
      {/* Turret cap */}
      {bricks > 0 && (
        <div className="relative mb-0.5 flex flex-col items-center">
          {/* Crenellations */}
          <div className="flex gap-[3px]">
            <div className={`h-2 w-2.5 rounded-t-sm ${color}`} />
            <div className={`h-2 w-2.5 rounded-t-sm ${color}`} />
            <div className={`h-2 w-2.5 rounded-t-sm ${color}`} />
          </div>
          {/* Cap base */}
          <div className={`h-1 w-full ${color}`} />
        </div>
      )}
      {/* Bricks */}
      {Array.from({ length: bricks }).map((_, i) => {
        const isEven = i % 2 === 0
        return (
          <div
            key={i}
            className="flex w-7 gap-[1px] sm:w-10"
            style={{ marginBottom: i < bricks - 1 ? `${BRICK_GAP}px` : 0 }}
          >
            {isEven ? (
              <>
                <div className={`flex-[3] rounded-[1px] ${color}`} style={{ height: BRICK_HEIGHT }} />
                <div className={`flex-[2] rounded-[1px] ${colorDark}`} style={{ height: BRICK_HEIGHT }} />
              </>
            ) : (
              <>
                <div className={`flex-[2] rounded-[1px] ${colorDark}`} style={{ height: BRICK_HEIGHT }} />
                <div className={`flex-[3] rounded-[1px] ${color}`} style={{ height: BRICK_HEIGHT }} />
              </>
            )}
          </div>
        )
      })}
      {/* Foundation */}
      {bricks > 0 && (
        <div className={`mt-0.5 h-1.5 w-9 rounded-sm sm:w-12 ${colorDark}`} />
      )}
    </div>
  )
}

function WallStructure({ bricks, side, change }: { bricks: number; side: 'left' | 'right'; change: ChangeInfo }) {
  const color = side === 'left' ? 'bg-amber-900' : 'bg-sky-900'
  const colorLight = side === 'left' ? 'bg-amber-800' : 'bg-sky-800'
  const animClass = structureAnimClass(change.state)

  return (
    <div className={`relative flex flex-col-reverse items-center ${animClass}`}>
      <DeltaFloat change={change} />
      {/* Crenellations */}
      {bricks > 0 && (
        <div className="mb-0.5 flex gap-[2px]">
          <div className={`h-1.5 w-2 rounded-t-sm ${color}`} />
          <div className={`h-1.5 w-2 rounded-t-sm ${color}`} />
          <div className={`h-1.5 w-2 rounded-t-sm ${color}`} />
        </div>
      )}
      {/* Bricks */}
      {Array.from({ length: bricks }).map((_, i) => {
        const isEven = i % 2 === 0
        return (
          <div
            key={i}
            className="flex w-6 gap-[1px] sm:w-8"
            style={{ marginBottom: i < bricks - 1 ? `${BRICK_GAP}px` : 0 }}
          >
            {isEven ? (
              <>
                <div className={`flex-1 rounded-[1px] ${color}`} style={{ height: BRICK_HEIGHT }} />
                <div className={`flex-1 rounded-[1px] ${colorLight}`} style={{ height: BRICK_HEIGHT }} />
              </>
            ) : (
              <>
                <div className={`flex-1 rounded-[1px] ${colorLight}`} style={{ height: BRICK_HEIGHT }} />
                <div className={`flex-1 rounded-[1px] ${color}`} style={{ height: BRICK_HEIGHT }} />
              </>
            )}
          </div>
        )
      })}
      {/* Foundation */}
      {bricks > 0 && (
        <div className={`mt-0.5 h-1 w-7 rounded-sm sm:w-9 ${color}`} />
      )}
    </div>
  )
}

export function TowerVisual({ tower, wall, side }: TowerVisualProps) {
  const maxTowerBricks = 20
  const maxWallBricks = 14

  const towerBricks = brickCount(tower, WIN_TOWER, maxTowerBricks)
  const wallBricks = brickCount(wall, MAX_WALL, maxWallBricks)

  const towerChange = useChangeDetect(tower)
  const wallChange = useChangeDetect(wall)

  const towerColor = side === 'left' ? 'text-amber-400' : 'text-sky-400'
  const wallColor = 'text-stone-400'

  // Position wall in front of tower based on side
  const wallOrder = side === 'left' ? 'flex-row' : 'flex-row-reverse'

  return (
    <div className="flex h-full w-20 flex-col sm:w-28">
      {/* Visual area - fills remaining space, structures anchored to bottom */}
      <div className="relative flex min-h-0 flex-1 items-end justify-center">
        <div className={`flex items-end gap-1 ${wallOrder}`}>
          <TowerStructure bricks={towerBricks} side={side} change={towerChange} />
          <WallStructure bricks={wallBricks} side={side} change={wallChange} />
        </div>
        {/* Ground line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded bg-stone-600" />
      </div>

      {/* Numeric values - anchored below structures, matching visual order */}
      <div className={`mt-1 flex justify-center gap-2 text-sm sm:mt-2 sm:gap-3 sm:text-sm ${wallOrder}`}>
        <span className={`${towerColor} ${towerChange.state !== 'none' ? 'number-pop' : ''} ${towerChange.state === 'increase' ? 'text-green-400' : towerChange.state === 'decrease' ? 'text-red-400' : ''}`}>
          <span className="text-xs opacity-60">T</span> {tower}
        </span>
        <span className={`${wallColor} ${wallChange.state !== 'none' ? 'number-pop' : ''} ${wallChange.state === 'increase' ? 'text-green-400' : wallChange.state === 'decrease' ? 'text-red-400' : ''}`}>
          <span className="text-xs opacity-60">W</span> {wall}
        </span>
      </div>
    </div>
  )
}
