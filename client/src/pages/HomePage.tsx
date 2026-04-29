import { useEffect, useState } from 'react'
import type { RoomInfo } from '@towers/shared'
import { GameList } from '../components/GameList'
import { CreateGameModal } from '../components/CreateGameModal'
import { HowToPlay } from '../components/HowToPlay'

interface HomePageProps {
  rooms: RoomInfo[]
  onRefresh: () => void
  onJoin: (roomId: string) => void
  onCreate: (turnTimer: number) => void
  onLeaveRoom: (roomId: string) => void
  currentRoom: RoomInfo | null
  error: string | null
  username: string
}

export function HomePage({ rooms, onRefresh, onJoin, onCreate, onLeaveRoom, currentRoom, error, username }: HomePageProps) {
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    onRefresh()
    const interval = setInterval(onRefresh, 5000)
    return () => clearInterval(interval)
  }, [onRefresh])

  return (
    <div className="flex min-h-screen flex-col items-center bg-stone-900 text-amber-100">
      {/* Header */}
      <header className="w-full border-b border-stone-700 bg-stone-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">Two Towers &mdash; Card Game</h1>
          <span className="text-sm text-stone-400">Playing as <span className="text-amber-200">{username}</span></span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-2 text-red-300">
            {error}
          </div>
        )}

        {/* Waiting for opponent */}
        {currentRoom && (
          <div className="mb-6 flex items-center justify-between rounded border border-amber-700 bg-amber-900/20 px-4 py-3 text-amber-200">
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
          onCreate={(timer) => {
            onCreate(timer)
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}
