import { useEffect, useState, useCallback } from 'react'
import type { ClientGameState, CardInstance } from '@towers/shared'
import { GAME_EVENTS } from '@towers/shared'
import type { GameStartPayload, GameStatePayload, GameOverPayload, OpponentDisconnectedPayload, DrawDiscardRequestPayload } from '@towers/shared'
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
  const [pendingDrawDiscard, setPendingDrawDiscard] = useState(false)

  useEffect(() => {
    function onGameStart(payload: GameStartPayload) {
      if (payload.gameState) {
        setGameState(payload.gameState)
      }
    }

    function onGameState(payload: GameStatePayload) {
      if (payload.gameState) {
        setGameState(payload.gameState)
        // Server has resolved the draw-discard phase (timeout path or normal flow)
        setPendingDrawDiscard(false)
      }
    }

    function onDrawDiscardRequest(payload: DrawDiscardRequestPayload) {
      // Update the hand to include the newly drawn card before asking the player to discard
      setGameState((prev) => {
        if (!prev) return prev
        return { ...prev, you: { ...prev.you, hand: payload.hand as CardInstance[] } }
      })
      setPendingDrawDiscard(true)
    }

    function onGameOver(payload: GameOverPayload) {
      setGameOver({
        winner: payload.winner,
        winReason: payload.winReason,
        finalState: payload.finalState,
      })
      setGameState(payload.finalState)
      setPendingDrawDiscard(false)
    }

    function onOpponentDisconnected(_payload: OpponentDisconnectedPayload) {
      setOpponentDisconnected(true)
    }

    socket.on(GAME_EVENTS.GAME_START, onGameStart)
    socket.on(GAME_EVENTS.GAME_STATE, onGameState)
    socket.on(GAME_EVENTS.DRAW_DISCARD_REQUEST, onDrawDiscardRequest)
    socket.on(GAME_EVENTS.GAME_OVER, onGameOver)
    socket.on(GAME_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected)

    return () => {
      socket.off(GAME_EVENTS.GAME_START, onGameStart)
      socket.off(GAME_EVENTS.GAME_STATE, onGameState)
      socket.off(GAME_EVENTS.DRAW_DISCARD_REQUEST, onDrawDiscardRequest)
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

  const sendDrawDiscardChoice = useCallback((cardInstanceId: string) => {
    socket.emit(GAME_EVENTS.DRAW_DISCARD_CHOICE, { discardCardInstanceId: cardInstanceId })
    setPendingDrawDiscard(false)
  }, [])

  const resetGame = useCallback(() => {
    setGameState(null)
    setGameOver(null)
    setOpponentDisconnected(false)
    setPendingDrawDiscard(false)
  }, [])

  return { gameState, gameOver, opponentDisconnected, pendingDrawDiscard, playCard, discardCard, sendDrawDiscardChoice, resetGame }
}
