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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-stone-600 bg-stone-800 px-12 py-8 shadow-2xl">
        <h2
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
          className="mt-2 rounded bg-amber-600 px-6 py-2 font-bold text-white hover:bg-amber-500"
          onClick={onBackToLobby}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
