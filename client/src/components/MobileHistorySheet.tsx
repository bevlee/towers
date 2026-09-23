import type { ClientGameState } from '@towers/shared'
import { GameHistory } from './GameHistory'
import { useModal } from '../hooks/useModal'

interface MobileHistorySheetProps {
  history: ClientGameState['history']
  yourPlayerId: string
  onClose: () => void
}

/** Bottom sheet showing the full move history on phones. */
export function MobileHistorySheet({ history, yourPlayerId, onClose }: MobileHistorySheetProps) {
  const panelRef = useModal(onClose)

  return (
    <div className="fixed inset-0 z-40 sm:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-sheet-title"
        className="absolute inset-x-0 bottom-0 flex h-[60vh] flex-col rounded-t-xl bg-stone-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-800 px-3 py-2">
          <div className="flex items-baseline gap-2">
            <span id="history-sheet-title" className="text-xs font-bold uppercase tracking-wider text-stone-400">History</span>
            <span className="text-xs text-stone-500">{history.length} moves</span>
          </div>
          <button
            className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-amber-300"
            onClick={onClose}
            aria-label="Close history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <GameHistory history={history} yourPlayerId={yourPlayerId} />
        </div>
      </div>
    </div>
  )
}
