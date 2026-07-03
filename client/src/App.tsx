import { useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { GAME_EVENTS } from '@towers/shared'
import type { GameConfig, GameStartPayload } from '@towers/shared'
import { socket } from './socket'
import { usePbAuth } from './hooks/usePbAuth'
import { useSocket } from './hooks/useSocket'
import { useGameState } from './hooks/useGameState'
import { useLobby } from './hooks/useLobby'
import { AuthScreen } from './components/AuthScreen'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'
import { ProfilePage } from './pages/ProfilePage'
import { MatchPage } from './pages/MatchPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const navigate = useNavigate()

  const { user: pbUser, token: pbToken, loading: authLoading, error: authError, login, register, logout, clearError } = usePbAuth()

  const username = (pbUser?.username as string | undefined) ?? ''

  const { connected } = useSocket(pbToken)

  const { gameState, gameOver, opponentDisconnected, pendingDrawDiscard, playCard, discardCard, sendDrawDiscardChoice, resetGame } = useGameState()
  const { rooms, currentRoom, error, listRooms, createRoom, joinRoom, leaveRoom, clearError: clearLobbyError } = useLobby()

  useEffect(() => {
    function onGameStart(_payload: GameStartPayload) {
      navigate('/game')
    }
    socket.on(GAME_EVENTS.GAME_START, onGameStart)
    return () => {
      socket.off(GAME_EVENTS.GAME_START, onGameStart)
    }
  }, [navigate])

  const handleBackToLobby = useCallback(() => {
    if (currentRoom) leaveRoom(currentRoom.id)
    resetGame()
    navigate('/')
  }, [currentRoom, leaveRoom, resetGame, navigate])

  const handleCreate = useCallback((turnTimer: number, gameConfig: GameConfig, bot?: 'easy' | 'hard') => {
    createRoom(turnTimer, username, gameConfig, bot)
  }, [createRoom, username])

  const handleJoin = useCallback((roomId: string) => {
    clearLobbyError()
    joinRoom(roomId, username)
  }, [joinRoom, username, clearLobbyError])

  const handleLogout = useCallback(() => {
    if (currentRoom) leaveRoom(currentRoom.id)
    resetGame()
    navigate('/')
    socket.disconnect()
    logout()
  }, [currentRoom, leaveRoom, resetGame, logout, navigate])

  // Public routes (profile + match) work logged-out — render before auth gate.
  // We allow these to short-circuit even when pbUser is null.

  if (!pbUser) {
    return (
      <Routes>
        <Route path="/profile/:username" element={<ProfilePage selfUsername={null} />} />
        <Route path="/match/:id" element={<MatchPage />} />
        <Route
          path="*"
          element={
            <AuthScreen
              onLogin={login}
              onRegister={register}
              loading={authLoading}
              error={authError}
              onClearError={clearError}
            />
          }
        />
      </Routes>
    )
  }

  if (!connected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900">
        <p className="text-lg text-stone-400">Connecting to server…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
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
        }
      />
      <Route
        path="/game"
        element={
          gameState ? (
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
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/profile" element={<Navigate to={`/profile/${username}`} replace />} />
      <Route path="/profile/:username" element={<ProfilePage selfUsername={username} />} />
      <Route path="/match/:id" element={<MatchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
