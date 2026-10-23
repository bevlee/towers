import { useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { GAME_EVENTS } from '@towers/shared'
import type { GameConfig, GameStartPayload } from '@towers/shared'
import { socket } from './socket'
import { useIdentity } from './hooks/useIdentity'
import { useSocket } from './hooks/useSocket'
import { useGameState } from './hooks/useGameState'
import { useLobby } from './hooks/useLobby'
import { AuthScreen, NameScreen } from './components/AuthScreen'
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

  const { identity, error: authError, chooseName, playAsGuest, logout } = useIdentity()

  const player = identity.status === 'account' || identity.status === 'guest' ? identity : null
  const isGuest = player?.status === 'guest'
  const username = player?.username ?? ''

  const { connected } = useSocket(player !== null, isGuest ? username : null)

  const { gameState, gameOver, opponentDisconnected, pendingDrawDiscard, playCard, discardCard, sendDrawDiscardChoice, resetGame } = useGameState()
  const { rooms, currentRoom, error, listRooms, createRoom, joinRoom, leaveRoom, clearError: clearLobbyError } = useLobby()

  useEffect(() => {
    function onGameStart(_payload: GameStartPayload) {
      clearLobbyError()
      navigate('/game')
    }
    socket.on(GAME_EVENTS.GAME_START, onGameStart)
    return () => {
      socket.off(GAME_EVENTS.GAME_START, onGameStart)
    }
  }, [navigate, clearLobbyError])

  const handleBackToLobby = useCallback(() => {
    if (currentRoom) leaveRoom(currentRoom.id)
    resetGame()
    clearLobbyError()
    navigate('/')
  }, [currentRoom, leaveRoom, resetGame, clearLobbyError, navigate])

  const handleCreate = useCallback((turnTimer: number, gameConfig: GameConfig, bot?: 'easy' | 'hard') => {
    createRoom(turnTimer, username, gameConfig, bot)
  }, [createRoom, username])

  const handleJoin = useCallback((roomId: string) => {
    clearLobbyError()
    joinRoom(roomId, username)
  }, [joinRoom, username, clearLobbyError])

  const handleLogout = useCallback(async () => {
    if (!(await logout())) return
    if (currentRoom) leaveRoom(currentRoom.id)
    resetGame()
    navigate('/')
    socket.disconnect()
  }, [currentRoom, leaveRoom, resetGame, logout, navigate])

  // Public routes (profile + match) work without a player — render before the gate.
  if (!player) {
    return (
      <Routes>
        <Route path="/profile/:username" element={<ProfilePage selfUsername={null} />} />
        <Route path="/match/:id" element={<MatchPage />} />
        <Route
          path="*"
          element={
            identity.status === 'needsName'
              ? <NameScreen onChooseName={chooseName} onSignOut={() => void logout()} />
              : <AuthScreen loading={identity.status === 'loading'} error={authError} onPlayAsGuest={playAsGuest} />
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
            error={error ?? authError}
            username={username}
            isGuest={isGuest}
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
              error={error}
              onClearError={clearLobbyError}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/profile" element={<Navigate to={isGuest ? '/' : `/profile/${username}`} replace />} />
      <Route path="/profile/:username" element={<ProfilePage selfUsername={isGuest ? null : username} />} />
      <Route path="/match/:id" element={<MatchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
