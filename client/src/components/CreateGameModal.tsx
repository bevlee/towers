import { useState } from 'react'
import type { GameConfig } from '@towers/shared'
import { useModal } from '../hooks/useModal'
import {
  STARTING_RESOURCES,
  STARTING_LEVELS,
  STARTING_TOWER,
  STARTING_WALL,
} from '@towers/shared'

interface CreateGameModalProps {
  onClose: () => void
  onCreate: (turnTimer: number, gameConfig: GameConfig, bot?: 'easy' | 'hard') => void
}

type GameMode = 'quick' | 'bot-easy' | 'bot-hard'

function defaultConfig(): GameConfig {
  return {
    seed: '',
    ore: STARTING_RESOURCES,
    mana: STARTING_RESOURCES,
    troops: STARTING_RESOURCES,
    mineLevel: STARTING_LEVELS,
    monasteryLevel: STARTING_LEVELS,
    barracksLevel: STARTING_LEVELS,
    tower: STARTING_TOWER,
    wall: STARTING_WALL,
  }
}

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  // Keep the raw text while typing so the field can be cleared and retyped;
  // clamp only when the user leaves the field.
  const [draft, setDraft] = useState<string | null>(null)

  function commit() {
    if (draft === null) return
    const n = Number(draft)
    onChange(draft.trim() === '' || Number.isNaN(n) ? value : Math.max(min, Math.min(max, Math.round(n))))
    setDraft(null)
  }

  return (
    <label className="flex items-center justify-between gap-3">
      <span className="w-28 text-sm text-stone-300">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft ?? value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Commit instead of submitting, so the submit handler never sees a stale config
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        className="w-20 rounded border border-stone-600 bg-stone-700 px-2 py-1 text-right text-amber-100 outline-none focus:border-amber-500"
      />
    </label>
  )
}

const TURN_TIMER_OPTIONS = [15, 20, 30] as const

export function CreateGameModal({ onClose, onCreate }: CreateGameModalProps) {
  const [gameMode, setGameMode] = useState<GameMode>('quick')
  const [config, setConfig] = useState<GameConfig>(defaultConfig)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [turnTimer, setTurnTimer] = useState(20)
  const panelRef = useModal<HTMLFormElement>(onClose)

  const bot = gameMode === 'bot-easy' ? 'easy' : gameMode === 'bot-hard' ? 'hard' : undefined

  function set<K extends keyof GameConfig>(key: K, value: GameConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(turnTimer, config, bot)
  }

  function handleReset() {
    setConfig(defaultConfig())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-game-title"
    >
      <form
        ref={panelRef}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-stone-600 bg-stone-800 px-5 py-6 shadow-2xl sm:px-8"
        onSubmit={handleSubmit}
      >
        <h2 id="create-game-title" className="text-xl font-bold text-amber-200">Create a Challenge</h2>

        {/* Game Mode */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-400">Game Mode</span>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode)}
            className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 outline-none focus:border-amber-500"
            data-autofocus
          >
            <option value="quick">Quick Game</option>
            <option value="bot-easy">Vs Computer (Easy)</option>
            <option value="bot-hard">Vs Computer (Hard)</option>
            <option value="ranked" disabled>Ranked Game (Coming Soon)</option>
          </select>
        </label>

        {/* Turn Timer */}
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm text-stone-400">Turn Timer</legend>
          <div className="flex gap-2">
            {TURN_TIMER_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTurnTimer(t)}
                aria-pressed={turnTimer === t}
                className={`flex-1 rounded px-3 py-2 text-sm font-bold ${
                  turnTimer === t
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </fieldset>

        <hr className="border-stone-700" />

        {/* Advanced Options Dropdown */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          className="flex items-center justify-between rounded bg-stone-700 px-3 py-2 hover:bg-stone-600"
        >
          <span className="text-sm font-semibold text-stone-300">Advanced Options</span>
          <span aria-hidden className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showAdvanced && (
          <>
            {/* Seed */}
            <label className="flex flex-col gap-1">
              <span className="text-sm text-stone-400">
                Deck Seed <span className="text-stone-500">(leave blank for random)</span>
              </span>
              <input
                type="text"
                value={config.seed}
                onChange={(e) => set('seed', e.target.value.slice(0, 64))}
                placeholder="e.g. my-seed-42"
                className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 placeholder-stone-500 outline-none focus:border-amber-500"
              />
            </label>

            <hr className="border-stone-700" />

            {/* Resources */}
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-400">Starting Resources</p>
              <div className="flex flex-col gap-2">
                <NumberField label="Ore (Bricks)" value={config.ore} min={0} max={999} onChange={(v) => set('ore', v)} />
                <NumberField label="Mana (Crystals)" value={config.mana} min={0} max={999} onChange={(v) => set('mana', v)} />
                <NumberField label="Troops (Weapons)" value={config.troops} min={0} max={999} onChange={(v) => set('troops', v)} />
              </div>
            </div>

            <hr className="border-stone-700" />

            {/* Generator levels */}
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-400">Starting Generator Levels</p>
              <div className="flex flex-col gap-2">
                <NumberField label="Quarry (Mine)" value={config.mineLevel} min={1} max={10} onChange={(v) => set('mineLevel', v)} />
                <NumberField label="Magic (Monastery)" value={config.monasteryLevel} min={1} max={10} onChange={(v) => set('monasteryLevel', v)} />
                <NumberField label="Dungeon (Barracks)" value={config.barracksLevel} min={1} max={10} onChange={(v) => set('barracksLevel', v)} />
              </div>
            </div>

            <hr className="border-stone-700" />

            {/* Tower & wall */}
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-400">Starting Structures</p>
              <div className="flex flex-col gap-2">
                <NumberField label="Tower Height" value={config.tower} min={1} max={200} onChange={(v) => set('tower', v)} />
                <NumberField label="Wall Height" value={config.wall} min={0} max={200} onChange={(v) => set('wall', v)} />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="text-sm text-stone-500 hover:text-stone-300"
            onClick={handleReset}
          >
            Reset to defaults
          </button>
          <div className="flex gap-2">
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
        </div>
      </form>
    </div>
  )
}
