interface TurnIndicatorProps {
  isYourTurn: boolean
  turnTimeRemaining: number
  gameTimeRemaining: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TurnIndicator({ isYourTurn, turnTimeRemaining, gameTimeRemaining }: TurnIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded px-4 py-1 text-lg font-bold uppercase tracking-wide ${
          isYourTurn ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400'
        }`}
      >
        {isYourTurn ? 'Your Turn' : "Opponent's Turn"}
      </div>
      <div className="flex gap-4 text-sm text-stone-400">
        <span>Turn: {turnTimeRemaining}s</span>
        <span>Game: {formatTime(gameTimeRemaining)}</span>
      </div>
    </div>
  )
}
