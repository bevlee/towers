import { useState, useEffect, useCallback } from 'react'
import { GAME_EVENTS } from '@towers/shared'
import type { GameStartPayload } from '@towers/shared'
import { socket } from './socket'
import { usePbAuth } from './hooks/usePbAuth'
import { useSocket } from './hooks/useSocket'
import { useGameState } from './hooks/useGameState'
import { useLobby } from './hooks/useLobby'
import { AuthScreen } from './components/AuthScreen'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'

type Screen = 'home' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  const { user: pbUser, token: pbToken, loading: authLoading, error: authError, login, register, logout, clearError } = usePbAuth()

  // username comes from the PocketBase user record
  const username = (pbUser as any)?.username ?? ''

  // Socket connects only after a valid PB token is available
  const { connected } = useSocket(pbToken)

  const { gameState, gameOver, opponentDisconnected, pendingDrawDiscard, playCard, discardCard, sendDrawDiscardChoice, resetGame } = useGameState()
  const { rooms, currentRoom, error, listRooms, createRoom, joinRoom, leaveRoom, clearError: clearLobbyError } = useLobby()

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
    if (currentRoom) leaveRoom(currentRoom.id)
    resetGame()
    setScreen('home')
  }, [currentRoom, leaveRoom, resetGame])

  const handleCreate = useCallback((turnTimer: number) => {
    createRoom(turnTimer, username)
  }, [createRoom, username])

  const handleJoin = useCallback((roomId: string) => {
    clearLobbyError()
    joinRoom(roomId, username)
  }, [joinRoom, username, clearLobbyError])

  const handleLogout = useCallback(() => {
    if (currentRoom) leaveRoom(currentRoom.id)
    resetGame()
    setScreen('home')
    socket.disconnect()
    logout()
  }, [currentRoom, leaveRoom, resetGame, logout])

  // Auth screen — shown when not logged in
  if (!pbUser) {
    return (
      <AuthScreen
        onLogin={login}
        onRegister={register}
        loading={authLoading}
        error={authError}
        onClearError={clearError}
      />
    )
  }

  // Waiting for socket to connect
  if (!connected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900">
        <p className="text-lg text-stone-400">Connecting to server…</p>
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

  // Home / lobby screen
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
      onLogout={handleLogout}
    />
  )
}
