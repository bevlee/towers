import { useEffect, useRef, useState } from 'react'
import type { PlayerState } from '@towers/shared'

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
    ? 'text-green-400'
    : amountChange.state === 'decrease'
      ? 'text-red-400'
      : ''

  const levelAnimClass = levelChange.state !== 'none' ? 'number-pop' : ''
  const levelColorClass = levelChange.state === 'increase'
    ? 'text-green-400'
    : levelChange.state === 'decrease'
      ? 'text-red-400'
      : ''

  const rowAnimClass = amountChange.state === 'increase'
    ? 'resource-glow-green'
    : amountChange.state === 'decrease'
      ? 'resource-flash-red'
      : ''

  return (
    <div className={`${bgClass} relative overflow-hidden rounded px-1 py-0.5 sm:px-3 sm:py-2 ${rowAnimClass}`}>
      {/* Floating delta for amount */}
      {amountChange.state !== 'none' && (
        <div className={`delta-float pointer-events-none absolute top-1 right-2 z-10 text-sm font-black ${amountChange.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {amountChange.delta > 0 ? `+${amountChange.delta}` : amountChange.delta}
        </div>
      )}
      {/* Floating delta for level */}
      {levelChange.state !== 'none' && (
        <div className={`delta-float pointer-events-none absolute right-2 bottom-1 z-10 text-xs font-black ${levelChange.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {levelChange.delta > 0 ? `+${levelChange.delta}` : levelChange.delta}
        </div>
      )}
      <div className="text-[9px] font-bold opacity-80 sm:text-xs sm:uppercase sm:tracking-wide">{label}</div>
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-bold sm:text-2xl ${amountAnimClass} ${amountColorClass}`}>{amount}</span>
        <span className={`text-[9px] opacity-70 sm:text-sm ${levelAnimClass} ${levelColorClass}`}>+{level}</span>
      </div>
    </div>
  )
}

export function PlayerStats({ player, side }: PlayerStatsProps) {
  const align = side === 'left' ? 'text-left' : 'text-right'

  return (
    <div className={`flex w-14 flex-col gap-0.5 sm:w-40 sm:gap-2 ${align}`}>
      <div className="mb-1 hidden truncate text-sm font-bold text-amber-200 sm:block">
        {player.username}
      </div>
      <ResourceRow
        label="Ore"
        level={player.mineLevel}
        amount={player.ore}
        bgClass="bg-red-900/70"
      />
      <ResourceRow
        label="Mana"
        level={player.monasteryLevel}
        amount={player.mana}
        bgClass="bg-blue-900/70"
      />
      <ResourceRow
        label="Troops"
        level={player.barracksLevel}
        amount={player.troops}
        bgClass="bg-green-900/70"
      />
    </div>
  )
}
