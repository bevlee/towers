import { WIN_TOWER, WIN_RESOURCES, HAND_SIZE, MAX_CONSECUTIVE_TIMEOUTS } from '@towers/shared'

interface SettingsModalProps {
  roomName: string
  turnTimer: number
  onClose: () => void
}

export function SettingsModal({ roomName, turnTimer, onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="flex w-80 flex-col gap-4 rounded-xl border border-stone-600 bg-stone-800 px-8 py-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold text-amber-400">Game Settings</h2>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-400">Room</span>
            <span className="text-amber-100">{roomName || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Turn Timer</span>
            <span className="text-amber-100">{turnTimer}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Tower to Win</span>
            <span className="text-amber-100">{WIN_TOWER}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Resource Victory</span>
            <span className="text-amber-100">{WIN_RESOURCES}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Hand Size</span>
            <span className="text-amber-100">{HAND_SIZE}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">AFK Forfeit</span>
            <span className="text-amber-100">{MAX_CONSECUTIVE_TIMEOUTS} timeouts</span>
          </div>
        </div>

        <button
          className="mt-2 rounded bg-stone-700 px-4 py-2 text-sm font-bold text-stone-300 hover:bg-stone-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
