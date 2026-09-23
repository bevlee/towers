import { MAX_CONSECUTIVE_TIMEOUTS } from '@towers/shared'
import { useModal } from '../hooks/useModal'

interface GameOverModalProps {
  isWinner: boolean
  winReason: string
  onBackToLobby: () => void
}

/** [winner's view, loser's view] for each win reason. */
const reasonLabels: Record<string, [string, string]> = {
  tower_destroyed: ["You destroyed your opponent's tower!", 'Your tower was destroyed!'],
  tower_built:     ['Your tower reached full height!', "Your opponent's tower reached full height!"],
  resources:       ['You reached the resource goal!', 'Your opponent reached the resource goal!'],
  timeout:         ['Your opponent ran out of time.', 'You ran out of time.'],
  afk:             [`Your opponent missed ${MAX_CONSECUTIVE_TIMEOUTS} turns in a row.`, `You missed ${MAX_CONSECUTIVE_TIMEOUTS} turns in a row.`],
  forfeit:         ['Your opponent left the game.', 'You left the game.'],
}

export function GameOverModal({ isWinner, winReason, onBackToLobby }: GameOverModalProps) {
  const panelRef = useModal()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div ref={panelRef} className="flex flex-col items-center gap-4 rounded-xl border border-stone-600 bg-stone-800 px-8 py-8 shadow-2xl sm:px-12">
        <h2
          id="game-over-title"
          className={`text-4xl font-bold ${
            isWinner ? 'text-amber-400' : 'text-red-500'
          }`}
        >
          {isWinner ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-lg text-stone-300">
          {reasonLabels[winReason]?.[isWinner ? 0 : 1] ?? winReason}
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
