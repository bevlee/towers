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

function ResourceRow({ label, level, amount, bgClass }: ResourceRowProps) {
  return (
    <div className={`${bgClass} rounded px-3 py-2`}>
      <div className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">{amount}</span>
        <span className="text-sm opacity-70">+{level}</span>
      </div>
    </div>
  )
}

export function PlayerStats({ player, side }: PlayerStatsProps) {
  const align = side === 'left' ? 'text-left' : 'text-right'

  return (
    <div className={`flex w-40 flex-col gap-2 ${align}`}>
      <div className="mb-1 truncate text-sm font-bold text-amber-200">
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
