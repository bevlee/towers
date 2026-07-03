# Bot Opponents: Easy (Greedy) and Hard (MCTS)

Date: 2026-07-03

## Goal

Let a player start a single-player game against a server-side bot at two
difficulty levels:

- **Easy** — greedy single-turn evaluation: simulate each legal action with the
  existing pure card engine, score the resulting state, play the best.
- **Hard** — the greedy policy plus *provable* tactics: an exhaustive search
  for same-turn forced wins (play-again chains from the current hand), which
  greedy's one-action horizon misses. Strictly never worse than easy.

## Architecture

The game is server-authoritative and all state transitions already flow through
pure functions (`cardEngine`, `TurnManager` state methods, `winChecker`). The
bot lives entirely on the server in a new `server/src/bot/` module and acts by
calling the same `TurnManager` methods the socket handlers use — no fake
sockets.

```
server/src/bot/
├── evaluate.ts    State evaluation function (shared by both bots)
├── greedy.ts      Easy bot: pick best action by one-ply simulation
├── hardSearch.ts  Hard bot: greedy + provable same-turn forced-win chains
├── simulate.ts    Pure "apply action + advance turn" used by both bots
└── botRunner.ts   Orchestration: schedule/execute bot turns, emit state
```

### Bot identity

A bot fills the `player2` slot of a room with
`playerId: 'bot:<uuid>'`, `username: 'Bot (Easy)' | 'Bot (Hard)'`, and
`socketId: 'bot'`. Emitting to socket id `'bot'` is a harmless no-op, so all
existing emit helpers work unchanged. `Room` gains
`botDifficulty?: 'easy' | 'hard'`.

Bot rooms never appear in the lobby list (player2 is set at creation). The
stats recorder already skips games where either player lacks a PocketBase user
id, so bot games are not recorded.

### Turn scheduling

`maybeScheduleBotTurn(io, roomId, roomManager, turnManager)` is called after
every point where a turn (re)starts: game start, after a card play, after a
discard, after a draw-discard choice, and after a turn timeout. It checks
whether the current player is a bot and, if so, schedules `runBotTurn` after a
short "thinking" delay (~1s). The normal turn timer still runs for bot turns as
a safety net (random discard on timeout).

`runBotTurn` re-validates the room/turn (the room may have closed while the
delay ran), chooses an action with the difficulty-appropriate policy, then
mirrors the socket-handler flow: play/discard via `TurnManager`, record
history, check win, generate resources, emit state, restart the timer, and
re-schedule itself on play-again. Draw-discard cards (Prism / Elven Scout) are
resolved inline — the bot draws, discards its lowest-value card, draws the
replacement, and continues — no request/response round trip.

When the human leaves or disconnects, the existing forfeit flow runs; the room
is then deleted outright (a bot must not hold a room open). A pending bot move
that fires after cleanup no-ops via its guards.

## Easy bot (greedy)

For each card in hand:

- **Play** (if affordable): run `cardEngine.playCard` on the current state
  (all transitions are non-mutating), score the result with `evaluate`, add a
  small bonus for play-again. An immediate win scores +∞; an immediate loss −∞.
- **Discard**: scored as the current state minus a small tempo penalty, using
  the hand card with the lowest *potential* (its simulated play gain, ignoring
  affordability), never a `canDiscard: false` card.

Highest score wins. Draw-discard choices use the same lowest-potential rule.

### Evaluation function

`evaluate(state, botIndex)` = `score(bot) − score(opponent)` where

```
score(p) = 3.0·tower + 1.0·wall
         + 8.0·(mineLevel + monasteryLevel + barracksLevel)
         + 0.4·(ore + mana + troops)
         + proximity bonuses: tower near 50, resources near 150
```

Terminal states short-circuit via `checkWin` to ±10000.

## Hard bot (greedy + provable forced wins)

The hard bot plays exactly like the easy bot, with one exception: before
falling back to greedy it runs an exhaustive depth-first search for a
**same-turn forced win** — a single winning play, or a chain of play-again
cards from the current hand ending in one (e.g. Quartz → Ruby to cross the
tower threshold). Everything that search sees is public and exact (own hand,
own resources, opponent tower/wall), so a found win is provable rather than
sampled, and taking it has zero downside. The chain search runs on a drawless
state copy and skips draw-discard cards, so it can never lean on unknown
replacement draws.

Result: strictly never worse than the easy bot; measured 32–28 over 60
head-to-head games (the tactic fires rarely between eval-twins, but it never
misfires — and against humans it punishes every lethal left on the board).

### Dead ends, and why (all measured head-to-head vs the easy bot)

- **Per-determinization UCT trees, random rollouts** — 7/20. Random playouts
  are noise in this game and the budget fragments across trees.
- **Single-tree ISMCTS, eval-guided rollouts** — 6/12. Better, but ~1s of
  sampled rollouts still leaves root statistics noisier than a direct
  evaluation.
- **Paranoid alpha-beta over sampled hands** — 1/3 stopped early. One sampled
  lethal reply scores −WIN_SCORE and swamps the mean: the bot defends against
  ghosts and bleeds tempo.
- **Action-counted depth** — 3/9. Any play-again shifts a line's evaluation
  cutoff to just after the bot's own move, systematically overranking chain
  and hoard lines (traces showed 40+ mana hoarded while the opponent raced).
- **Ungated turn-depth search** — 7/9, 7/7, 7/7. Sound behaviour, but its
  positional deviations from greedy are as often noise as signal; mirror
  matches end up luck-dominated.
- **Mean-margin gating** — 22/50. Overrides still fired on probabilistic
  threats present only in a minority of sampled worlds; against the actual
  opponent most were mirages and the "denial" moves bled tempo.
- **Paired per-sample dominance gating** — 19/50. Even sample-dominant
  *defensive* overrides suffer a horizon-postponement mirage: "delaying beats
  racing within N turns in every sampled world" is true even in positions
  where racing is the only real winning line.
- **Sampled win/loss-certainty overrides** — 19/50, 24/60. "Certain across
  12 sampled worlds" still is not certain: the real opponent hand or the real
  next draw can break the line, and the misfires land exactly at critical
  moments. Only the drawless current-hand forced-win search (zero sampling)
  survived measurement.

The consistent lesson: in this game a good one-ply evaluation plays near the
strength ceiling of eval-driven agents, and determinized lookahead adds value
only where its conclusion needs no hidden information at all. Meaningful
further strength likely requires a better evaluation function or a learned
policy (self-play RL), not more search.

`simulate.ts` provides `applyAction(state, action)` that reproduces the full
turn flow (cost, effects, win check, draws, play-again, draw-discard
auto-resolution, turn switch, resource generation) using `TurnManager`'s pure
methods, so search states advance exactly like real games.

The search runs in chunks yielded through `setImmediate` so a 1-second think
never blocks the event loop.

## Lobby & client changes

- `CREATE_ROOM` payload gains optional `bot: 'easy' | 'hard'`. When present the
  server creates the room, seats the bot as player2, and starts the game
  immediately (game-start logic extracted from `JOIN_ROOM` into a shared
  helper).
- `CreateGameModal`'s Game Mode select gains "Vs Computer (Easy)" and
  "Vs Computer (Hard)" options; `useLobby.createRoom` and `HomePage` pass the
  difficulty through.

## Testing

- `evaluate.test.ts` — ordering properties (more tower/income/resources better,
  terminal states dominate).
- `greedy.test.ts` — takes a lethal play; prefers strongest affordable card;
  discards lowest-potential card when nothing is playable; never discards
  Lodestone.
- `hardSearch.test.ts` — always returns a legal action; finds a one-card
  lethal and a two-step play-again lethal chain; terminates on play-again
  cards with no win (drawless reshuffle regression); falls back to greedy.
- `simulate.test.ts` — turn flow parity: play-again keeps the turn,
  draw-discard nets the right hand size, resources generate on turn switch.
- `botRunner` integration test with a stub `io` — bot room plays to completion
  against scripted human moves.
- Strength check (manual script, not CI): hard beats easy in a majority of
  simulated matches.
