import { useModal } from '../hooks/useModal'

interface LeaveConfirmModalProps {
  onCancel: () => void
  onLeave: () => void
}

export function LeaveConfirmModal({ onCancel, onLeave }: LeaveConfirmModalProps) {
  const panelRef = useModal(onCancel)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="leave-confirm-title"
      aria-describedby="leave-confirm-desc"
    >
      <div
        ref={panelRef}
        className="flex flex-col items-center gap-4 rounded-xl border border-stone-600 bg-stone-800 px-6 py-6 shadow-2xl sm:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leave-confirm-title" className="text-xl font-bold text-red-400">Leave Game?</h2>
        <p id="leave-confirm-desc" className="text-center text-sm text-stone-300">
          Leaving will forfeit the match.<br />
          Your opponent will win.
        </p>
        <div className="flex gap-3">
          <button
            data-autofocus
            className="rounded bg-stone-700 px-5 py-2 text-sm font-bold text-stone-300 hover:bg-stone-600"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-600"
            onClick={onLeave}
          >
            Leave & Forfeit
          </button>
        </div>
      </div>
    </div>
  )
}
