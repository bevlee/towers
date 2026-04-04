import type { ClientGameState } from '@towers/shared'
import { PlayerStats } from '../components/PlayerStats'
import { TowerVisual } from '../components/TowerVisual'
import { DeckInfo } from '../components/DeckInfo'
import { TurnIndicator } from '../components/TurnIndicator'
import { Hand } from '../components/Hand'
import { GameOverModal } from '../components/GameOverModal'
import type { GameOverInfo } from '../hooks/useGameState'

interface GamePageProps {
  gameState: ClientGameState
  gameOver: GameOverInfo | null
  opponentDisconnected: boolean
  onPlayCard: (cardInstanceId: string) => void
  onDiscardCard: (cardInstanceId: string) => void
  onBackToLobby: () => void
}

export function GamePage({
  gameState,
  gameOver,
  opponentDisconnected,
  onPlayCard,
  onDiscardCard,
  onBackToLobby,
}: GamePageProps) {
  const { you, opponent, isYourTurn, deckSize, turnTimeRemaining, gameTimeRemaining } = gameState

  const isWinner = gameOver ? gameOver.winner === you.playerId : false

  return (
    <div className="flex h-screen flex-col bg-stone-900 text-amber-100">
      {/* Top bar with turn indicator */}
      <div className="flex justify-center border-b border-stone-700 bg-stone-800 py-2">
        <TurnIndicator
          isYourTurn={isYourTurn}
          turnTimeRemaining={turnTimeRemaining}
          gameTimeRemaining={gameTimeRemaining}
        />
      </div>

      {/* Opponent disconnected banner */}
      {opponentDisconnected && (
        <div className="bg-red-900/50 py-2 text-center text-sm text-red-300">
          Opponent disconnected
        </div>
      )}

      {/* Last played card */}
      {gameState.lastPlayedCard && (
        <div className="bg-stone-800/50 py-1 text-center text-xs text-stone-400">
          {gameState.lastPlayedCard.playedBy === you.playerId ? 'You' : opponent.username} played{' '}
          <span className="font-bold text-amber-300">{gameState.lastPlayedCard.cardName}</span>
        </div>
      )}

      {/* Main game area */}
      <div className="flex flex-1 items-center justify-center gap-8 px-6">
        {/* Your stats */}
        <PlayerStats player={you} side="left" />

        {/* Your tower */}
        <TowerVisual tower={you.tower} wall={you.wall} side="left" label={you.username} />

        {/* Deck */}
        <DeckInfo deckSize={deckSize} />

        {/* Opponent tower */}
        <TowerVisual tower={opponent.tower} wall={opponent.wall} side="right" label={opponent.username} />

        {/* Opponent stats */}
        <PlayerStats player={opponent} side="right" />
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
