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
import type { GameOverInfo } from '../hooks/useGameState'

interface GamePageProps {
  gameState: ClientGameState
  gameOver: GameOverInfo | null
  opponentDisconnected: boolean
  onPlayCard: (cardInstanceId: string) => void
  onDiscardCard: (cardInstanceId: string) => void
  onBackToLobby: () => void
}

const MIN_HISTORY_HEIGHT = 32
const DEFAULT_HISTORY_HEIGHT = 160

export function GamePage({
  gameState,
  gameOver,
  opponentDisconnected,
  onPlayCard,
  onDiscardCard,
  onBackToLobby,
}: GamePageProps) {
  const { you, opponent, isYourTurn, turnTimeRemaining } = gameState
  const isWinner = gameOver ? gameOver.winner === you.playerId : false

  const [historyHeight, setHistoryHeight] = useState(DEFAULT_HISTORY_HEIGHT)
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

  return (
    <div className="flex h-screen flex-col bg-stone-900 text-amber-100">
      {/* Top bar with turn indicator */}
      <div className="flex justify-center border-b border-stone-700 bg-stone-800 py-1.5">
        <TurnIndicator
          isYourTurn={isYourTurn}
          turnTimeRemaining={turnTimeRemaining}
        />
      </div>

      {/* Opponent disconnected banner */}
      {opponentDisconnected && (
        <div className="bg-red-900/50 py-1 text-center text-xs text-red-300">
          Opponent disconnected
        </div>
      )}

      {/* Main game area - fills available space */}
      <div className="flex min-h-0 flex-1 px-4 py-2">
        {/* Left side: your resources + tower */}
        <div className="flex min-h-0 gap-3">
          <PlayerStats player={you} side="left" />
          <TowerVisual tower={you.tower} wall={you.wall} side="left" />
        </div>

        {/* Center: deck + last played */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <CardBack />
          <LastPlayedCards history={gameState.history} yourPlayerId={you.playerId} />
        </div>

        {/* Right side: opponent tower + resources */}
        <div className="flex min-h-0 gap-3">
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
        />
      </div>

      {/* Drag handle */}
      <div
        className="flex h-2 flex-shrink-0 cursor-row-resize items-center justify-center border-t border-stone-700 bg-stone-800 hover:bg-stone-700"
        onMouseDown={onDragStart}
      >
        <div className="h-0.5 w-10 rounded-full bg-stone-500" />
      </div>

      {/* History panel - resizable */}
      <div
        className="flex flex-shrink-0 flex-col overflow-hidden bg-stone-950"
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

      {/* Game over modal */}
      {gameOver && (
        <GameOverModal
          isWinner={isWinner}
          winReason={gameOver.winReason}
          onBackToLobby={onBackToLobby}
        />
      )}
    </div>
  )
}
