# Profile & Match History — Design

## Goals

1. Fix stats recording so it fires on every game ending (currently only fires on play-card wins).
2. Add a public, paginated profile page showing wins/losses and match history.
3. Add a public match detail page showing turn-by-turn card plays.
4. Lock down stats so only the server (superuser auth) can write them.

## Architecture

**Routing.** Add `react-router-dom` v7. Routes:

- `/` — lobby
- `/game` — active game
- `/profile` — own profile (auth-required)
- `/profile/:username` — anyone's profile (public)
- `/match/:id` — match detail (public)

**Data flow.** Server (superuser) writes to PocketBase on game end. Client reads PocketBase directly via the `pb` instance for stats/history. PocketBase API rules enforce public-read, superuser-write.

## PocketBase API rules

Set via setup script after collection creation:

- `users`: `listRule=""`, `viewRule=""`, `createRule=""` (public registration), `updateRule=null`, `deleteRule=null` — full lockdown on updates so users can't tamper with stats.
- `game_results`: `listRule=""`, `viewRule=""`, all writes `null`.
- `card_plays`: same as `game_results`.

## Stats Recording Fix

`gameHandlers.ts` currently calls `recordGameResult` only in the play-card win path. Post-resource-generation wins (lines 132 & 184) and lobby paths (forfeit, AFK timeout) skip stats.

**Fix.** Centralize the call inside `emitGameOverToBoth` in [server/src/handlers/emit.ts](../../server/src/handlers/emit.ts):

```ts
export function emitGameOverToBoth(io, room, winner, winReason) {
  // existing emit logic...

  const pbIds: Record<string, string> = {}
  if (room.player1?.pbUserId) pbIds[room.player1.playerId] = room.player1.pbUserId
  if (room.player2?.pbUserId) pbIds[room.player2.playerId] = room.player2.pbUserId
  if (room.gameState) recordGameResult(room.gameState, pbIds)
}
```

Remove explicit `recordGameResult` calls in `gameHandlers.ts` and `lobbyHandlers.ts` to avoid double-recording.

## Schema change: card_plays.sequence

Turns alternate per-player, but a single turn may contain multiple plays (play → play-again, play → draw-discard). Add `sequence: number` to `card_plays` so plays within a turn order deterministically.

`statsRecorder.ts` computes sequence by tracking running counts per `(turn_number, player)` while walking `state.history`.

## Profile Page

**Self vs other.** `/profile` renders own profile when logged in. `/profile/:username` fetches by username.

**Data fetch:**
```ts
const user = await pb.collection('users').getFirstListItem(`username="${username}"`)
const result = await pb.collection('game_results').getList(page, 10, {
  filter: `winner="${user.id}" || loser="${user.id}"`,
  sort: '-created',
  expand: 'winner,loser',
})
```

**Layout.** Stats summary at top (W/L/ratio + win-type breakdown), match history table below with numbered pagination. Each match row links to `/match/:id`. Opponent names link to `/profile/:opponentUsername`.

**Pagination.** URL-driven via `useSearchParams()`. `?page=N` defaults to 1.

## Match Detail Page

**Route.** `/match/:id`

**Data fetch:**
```ts
const match = await pb.collection('game_results').getOne(matchId, { expand: 'winner,loser' })
const plays = await pb.collection('card_plays').getFullList({
  filter: `game="${matchId}"`,
  sort: 'turn_number,sequence',
  expand: 'player',
})
```

**Layout.** Match summary header (winner, win reason, turn count, date), then turn-by-turn list. Plays come back sorted; group by `turn_number` (each group is one player since turns alternate), render as `Turn N — {playerName}` followed by bulleted actions.

**Action verbs.** `play` → "played", `discard` → "discarded", `timeout_discard` → "timeout-discarded".

## File Plan

**Server:**
1. [server/src/handlers/emit.ts](../../server/src/handlers/emit.ts) — move `recordGameResult` into `emitGameOverToBoth`
2. [server/src/handlers/gameHandlers.ts](../../server/src/handlers/gameHandlers.ts) — remove explicit call
3. [server/src/statsRecorder.ts](../../server/src/statsRecorder.ts) — compute and persist `sequence`

**Setup:**
4. [k8s/pocketbase/setup-configmap.yaml](../../k8s/pocketbase/setup-configmap.yaml) — add `sequence`, set API rules

**Client:**
5. Install `react-router-dom`
6. [client/src/App.tsx](../../client/src/App.tsx) — `<BrowserRouter>` + routes
7. New: `client/src/pages/ProfilePage.tsx`
8. New: `client/src/pages/MatchPage.tsx`
9. New: `client/src/hooks/useProfile.ts`
10. New: `client/src/hooks/useMatch.ts`
11. [client/src/pages/HomePage.tsx](../../client/src/pages/HomePage.tsx) — "View Profile" link in header

## Implementation Order

1. Setup script (schema + rules) → re-run job
2. Server fixes → rebuild server image
3. Client (routing + pages) → rebuild client image
