# Two Towers

A real-time multiplayer card game based on Arcomage / Two Towers from Lords of War and Money. Players build towers, fortify walls, gather resources, and attack each other using a shared deck of 78 unique card types.

## Quick Start

From the monorepo root:

```bash
npm run dev:towers
```

Or from the `towers/` directory:

```bash
npm run dev
```

This starts both the server (port 3001) and client (port 5174) concurrently.

Open two browser tabs at `http://localhost:5174`, enter a username, create a room in one tab, and join it from the other.

## Project Structure

```
towers/
├── shared/          Shared types, card definitions, constants, events
├── server/          Node.js + Express + Socket.IO game server
├── client/          React + TypeScript + Vite + Tailwind frontend
└── package.json     Root dev script (concurrently runs server + client)
```

### Shared (`shared/`)

| File | Purpose |
|------|---------|
| `src/types.ts` | All game types: PlayerState, GameState, ClientGameState, CardEffect union |
| `src/cards.ts` | 78 card definitions with structured effect arrays |
| `src/constants.ts` | Starting values, win thresholds, hand size, timers |
| `src/events.ts` | Socket.IO event names and typed payloads |

### Server (`server/`)

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point: Express + Socket.IO setup |
| `src/cardEngine.ts` | Pure functions: execute card effects, cost checks |
| `src/damageResolver.ts` | Wall-absorb and direct damage logic |
| `src/winChecker.ts` | Three win condition checks |
| `src/deckManager.ts` | Build, shuffle, deal, draw |
| `src/turnManager.ts` | Turn flow, timers, resource generation |
| `src/gameState.ts` | Create games, project client-safe state |
| `src/roomManager.ts` | In-memory room CRUD |
| `src/handlers/lobbyHandlers.ts` | Create/join/list room events |
| `src/handlers/gameHandlers.ts` | Play card, discard, timeout events |

### Client (`client/`)

| File | Purpose |
|------|---------|
| `src/App.tsx` | State router: username entry, home, game |
| `src/pages/HomePage.tsx` | Tavern lobby with room list and create form |
| `src/pages/GamePage.tsx` | Main game board layout |
| `src/components/Card.tsx` | Individual card with colored border, effect text, cost |
| `src/components/CardBack.tsx` | Face-down card visual shown in the center of the board |
| `src/components/CreateGameModal.tsx` | Modal for naming a room and choosing the turn timer |
| `src/components/GameHistory.tsx` | Scrollable log of all played/discarded cards |
| `src/components/GameList.tsx` | Table of open rooms with join buttons |
| `src/components/GameOverModal.tsx` | Win/loss overlay |
| `src/components/Hand.tsx` | Row of 6 cards at screen bottom |
| `src/components/LastPlayedCards.tsx` | Card(s) played on the most recent turn, shown center board |
| `src/components/PlayerStats.tsx` | Resource panel (ore, mana, troops) with animated deltas |
| `src/components/SettingsModal.tsx` | In-game overlay showing room name, timer, and rule constants |
| `src/components/TowerVisual.tsx` | Tower and wall height bars with brick animations |
| `src/components/TurnIndicator.tsx` | Your/Opponent's Turn badge and countdown timer |

## Docker

Build and push both images from the monorepo root:

```bash
# client
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t bevdev1/towers-client:v1.0 \
  -f client/Dockerfile \
  . \
  --push

# server
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t bevdev1/towers-server:v1.0 \
  -f server/Dockerfile \
  . \
  --push
```

The client image accepts a `SERVER_URL` environment variable at runtime:

```bash
docker run -e SERVER_URL=https://game.example.com -p 80:80 bevdev1/towers-client:v1.0
```

## Configuration

Environment variables (all optional, with defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `TOWERS_PORT` | `3001` | Server port |
| `TOWERS_CLIENT_ORIGIN` | `http://localhost:5174` | CORS allowed origin |

## Development

### Run tests

```bash
cd towers/server
npx vitest run
```

### Type check

```bash
cd towers/shared && npx tsc --noEmit
cd towers/server && npx tsc --noEmit
cd towers/client && npx tsc --noEmit
```

### Build client

```bash
cd towers/client
npx vite build
```

## Architecture

- **Server-authoritative**: The server holds the full game state including both hands and deck order. Clients receive a projected view that hides the opponent's hand.
- **Pure card engine**: Card effects, damage resolution, and win checking are pure functions with no side effects, making them easy to test.
- **Socket.IO events**: All communication is real-time via WebSockets. The lobby and game use separate event handler modules.
- **In-memory state**: Rooms and game state are stored in memory. No database required.

## Game Rules

See [gameRules.md](gameRules.md) for a full breakdown of game mechanics, card types, and win conditions.
