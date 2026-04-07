import { useState } from 'react'

interface CreateGameModalProps {
  onClose: () => void
  onCreate: (turnTimer: number) => void
}

export function CreateGameModal({ onClose, onCreate }: CreateGameModalProps) {
  const [turnTimer, setTurnTimer] = useState(20)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(turnTimer)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <form
        className="flex flex-col gap-4 rounded-xl border border-stone-600 bg-stone-800 px-8 py-6 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-amber-200">Create a Challenge</h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-400">Turn Timer</span>
          <select
            value={turnTimer}
            onChange={(e) => setTurnTimer(Number(e.target.value))}
            className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 outline-none focus:border-amber-500"
            autoFocus
          >
            <option value={15}>15 seconds</option>
            <option value={20}>20 seconds</option>
            <option value={30}>30 seconds</option>
          </select>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="rounded border border-stone-600 px-4 py-2 text-stone-400 hover:bg-stone-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-500"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
