import { useEffect, useRef } from 'react'

interface GameOverModalProps {
  isWinner: boolean
  winReason: string
  onBackToLobby: () => void
}

const reasonLabels: Record<string, string> = {
  tower_destroyed: 'Tower was destroyed!',
  tower_built: 'Tower reached maximum height!',
  resources: 'Resource victory!',
  timeout: 'Game timed out!',
  afk: 'Player went AFK!',
  forfeit: 'Opponent disconnected!',
}

export function GameOverModal({ isWinner, winReason, onBackToLobby }: GameOverModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="flex flex-col items-center gap-4 rounded-xl border border-stone-600 bg-stone-800 px-8 py-8 shadow-2xl sm:px-12">
        <h2
          id="game-over-title"
          className={`text-4xl font-bold ${
            isWinner ? 'text-amber-400' : 'text-red-500'
          }`}
        >
          {isWinner ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-lg text-stone-300">
          {reasonLabels[winReason] ?? winReason}
        </p>
        <button
          ref={buttonRef}
          className="mt-2 rounded bg-amber-600 px-6 py-2 font-bold text-white hover:bg-amber-500"
          onClick={onBackToLobby}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
