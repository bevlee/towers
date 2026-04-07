import { useCountdown } from '../hooks/useCountdown'

interface TurnIndicatorProps {
  isYourTurn: boolean
  turnTimeRemaining: number
  turnNumber: number
}

export function TurnIndicator({ isYourTurn, turnTimeRemaining, turnNumber }: TurnIndicatorProps) {
  const turnTime = useCountdown(turnTimeRemaining, turnNumber)

  const urgent = turnTime <= 5

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded px-4 py-1 text-lg font-bold uppercase tracking-wide ${
          isYourTurn ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400'
        }`}
      >
        {isYourTurn ? 'Your Turn' : "Opponent's Turn"}
      </div>
      <div className={`text-2xl font-bold ${urgent ? 'text-red-400' : 'text-stone-300'}`}>
        {turnTime}s
      </div>
    </div>
  )
}
