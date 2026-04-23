import { useCountdown } from '../hooks/useCountdown'

interface TurnIndicatorProps {
  isYourTurn: boolean
  turnTimer: number
  timerKey: number
}

export function TurnIndicator({ isYourTurn, turnTimer, timerKey }: TurnIndicatorProps) {
  const turnTime = useCountdown(turnTimer, timerKey)

  const urgent = turnTime <= 5

  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded px-3 py-1 text-sm font-bold uppercase tracking-wide ${
          isYourTurn ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400'
        }`}
      >
        {isYourTurn ? 'Your Turn' : "Opponent's Turn"}
      </div>
      <div className={`text-lg font-bold tabular-nums ${urgent ? 'text-red-400' : 'text-stone-300'}`}>
        {turnTime}s
      </div>
    </div>
  )
}
