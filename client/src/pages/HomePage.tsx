import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameConfig, RoomInfo } from '@towers/shared'
import { GameList } from '../components/GameList'
import { CreateGameModal } from '../components/CreateGameModal'
import { HowToPlay } from '../components/HowToPlay'

interface HomePageProps {
  rooms: RoomInfo[]
  onRefresh: () => void
  onJoin: (roomId: string) => void
  onCreate: (turnTimer: number, gameConfig: GameConfig, bot?: 'easy' | 'hard') => void
  onLeaveRoom: (roomId: string) => void
  currentRoom: RoomInfo | null
  error: string | null
  username: string
  onLogout: () => void
}

export function HomePage({ rooms, onRefresh, onJoin, onCreate, onLeaveRoom, currentRoom, error, username, onLogout }: HomePageProps) {
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    onRefresh()
    const interval = setInterval(onRefresh, 5000)
    return () => clearInterval(interval)
  }, [onRefresh])

  return (
    <div className="flex min-h-screen flex-col items-center bg-stone-900 text-amber-100">
      {/* Header */}
      <header className="w-full border-b border-stone-700 bg-stone-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-xl font-bold text-amber-400 sm:text-2xl">
            Two Towers<span className="hidden sm:inline"> &mdash; Card Game</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-400">Playing as <span className="text-amber-200">{username}</span></span>
            <Link
              to="/profile"
              className="rounded border border-stone-600 px-3 py-1 text-xs text-stone-400 hover:border-amber-500 hover:text-amber-200 transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={onLogout}
              className="rounded border border-stone-600 px-3 py-1 text-xs text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-2 text-red-300">
            {error}
          </div>
        )}

        {/* Waiting for opponent */}
        {currentRoom && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded border border-amber-700 bg-amber-900/20 px-4 py-3 text-amber-200">
            <span>Waiting for opponent in room &ldquo;{currentRoom.name}&rdquo;...</span>
            <button
              className="rounded bg-red-700 px-3 py-1 text-sm font-bold text-white hover:bg-red-600"
              onClick={() => onLeaveRoom(currentRoom.id)}
            >
              Cancel Challenge
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          {!currentRoom && (
            <button
              className="rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-500"
              onClick={() => setShowCreate(true)}
            >
              Create a Challenge
            </button>
          )}
          <button
            className="rounded border border-stone-600 px-4 py-2 text-stone-300 hover:bg-stone-800"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>

        {/* Game list */}
        <GameList rooms={rooms} onJoin={onJoin} currentRoom={currentRoom} />

        {/* Rules */}
        <HowToPlay />
      </main>

      {/* Create modal */}
      {showCreate && (
        <CreateGameModal
          onClose={() => setShowCreate(false)}
          onCreate={(timer, config, bot) => {
            onCreate(timer, config, bot)
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}
