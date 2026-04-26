import { useEffect, useRef, useState } from 'react'
import type { PlayerState } from '@towers/shared'
import { state } from '../theme/state'

interface PlayerStatsProps {
  player: PlayerState | Omit<PlayerState, 'hand'>
  side: 'left' | 'right'
}

interface ResourceRowProps {
  label: string
  level: number
  amount: number
  bgClass: string
}

const ANIM_DURATION = 2500

type ChangeState = 'none' | 'increase' | 'decrease'

interface ChangeInfo {
  state: ChangeState
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

function ResourceRow({ label, level, amount, bgClass }: ResourceRowProps) {
  const amountChange = useChangeDetect(amount)
  const levelChange = useChangeDetect(level)

  const amountAnimClass = amountChange.state !== 'none' ? 'number-pop' : ''
  const amountColorClass = amountChange.state === 'increase'
    ? state.gain
    : amountChange.state === 'decrease'
      ? state.danger
      : ''

  const levelAnimClass = levelChange.state !== 'none' ? 'number-pop' : ''
  const levelColorClass = levelChange.state === 'increase'
    ? state.gain
    : levelChange.state === 'decrease'
      ? state.danger
      : ''

  const rowAnimClass = amountChange.state === 'increase'
    ? 'resource-glow-green'
    : amountChange.state === 'decrease'
      ? 'resource-flash-red'
      : ''

  return (
    <div className={`${bgClass} relative overflow-hidden rounded px-1.5 py-1 @min-[9rem]:px-3 @min-[9rem]:py-2 ${rowAnimClass}`}>
      {/* Floating delta for amount */}
      {amountChange.state !== 'none' && (
        <div className={`delta-float pointer-events-none absolute top-1 right-2 z-10 text-sm font-black tabular-nums ${amountChange.delta > 0 ? state.gain : state.danger}`}>
          {amountChange.delta > 0 ? `+${amountChange.delta}` : amountChange.delta}
        </div>
      )}
      {/* Floating delta for level */}
      {levelChange.state !== 'none' && (
        <div className={`delta-float pointer-events-none absolute right-2 bottom-1 z-10 text-xs font-black tabular-nums ${levelChange.delta > 0 ? state.gain : state.danger}`}>
          {levelChange.delta > 0 ? `+${levelChange.delta}` : levelChange.delta}
        </div>
      )}
      <div className="flex items-baseline gap-1 text-[10px] font-bold opacity-80 @min-[9rem]:block @min-[9rem]:text-xs @min-[9rem]:uppercase @min-[9rem]:tracking-wide">
        <span>{label}</span>
        <span className={`opacity-70 tabular-nums @min-[9rem]:hidden ${levelAnimClass} ${levelColorClass}`}>(+{level})</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={`text-base font-bold tabular-nums @min-[9rem]:text-2xl ${amountAnimClass} ${amountColorClass}`}>{amount}</span>
        <span className={`hidden text-[9px] opacity-70 tabular-nums @min-[9rem]:inline @min-[9rem]:text-sm ${levelAnimClass} ${levelColorClass}`}>+{level}</span>
      </div>
    </div>
  )
}

export function PlayerStats({ player, side }: PlayerStatsProps) {
  const align = side === 'left' ? 'text-left' : 'text-right'

  return (
    <div className={`@container flex w-20 flex-col gap-1 sm:w-40 sm:gap-2 ${align}`}>
      <div className="mb-1 hidden truncate text-sm font-bold text-amber-200 sm:block">
        {player.username}
      </div>
      <ResourceRow
        label="Ore"
        level={player.mineLevel}
        amount={player.ore}
        bgClass={state.resourceRow.ore}
      />
      <ResourceRow
        label="Mana"
        level={player.monasteryLevel}
        amount={player.mana}
        bgClass={state.resourceRow.mana}
      />
      <ResourceRow
        label="Troops"
        level={player.barracksLevel}
        amount={player.troops}
        bgClass={state.resourceRow.troops}
      />
    </div>
  )
}
