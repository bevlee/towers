import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { WIN_TOWER } from '@towers/shared'
import { state } from '../theme/state'

interface TowerVisualProps {
  tower: number
  wall: number
  side: 'left' | 'right'
}

const MAX_WALL = 80
const BRICK_HEIGHT = 8
const BRICK_GAP = 2
const ANIM_DURATION = 2500
const BRICK_STAGGER = 0.045

interface ChangeInfo {
  state: 'none' | 'increase' | 'decrease'
  delta: number
  nonce: number
}

function useChangeDetect(value: number): ChangeInfo {
  const prevRef = useRef(value)
  const nonceRef = useRef(0)
  const [change, setChange] = useState<ChangeInfo>({ state: 'none', delta: 0, nonce: 0 })

  useEffect(() => {
    if (prevRef.current !== value) {
      const delta = value - prevRef.current
      nonceRef.current += 1
      setChange({
        state: delta > 0 ? 'increase' : 'decrease',
        delta,
        nonce: nonceRef.current,
      })
      prevRef.current = value
      const timer = setTimeout(() => setChange({ state: 'none', delta: 0, nonce: nonceRef.current }), ANIM_DURATION)
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

/** Shake amplitude/duration and glow size scale with how big the change was. */
function changeStyle(change: ChangeInfo): CSSProperties {
  const mag = Math.min(Math.abs(change.delta), 20)
  return {
    '--shake-amp': `${(2 + mag * 0.45).toFixed(1)}px`,
    '--shake-dur': `${(0.7 + mag * 0.04).toFixed(2)}s`,
    '--glow-size': `${(6 + mag * 0.8).toFixed(1)}px`,
  } as CSSProperties
}

// Entering bricks grow (height, not transform) so the structure above them
// rises naturally; exiting bricks tumble off and fall.
const brickInitial = { height: 0, marginBottom: 0, opacity: 0 }

function brickEnter(i: number, count: number, prevCount: number) {
  return {
    height: BRICK_HEIGHT,
    marginBottom: i < count - 1 ? BRICK_GAP : 0,
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
      delay: Math.max(0, i - prevCount) * BRICK_STAGGER,
    },
  }
}

function brickExit(i: number, count: number) {
  const h = Math.imul(i + 1, 2654435761) >>> 0
  return {
    y: 64,
    x: (h % 37) - 18,
    rotate: ((h >>> 8) % 51) - 25,
    opacity: 0,
    transition: {
      duration: 0.55,
      ease: 'easeIn' as const,
      delay: Math.max(0, count - 1 - i) * BRICK_STAGGER,
    },
  }
}

// Keyed by brick count: on any height change the cap remounts at its new
// position and does a small settle-hop, reading as if it landed there.
const capSpring = { type: 'spring', stiffness: 420, damping: 17 } as const
const capHop = { y: [-9, 0], transition: capSpring }

function DeltaFloat({ change }: { change: ChangeInfo }) {
  if (change.state === 'none') return null
  const isPositive = change.delta > 0
  const text = isPositive ? `+${change.delta}` : `${change.delta}`
  const color = isPositive ? state.gain : state.danger

  return (
    <div
      key={change.nonce}
      className={`delta-float pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-lg font-black tabular-nums ${color}`}
    >
      {text}
    </div>
  )
}

/** Burst of dust from the top of a structure when it takes damage. */
function DustPuff({ change }: { change: ChangeInfo }) {
  if (change.state !== 'decrease') return null
  const parts = Array.from({ length: 7 }, (_, i) => {
    const h = Math.imul(i + 3 + change.nonce, 2246822519) >>> 0
    const angle = (i / 6) * Math.PI + ((h % 21) - 10) * 0.02
    const dist = 16 + (h % 14)
    return { dx: Math.cos(angle) * dist, dy: -Math.abs(Math.sin(angle)) * dist - 6 }
  })
  return (
    <div key={change.nonce} className="pointer-events-none absolute inset-x-0 top-0">
      {parts.map((p, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-0 h-1.5 w-1.5 rounded-full bg-stone-400"
          initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function TowerStructure({ bricks, side, change }: { bricks: number; side: 'left' | 'right'; change: ChangeInfo }) {
  const palette = side === 'left' ? state.mine : state.theirs
  const color = palette.tower
  const colorDark = palette.towerDark
  const animClass = structureAnimClass(change.state)

  const prevBricksRef = useRef(bricks)
  useEffect(() => {
    prevBricksRef.current = bricks
  }, [bricks])
  const prevBricks = prevBricksRef.current

  return (
    <div className={`relative flex w-9 flex-col-reverse items-center sm:w-12 ${animClass}`} style={changeStyle(change)}>
      <DeltaFloat change={change} />
      <DustPuff change={change} />
      {/* Foundation (first child = bottom in flex-col-reverse) */}
      {bricks > 0 && (
        <div className={`mt-0.5 h-1.5 w-9 rounded-sm @min-[7rem]:w-12 ${colorDark}`} />
      )}
      {/* Bricks */}
      <AnimatePresence initial={false} mode="popLayout">
        {Array.from({ length: bricks }).map((_, i) => {
          const isEven = i % 2 === 0
          return (
            <motion.div
              key={i}
              initial={brickInitial}
              animate={brickEnter(i, bricks, prevBricks)}
              exit={brickExit(i, bricks)}
              className="flex w-7 gap-[1px] @min-[7rem]:w-10"
            >
              {isEven ? (
                <>
                  <div className={`h-full flex-[3] rounded-[1px] ${color}`} />
                  <div className={`h-full flex-[2] rounded-[1px] ${colorDark}`} />
                </>
              ) : (
                <>
                  <div className={`h-full flex-[2] rounded-[1px] ${colorDark}`} />
                  <div className={`h-full flex-[3] rounded-[1px] ${color}`} />
                </>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
      {/* Turret cap (last child = top) — settle-hop when the height changes */}
      {bricks > 0 && (
        <motion.div key={bricks} animate={capHop} className="relative mb-0.5 flex flex-col items-center">
          {/* Crenellations */}
          <div className="flex gap-[3px]">
            <div className={`h-2 w-2.5 rounded-t-sm ${color}`} />
            <div className={`h-2 w-2.5 rounded-t-sm ${color}`} />
            <div className={`h-2 w-2.5 rounded-t-sm ${color}`} />
          </div>
          {/* Cap base */}
          <div className={`h-1 w-full ${color}`} />
        </motion.div>
      )}
    </div>
  )
}

function WallStructure({ bricks, side, change }: { bricks: number; side: 'left' | 'right'; change: ChangeInfo }) {
  const palette = side === 'left' ? state.mine : state.theirs
  const color = palette.wall
  const colorLight = palette.wallLight
  const animClass = structureAnimClass(change.state)

  const prevBricksRef = useRef(bricks)
  useEffect(() => {
    prevBricksRef.current = bricks
  }, [bricks])
  const prevBricks = prevBricksRef.current

  return (
    <div className={`relative flex w-7 flex-col-reverse items-center sm:w-9 ${animClass}`} style={changeStyle(change)}>
      <DeltaFloat change={change} />
      <DustPuff change={change} />
      {/* Foundation (first child = bottom in flex-col-reverse) */}
      {bricks > 0 && (
        <div className={`mt-0.5 h-1 w-7 rounded-sm @min-[7rem]:w-9 ${color}`} />
      )}
      {/* Bricks */}
      <AnimatePresence initial={false} mode="popLayout">
        {Array.from({ length: bricks }).map((_, i) => {
          const isEven = i % 2 === 0
          return (
            <motion.div
              key={i}
              initial={brickInitial}
              animate={brickEnter(i, bricks, prevBricks)}
              exit={brickExit(i, bricks)}
              className="flex w-6 gap-[1px] @min-[7rem]:w-8"
            >
              {isEven ? (
                <>
                  <div className={`h-full flex-1 rounded-[1px] ${color}`} />
                  <div className={`h-full flex-1 rounded-[1px] ${colorLight}`} />
                </>
              ) : (
                <>
                  <div className={`h-full flex-1 rounded-[1px] ${colorLight}`} />
                  <div className={`h-full flex-1 rounded-[1px] ${color}`} />
                </>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
      {/* Crenellations (last child = top) — settle-hop when the height changes */}
      {bricks > 0 && (
        <motion.div key={bricks} animate={capHop} className="mb-0.5 flex gap-[2px]">
          <div className={`h-1.5 w-2 rounded-t-sm ${color}`} />
          <div className={`h-1.5 w-2 rounded-t-sm ${color}`} />
          <div className={`h-1.5 w-2 rounded-t-sm ${color}`} />
        </motion.div>
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

  const palette = side === 'left' ? state.mine : state.theirs
  const towerColor = palette.towerNum
  const wallColor = 'text-stone-400'

  // Position wall in front of tower based on side
  const wallOrder = side === 'left' ? 'flex-row' : 'flex-row-reverse'

  const mobileAlign = side === 'left' ? 'justify-end' : 'justify-start'

  const nearWin = tower >= WIN_TOWER * 0.85 && tower < WIN_TOWER

  return (
    <div className="@container flex h-full w-full flex-col sm:w-28">
      {/* Visual area - fills remaining space, structures anchored to bottom */}
      <div className={`relative flex min-h-0 flex-1 items-end ${mobileAlign} sm:justify-center`}>
        <div className={`flex items-end gap-1 ${wallOrder}`}>
          <div className={nearWin ? 'tower-near-win' : undefined}>
            <TowerStructure bricks={towerBricks} side={side} change={towerChange} />
          </div>
          <WallStructure bricks={wallBricks} side={side} change={wallChange} />
        </div>
        {/* Ground line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded bg-stone-600" />
      </div>

      {/* Numeric values - anchored below structures, matching visual order */}
      <div className={`mt-1 flex justify-center gap-2 text-sm @min-[7rem]:mt-2 @min-[7rem]:gap-3 @min-[7rem]:text-sm ${wallOrder}`}>
        <span className={`tabular-nums ${towerColor} ${towerChange.state !== 'none' ? 'number-pop' : ''} ${towerChange.state === 'increase' ? state.gain : towerChange.state === 'decrease' ? state.danger : ''}`}>
          <span className="text-xs opacity-60">T</span> {tower}
        </span>
        <span className={`tabular-nums ${wallColor} ${wallChange.state !== 'none' ? 'number-pop' : ''} ${wallChange.state === 'increase' ? state.gain : wallChange.state === 'decrease' ? state.danger : ''}`}>
          <span className="text-xs opacity-60">W</span> {wall}
        </span>
      </div>
    </div>
  )
}
