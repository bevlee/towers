import { WIN_TOWER, WIN_RESOURCES, HAND_SIZE, MAX_CONSECUTIVE_TIMEOUTS } from '@towers/shared'
import { useArtStyle, setArtStyle } from '../hooks/useArtStyle'

interface SettingsModalProps {
  turnTimer: number
  onClose: () => void
}

export function SettingsModal({ turnTimer, onClose }: SettingsModalProps) {
  const artStyle = useArtStyle()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-xs flex-col gap-4 rounded-xl border border-stone-600 bg-stone-800 px-6 py-6 shadow-2xl sm:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold text-amber-400">Game Settings</h2>

        <div className="flex flex-col gap-2 text-sm">
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
          <div className="flex items-center justify-between">
            <span className="text-stone-400">Card Art</span>
            <div className="flex gap-1">
              {(['monoline', 'arcane'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setArtStyle(style)}
                  className={`rounded px-2 py-1 text-xs font-bold capitalize ${
                    artStyle === style
                      ? 'bg-amber-500 text-stone-900'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
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
