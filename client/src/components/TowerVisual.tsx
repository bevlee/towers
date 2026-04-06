import { WIN_TOWER } from '@towers/shared'

interface TowerVisualProps {
  tower: number
  wall: number
  side: 'left' | 'right'
  label: string
}

export function TowerVisual({ tower, wall, side, label }: TowerVisualProps) {
  const towerPct = Math.min((tower / WIN_TOWER) * 100, 100)
  const wallPct = Math.min((wall / WIN_TOWER) * 100, 100)

  const towerColor = side === 'left' ? 'bg-amber-700' : 'bg-sky-700'
  const wallColor = side === 'left' ? 'bg-amber-900' : 'bg-sky-900'

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-1">
      <div className="text-xs text-amber-300">{label}</div>
      <div className="relative flex min-h-0 flex-1 w-20 items-end justify-center gap-1 rounded bg-stone-800/50 p-1">
        {/* Wall bar */}
        <div className="flex w-6 flex-col justify-end" style={{ height: '100%' }}>
          <div
            className={`${wallColor} w-full rounded-t transition-all duration-300`}
            style={{ height: `${wallPct}%`, minHeight: wall > 0 ? '4px' : '0px' }}
          />
        </div>
        {/* Tower bar */}
        <div className="flex w-8 flex-col justify-end" style={{ height: '100%' }}>
          <div
            className={`${towerColor} w-full rounded-t transition-all duration-300`}
            style={{ height: `${towerPct}%`, minHeight: tower > 0 ? '4px' : '0px' }}
          />
        </div>
      </div>
      <div className="flex gap-2 text-sm">
        <span className="text-amber-200">T:{tower}</span>
        <span className="text-stone-400">W:{wall}</span>
      </div>
    </div>
  )
}
