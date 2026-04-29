import { useState } from 'react'
import type { GameConfig } from '@towers/shared'
import {
  STARTING_RESOURCES,
  STARTING_LEVELS,
  STARTING_TOWER,
  STARTING_WALL,
} from '@towers/shared'

interface CreateGameModalProps {
  onClose: () => void
  onCreate: (turnTimer: number, gameConfig: GameConfig) => void
}

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
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="w-28 text-sm text-stone-300">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="w-20 rounded border border-stone-600 bg-stone-700 px-2 py-1 text-right text-amber-100 outline-none focus:border-amber-500"
      />
    </label>
  )
}

export function CreateGameModal({ onClose, onCreate }: CreateGameModalProps) {
  const [turnTimer, setTurnTimer] = useState(20)
  const [config, setConfig] = useState<GameConfig>(defaultConfig)

  function set<K extends keyof GameConfig>(key: K, value: GameConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(turnTimer, config)
  }

  function handleReset() {
    setConfig(defaultConfig())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-stone-600 bg-stone-800 px-8 py-6 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-amber-200">Create a Challenge</h2>

        {/* Turn timer */}
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

        <hr className="border-stone-700" />

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
