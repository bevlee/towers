import { useEffect, useState, useCallback } from 'react'
import type { ClientGameState } from '@towers/shared'
import { GAME_EVENTS } from '@towers/shared'
import type { GameStartPayload, GameStatePayload, GameOverPayload, OpponentDisconnectedPayload } from '@towers/shared'
import { socket } from '../socket'

export interface GameOverInfo {
  winner: string
  winReason: string
  finalState: ClientGameState
}

export function useGameState() {
  const [gameState, setGameState] = useState<ClientGameState | null>(null)
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null)
  const [opponentDisconnected, setOpponentDisconnected] = useState(false)

  useEffect(() => {
    function onGameStart(payload: GameStartPayload) {
      if (payload.gameState) {
        setGameState(payload.gameState)
      }
    }

    function onGameState(payload: GameStatePayload) {
      if (payload.gameState) {
        setGameState(payload.gameState)
      }
    }

    function onGameOver(payload: GameOverPayload) {
      setGameOver({
        winner: payload.winner,
        winReason: payload.winReason,
        finalState: payload.finalState,
      })
      setGameState(payload.finalState)
    }

    function onOpponentDisconnected(_payload: OpponentDisconnectedPayload) {
      setOpponentDisconnected(true)
    }

    socket.on(GAME_EVENTS.GAME_START, onGameStart)
    socket.on(GAME_EVENTS.GAME_STATE, onGameState)
    socket.on(GAME_EVENTS.GAME_OVER, onGameOver)
    socket.on(GAME_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected)

    return () => {
      socket.off(GAME_EVENTS.GAME_START, onGameStart)
      socket.off(GAME_EVENTS.GAME_STATE, onGameState)
      socket.off(GAME_EVENTS.GAME_OVER, onGameOver)
      socket.off(GAME_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected)
    }
  }, [])

  const playCard = useCallback((cardInstanceId: string) => {
    socket.emit(GAME_EVENTS.PLAY_CARD, { cardInstanceId })
  }, [])

  const discardCard = useCallback((cardInstanceId: string) => {
    socket.emit(GAME_EVENTS.DISCARD_CARD, { cardInstanceId })
  }, [])

  const resetGame = useCallback(() => {
    setGameState(null)
    setGameOver(null)
    setOpponentDisconnected(false)
  }, [])

  return { gameState, gameOver, opponentDisconnected, playCard, discardCard, resetGame }
}
