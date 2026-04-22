import { useCallback, useRef, useState } from 'react'
import type { ClientGameState } from '@towers/shared'
import { PlayerStats } from '../components/PlayerStats'
import { TowerVisual } from '../components/TowerVisual'
import { LastPlayedCards } from '../components/LastPlayedCards'
import { CardBack } from '../components/CardBack'
import { TurnIndicator } from '../components/TurnIndicator'
import { Hand } from '../components/Hand'
import { GameOverModal } from '../components/GameOverModal'
import { GameHistory } from '../components/GameHistory'
import { SettingsModal } from '../components/SettingsModal'
import type { GameOverInfo } from '../hooks/useGameState'

interface GamePageProps {
  gameState: ClientGameState
  gameOver: GameOverInfo | null
  opponentDisconnected: boolean
  onPlayCard: (cardInstanceId: string) => void
  onDiscardCard: (cardInstanceId: string) => void
  onDrawDiscardChoice: (cardInstanceId: string) => void
  pendingDrawDiscard: boolean
  onBackToLobby: () => void
  turnTimer: number
}

const MIN_HISTORY_HEIGHT = 32
const DEFAULT_HISTORY_HEIGHT = 160

export function GamePage({
  gameState,
  gameOver,
  opponentDisconnected,
  onPlayCard,
  onDiscardCard,
  onDrawDiscardChoice,
  pendingDrawDiscard,
  onBackToLobby,
  turnTimer,
}: GamePageProps) {
  const { you, opponent, isYourTurn } = gameState
  const isWinner = gameOver ? gameOver.winner === you.playerId : false

  const [historyHeight, setHistoryHeight] = useState(DEFAULT_HISTORY_HEIGHT)
  const [showSettings, setShowSettings] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const dragging = useRef(false)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const startY = e.clientY
    const startHeight = historyHeight

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return
      const delta = startY - ev.clientY
      const newHeight = Math.max(MIN_HISTORY_HEIGHT, startHeight + delta)
      setHistoryHeight(newHeight)
    }

    function onMouseUp() {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [historyHeight])

  const handleLeaveGame = useCallback(() => {
    setShowLeaveConfirm(false)
    onBackToLobby()
  }, [onBackToLobby])

  return (
    <div className="flex h-screen flex-col bg-stone-900 text-amber-100">
      {/* Top bar: title + room info + settings/leave */}
      <div className="flex items-center justify-between border-b border-stone-700 bg-stone-800 px-4 py-1.5">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-amber-400">Two Towers</span>
          <span className="text-xs text-stone-500">
            {turnTimer > 0 && `${turnTimer}s turns`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings gear */}
          <button
            className="rounded p-1.5 text-stone-400 hover:bg-stone-700 hover:text-amber-300"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Leave game button */}
          <button
            className="rounded p-1.5 text-red-400 hover:bg-red-900/50 hover:text-red-300"
            onClick={() => setShowLeaveConfirm(true)}
            title="Leave Game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Opponent disconnected banner */}
      {opponentDisconnected && (
        <div className="bg-red-900/50 py-1 text-center text-xs text-red-300">
          Opponent disconnected
        </div>
      )}

      {/* Main game area - fills available space */}
      <div className="flex min-h-0 flex-1 px-1 py-1 sm:px-4 sm:py-2">
        {/* Left side: your resources + tower */}
        <div className="flex min-h-0 gap-1 sm:gap-3">
          <PlayerStats player={you} side="left" />
          <TowerVisual tower={you.tower} wall={you.wall} side="left" />
        </div>

        {/* Center: deck + last played + turn indicator at bottom */}
        <div className="flex flex-1 flex-col items-center">
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <CardBack />
            <LastPlayedCards history={gameState.history} yourPlayerId={you.playerId} />
          </div>
          {/* Turn indicator anchored at bottom of center, aligned with tower bases */}
          <div className="mb-2">
            <TurnIndicator
              isYourTurn={isYourTurn}
              turnTimer={gameState.turnTimer}
              timerKey={gameState.timerKey}
            />
          </div>
        </div>

        {/* Right side: opponent tower + resources */}
        <div className="flex min-h-0 gap-1 sm:gap-3">
          <TowerVisual tower={opponent.tower} wall={opponent.wall} side="right" />
          <PlayerStats player={opponent} side="right" />
        </div>
      </div>

      {/* Hand area */}
      <div className="border-t border-stone-700 bg-stone-800">
        <Hand
          hand={you.hand}
          player={you}
          isYourTurn={isYourTurn}
          onPlay={onPlayCard}
          onDiscard={onDiscardCard}
          pendingDrawDiscard={pendingDrawDiscard}
          onDrawDiscardChoice={onDrawDiscardChoice}
        />
      </div>

      {/* Drag handle */}
      <div
        className="hidden h-2 flex-shrink-0 cursor-row-resize items-center justify-center border-t border-stone-700 bg-stone-800 hover:bg-stone-700 sm:flex"
        onMouseDown={onDragStart}
      >
        <div className="h-0.5 w-10 rounded-full bg-stone-500" />
      </div>

      {/* History panel - resizable */}
      <div
        className="hidden flex-shrink-0 flex-col overflow-hidden bg-stone-950 sm:flex"
        style={{ height: historyHeight }}
      >
        <div className="flex items-center justify-between border-b border-stone-800 px-3 py-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">History</span>
          <span className="text-xs text-stone-600">{gameState.history.length} moves</span>
        </div>
        <div className="min-h-0 flex-1">
          <GameHistory history={gameState.history} yourPlayerId={you.playerId} />
        </div>
      </div>

      {/* Mobile history collapsed bar */}
      <button
        className="flex flex-shrink-0 items-center justify-between border-t border-stone-700 bg-stone-950 px-3 py-1.5 text-xs text-stone-500 sm:hidden"
        onClick={() => setHistoryOpen(true)}
      >
        <span className="font-bold uppercase tracking-wider">History · {gameState.history.length} moves</span>
        <span aria-hidden>▲</span>
      </button>

      {/* Mobile history sheet */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setHistoryOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-x-0 bottom-0 flex h-[60vh] flex-col rounded-t-xl bg-stone-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 px-3 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">History</span>
                <span className="text-xs text-stone-600">{gameState.history.length} moves</span>
              </div>
              <button
                className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-amber-300"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close history"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <GameHistory history={gameState.history} yourPlayerId={you.playerId} />
            </div>
          </div>
        </div>
      )}

      {/* Game over modal */}
      {gameOver && (
        <GameOverModal
          isWinner={isWinner}
          winReason={gameOver.winReason}
          onBackToLobby={onBackToLobby}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          turnTimer={turnTimer}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Leave game confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowLeaveConfirm(false)}>
          <div
            className="flex flex-col items-center gap-4 rounded-xl border border-stone-600 bg-stone-800 px-10 py-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-red-400">Leave Game?</h2>
            <p className="text-center text-sm text-stone-300">
              Leaving will forfeit the match.<br />
              Your opponent will win.
            </p>
            <div className="flex gap-3">
              <button
                className="rounded bg-stone-700 px-5 py-2 text-sm font-bold text-stone-300 hover:bg-stone-600"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-600"
                onClick={handleLeaveGame}
              >
                Leave & Forfeit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
