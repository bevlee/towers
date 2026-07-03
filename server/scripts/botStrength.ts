/**
 * Pit the hard bot against the easy (greedy) bot and report the win rate.
 * Not part of CI — run manually when tuning either bot:
 *
 *   cd server && npx tsx scripts/botStrength.ts [games]
 */
import { createGame, defaultGameConfig } from '../src/gameState.js'
import { applyAction, legalActions } from '../src/bot/simulate.js'
import { chooseGreedyAction } from '../src/bot/greedy.js'
import { chooseHardAction } from '../src/bot/hardSearch.js'

const GAMES = Number(process.argv[2] ?? 16)
const MAX_PLIES = 600

async function playGame(hardIndex: 0 | 1): Promise<string> {
  let state = createGame('greedy', 'Greedy', 'hard', 'Hard', 20, defaultGameConfig())

  // Mirror the live flow: resources generate for the first player's first turn
  const p0 = state.players[0]
  state = {
    ...state,
    players: [
      {
        ...p0,
        ore: p0.ore + p0.mineLevel,
        mana: p0.mana + p0.monasteryLevel,
        troops: p0.troops + p0.barracksLevel,
      },
      state.players[1],
    ],
  }

  for (let ply = 0; ply < MAX_PLIES; ply++) {
    if (state.phase === 'finished') return state.winner!
    const idx = state.currentPlayerIndex
    const action =
      idx === hardIndex
        ? await chooseHardAction(state, idx)
        : chooseGreedyAction(state, idx)
    if (!action) {
      const acts = legalActions(state, idx)
      if (acts.length === 0) return state.players[idx === 0 ? 1 : 0].playerId
      state = applyAction(state, acts[0]).state
      continue
    }
    state = applyAction(state, action).state
  }
  return 'draw'
}

async function main() {
  const results: Record<string, number> = { hard: 0, greedy: 0, draw: 0 }
  for (let i = 0; i < GAMES; i++) {
    const hardIndex = (i % 2) as 0 | 1
    const winner = await playGame(hardIndex)
    results[winner] = (results[winner] ?? 0) + 1
    console.log(`game ${i + 1}: hard as p${hardIndex}, winner=${winner}`)
  }
  console.log(JSON.stringify(results))
}

main()
