import { useState, useEffect, useCallback } from 'react'
import { GAME_EVENTS } from '@towers/shared'
import type { GameStartPayload } from '@towers/shared'
import { socket } from './socket'
import { useSocket } from './hooks/useSocket'
import { useGameState } from './hooks/useGameState'
import { useLobby } from './hooks/useLobby'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'

type Screen = 'home' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [username, setUsername] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)

  const { connected } = useSocket()
  const { gameState, gameOver, opponentDisconnected, pendingDrawDiscard, playCard, discardCard, sendDrawDiscardChoice, resetGame } = useGameState()
  const { rooms, currentRoom, error, listRooms, createRoom, joinRoom, leaveRoom, clearError } = useLobby()

  // Listen for gameStart to switch screens
  useEffect(() => {
    function onGameStart(_payload: GameStartPayload) {
      setScreen('game')
    }

    socket.on(GAME_EVENTS.GAME_START, onGameStart)
    return () => {
      socket.off(GAME_EVENTS.GAME_START, onGameStart)
    }
  }, [])

  const handleBackToLobby = useCallback(() => {
    if (currentRoom) {
      leaveRoom(currentRoom.id)
    }
    resetGame()
    setScreen('home')
  }, [currentRoom, leaveRoom, resetGame])

  const handleCreate = useCallback((turnTimer: number) => {
    createRoom(turnTimer, username)
  }, [createRoom, username])

  const handleJoin = useCallback((roomId: string) => {
    clearError()
    joinRoom(roomId, username)
  }, [joinRoom, username, clearError])

  // Username entry screen
  if (!nameSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900">
        <form
          className="flex flex-col items-center gap-4 rounded-xl border border-stone-700 bg-stone-800 px-10 py-8"
          onSubmit={(e) => {
            e.preventDefault()
            if (username.trim()) {
              setUsername(username.trim())
              setNameSubmitted(true)
            }
          }}
        >
          <h1 className="text-3xl font-bold text-amber-400">Two Towers</h1>
          <p className="text-stone-400">Enter your name to begin</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-64 rounded border border-stone-600 bg-stone-700 px-4 py-2 text-center text-amber-100 placeholder-stone-500 outline-none focus:border-amber-500"
            placeholder="Your name..."
            autoFocus
            maxLength={20}
          />
          <button
            type="submit"
            className="rounded bg-amber-600 px-6 py-2 font-bold text-white hover:bg-amber-500"
          >
            Enter the Tavern
          </button>
        </form>
      </div>
    )
  }

  // Connection status
  if (!connected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900">
        <p className="text-lg text-stone-400">Connecting to server...</p>
      </div>
    )
  }

  // Game screen
  if (screen === 'game' && gameState) {
    return (
      <GamePage
        gameState={gameState}
        gameOver={gameOver}
        opponentDisconnected={opponentDisconnected}
        onPlayCard={playCard}
        onDiscardCard={discardCard}
        onDrawDiscardChoice={sendDrawDiscardChoice}
        pendingDrawDiscard={pendingDrawDiscard}
        onBackToLobby={handleBackToLobby}
        turnTimer={currentRoom?.turnTimer ?? 0}
      />
    )
  }

  // Home screen
  return (
    <HomePage
      rooms={rooms}
      onRefresh={listRooms}
      onJoin={handleJoin}
      onCreate={handleCreate}
      onLeaveRoom={leaveRoom}
      currentRoom={currentRoom}
      error={error}
      username={username}
    />
  )
}
