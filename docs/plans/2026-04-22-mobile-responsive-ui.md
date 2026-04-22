# Mobile Responsive UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the game UI usable on mobile (portrait, ~375px wide) without clipping the opponent's tower, resources, or cards.

**Architecture:** CSS-only responsive using Tailwind's `sm:` breakpoint (640px). Same component tree on all viewports; sizes scale down below 640px via responsive class variants. Only the history panel swaps structure on mobile (collapsed bar + slide-up sheet in place of the resizable desktop panel), gated by one piece of React state.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite.

**Verification model:** No test suite exists in this repo. Each task is verified by:
1. `npm run build` (runs `tsc -b && vite build`) from `client/` — catches type errors and ensures the build still works.
2. Manual browser check at 375px width (Chrome DevTools device toolbar, iPhone SE preset) and at ≥640px width to confirm desktop is unchanged.

**Dev server command:** `cd client && npm run dev` — Vite serves at `http://localhost:5173`. To view the game page, you need two browser tabs connected to the same room. Alternatively, temporarily inspect `GamePage` with mock props via `App.tsx` — but the simplest path is to run the server (`cd server && npm start`) and play a real game against yourself in two tabs.

**Design reference:** [`docs/plans/2026-04-22-mobile-responsive-ui-design.md`](./2026-04-22-mobile-responsive-ui-design.md)

---

## Conventions Used in This Plan

- **Responsive class pattern:** unprefixed classes apply at all widths; `sm:` prefixed classes override at ≥640px. Example: `w-14 sm:w-28` means "14 on mobile, 28 on desktop". This keeps mobile as the default and is the smallest-diff approach.
- **File paths** are relative to the repo root.
- **Browser check = load the game page at 375px width and visually confirm the stated expectation.** If you can't spin up a real game, at minimum render the component with mock data and inspect the layout.
- **Commit after each task** with the message shown. Frequent small commits make this easy to revert or bisect.

---

## Task 1: Shrink the main game area container on mobile

**Files:**
- Modify: `client/src/pages/GamePage.tsx`

**Why first:** The outer container sets how much room the three columns (you / center / opponent) have to work with. Tightening its padding and gap first gives later tasks room to breathe.

**Step 1: Edit the main game area wrapper**

In [client/src/pages/GamePage.tsx:122](client/src/pages/GamePage.tsx#L122) change:

```tsx
<div className="flex min-h-0 flex-1 px-4 py-2">
```

to:

```tsx
<div className="flex min-h-0 flex-1 px-1 py-1 sm:px-4 sm:py-2">
```

**Step 2: Tighten the left-side gap**

At [client/src/pages/GamePage.tsx:124](client/src/pages/GamePage.tsx#L124) change:

```tsx
<div className="flex min-h-0 gap-3">
```

to:

```tsx
<div className="flex min-h-0 gap-1 sm:gap-3">
```

**Step 3: Tighten the right-side gap**

At [client/src/pages/GamePage.tsx:146](client/src/pages/GamePage.tsx#L146) apply the same change:

```tsx
<div className="flex min-h-0 gap-3">
```

to:

```tsx
<div className="flex min-h-0 gap-1 sm:gap-3">
```

**Step 4: Verify build**

Run: `cd client && npm run build`
Expected: clean build, no new TS errors.

**Step 5: Commit**

```bash
git add client/src/pages/GamePage.tsx
git commit -m "mobile: tighten main game area padding and column gaps"
```

---

## Task 2: Shrink TowerVisual on mobile

**Files:**
- Modify: `client/src/components/TowerVisual.tsx`

**Why:** The tower is the widest element in each side column. Halving its width is the biggest single space win.

**Step 1: Shrink the outer width**

At [client/src/components/TowerVisual.tsx:180](client/src/components/TowerVisual.tsx#L180) change:

```tsx
<div className="flex h-full w-28 flex-col">
```

to:

```tsx
<div className="flex h-full w-14 flex-col sm:w-28">
```

**Step 2: Shrink the tower brick rows**

At [client/src/components/TowerVisual.tsx:91](client/src/components/TowerVisual.tsx#L91) change:

```tsx
className="flex w-10 gap-[1px]"
```

to:

```tsx
className="flex w-5 gap-[1px] sm:w-10"
```

**Step 3: Shrink the tower foundation**

At [client/src/components/TowerVisual.tsx:110](client/src/components/TowerVisual.tsx#L110) change:

```tsx
<div className={`mt-0.5 h-1.5 w-12 rounded-sm ${colorDark}`} />
```

to:

```tsx
<div className={`mt-0.5 h-1.5 w-6 rounded-sm sm:w-12 ${colorDark}`} />
```

**Step 4: Shrink the wall brick rows**

At [client/src/components/TowerVisual.tsx:138](client/src/components/TowerVisual.tsx#L138) change:

```tsx
className="flex w-8 gap-[1px]"
```

to:

```tsx
className="flex w-4 gap-[1px] sm:w-8"
```

**Step 5: Shrink the wall foundation**

At [client/src/components/TowerVisual.tsx:157](client/src/components/TowerVisual.tsx#L157) change:

```tsx
<div className={`mt-0.5 h-1 w-9 rounded-sm ${color}`} />
```

to:

```tsx
<div className={`mt-0.5 h-1 w-[1.125rem] rounded-sm sm:w-9 ${color}`} />
```

**Note:** `w-[1.125rem]` is half of `w-9` (2.25rem). Tailwind's arbitrary value syntax is needed because there's no `w-4.5` utility.

**Step 6: Tighten the numeric values row**

At [client/src/components/TowerVisual.tsx:192](client/src/components/TowerVisual.tsx#L192) change:

```tsx
<div className={`mt-2 flex justify-center gap-3 text-sm ${wallOrder}`}>
```

to:

```tsx
<div className={`mt-1 flex justify-center gap-1 text-xs sm:mt-2 sm:gap-3 sm:text-sm ${wallOrder}`}>
```

**Step 7: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 8: Browser check**

Open DevTools at 375px width, load the game. Both towers should be visible and roughly half their desktop width. The bricks should still render in the correct color and stagger pattern.

**Step 9: Commit**

```bash
git add client/src/components/TowerVisual.tsx
git commit -m "mobile: scale TowerVisual to half width below sm breakpoint"
```

---

## Task 3: Shrink PlayerStats on mobile

**Files:**
- Modify: `client/src/components/PlayerStats.tsx`

**Why:** PlayerStats is the other wide element. We cap it to tower width (`w-14`) per the design decision.

**Step 1: Shrink the container width and gap**

At [client/src/components/PlayerStats.tsx:96](client/src/components/PlayerStats.tsx#L96) change:

```tsx
<div className={`flex w-40 flex-col gap-2 ${align}`}>
```

to:

```tsx
<div className={`flex w-14 flex-col gap-0.5 sm:w-40 sm:gap-2 ${align}`}>
```

**Step 2: Hide the username row on mobile**

At [client/src/components/PlayerStats.tsx:97](client/src/components/PlayerStats.tsx#L97) change:

```tsx
<div className="mb-1 truncate text-sm font-bold text-amber-200">
```

to:

```tsx
<div className="mb-1 hidden truncate text-sm font-bold text-amber-200 sm:block">
```

**Step 3: Tighten the resource row padding**

At [client/src/components/PlayerStats.tsx:70](client/src/components/PlayerStats.tsx#L70) change:

```tsx
<div className={`${bgClass} relative overflow-hidden rounded px-3 py-2 ${rowAnimClass}`}>
```

to:

```tsx
<div className={`${bgClass} relative overflow-hidden rounded px-1 py-0.5 sm:px-3 sm:py-2 ${rowAnimClass}`}>
```

**Step 4: Shrink the label text**

At [client/src/components/PlayerStats.tsx:83](client/src/components/PlayerStats.tsx#L83) change:

```tsx
<div className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
```

to:

```tsx
<div className="text-[9px] font-bold opacity-80 sm:text-xs sm:uppercase sm:tracking-wide">{label}</div>
```

**Step 5: Shrink the amount and level numbers**

At [client/src/components/PlayerStats.tsx:85-86](client/src/components/PlayerStats.tsx#L85-L86) change:

```tsx
<span className={`text-2xl font-bold ${amountAnimClass} ${amountColorClass}`}>{amount}</span>
<span className={`text-sm opacity-70 ${levelAnimClass} ${levelColorClass}`}>+{level}</span>
```

to:

```tsx
<span className={`text-sm font-bold sm:text-2xl ${amountAnimClass} ${amountColorClass}`}>{amount}</span>
<span className={`text-[9px] opacity-70 sm:text-sm ${levelAnimClass} ${levelColorClass}`}>+{level}</span>
```

**Step 6: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 7: Browser check**

At 375px width: PlayerStats column should be ~56px wide (matches tower), with three tight colored rows showing small resource amount + level. Animations (green glow on increase, red flash on decrease, floating delta numbers) should still trigger when resources change. At ≥640px width: unchanged from current desktop.

**Step 8: Commit**

```bash
git add client/src/components/PlayerStats.tsx
git commit -m "mobile: scale PlayerStats to tower width with compact text"
```

---

## Task 4: Shrink Card on mobile

**Files:**
- Modify: `client/src/components/Card.tsx`

**Why:** The hand takes 5+ cards at 112px each on desktop — that's 560px+, which doesn't fit at 375px even with two rows. Shrinking the card itself brings the breakpoint for wrapping into a sensible hand size.

**Target card size on mobile:** ~68px wide × ~96px tall (roughly 60% of desktop). This lets 5 cards fit per row at 375px (340px of cards + gaps).

**Step 1: Shrink the card size**

At [client/src/components/Card.tsx:51](client/src/components/Card.tsx#L51) change:

```tsx
className={`
  relative flex h-40 w-28 flex-shrink-0 cursor-pointer flex-col rounded-lg border-2
  bg-stone-800 transition-transform
  ${borderColors[color]}
  ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
`}
```

to:

```tsx
className={`
  relative flex h-24 w-[4.25rem] flex-shrink-0 cursor-pointer flex-col rounded-lg border-2
  bg-stone-800 transition-transform
  sm:h-40 sm:w-28
  ${borderColors[color]}
  ${canPlay ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'}
`}
```

**Step 2: Shrink the card name row**

At [client/src/components/Card.tsx:60](client/src/components/Card.tsx#L60) change:

```tsx
<div className="rounded-t-md bg-stone-700 px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-amber-100">
```

to:

```tsx
<div className="rounded-t-md bg-stone-700 px-1 py-0.5 text-center text-[8px] font-bold uppercase leading-tight text-amber-100 sm:px-2 sm:py-1 sm:text-xs sm:tracking-wide">
```

**Step 3: Shrink the art placeholder**

At [client/src/components/Card.tsx:65](client/src/components/Card.tsx#L65) change:

```tsx
<div className={`mx-1 mt-1 h-8 rounded bg-gradient-to-b ${gradientColors[color]}`} />
```

to:

```tsx
<div className={`mx-1 mt-0.5 h-4 rounded bg-gradient-to-b sm:mt-1 sm:h-8 ${gradientColors[color]}`} />
```

**Step 4: Shrink the effect text**

At [client/src/components/Card.tsx:68](client/src/components/Card.tsx#L68) change:

```tsx
<div className="flex-1 px-2 py-1 text-center text-[10px] leading-tight text-stone-300">
```

to:

```tsx
<div className="flex-1 px-1 py-0.5 text-center text-[7px] leading-tight text-stone-300 sm:px-2 sm:py-1 sm:text-[10px]">
```

**Step 5: Shrink the bottom bar (discard + cost)**

At [client/src/components/Card.tsx:73](client/src/components/Card.tsx#L73) change:

```tsx
<div className="flex items-center justify-between px-2 pb-1">
```

to:

```tsx
<div className="flex items-center justify-between px-1 pb-0.5 sm:px-2 sm:pb-1">
```

At [client/src/components/Card.tsx:77](client/src/components/Card.tsx#L77) change:

```tsx
className="flex h-6 w-6 items-center justify-center rounded bg-stone-600 text-xs font-bold text-red-400 hover:bg-stone-500"
```

to:

```tsx
className="flex h-4 w-4 items-center justify-center rounded bg-stone-600 text-[10px] font-bold text-red-400 hover:bg-stone-500 sm:h-6 sm:w-6 sm:text-xs"
```

At [client/src/components/Card.tsx:87](client/src/components/Card.tsx#L87) change the placeholder div to match:

```tsx
<div className="h-6 w-6" />
```

to:

```tsx
<div className="h-4 w-4 sm:h-6 sm:w-6" />
```

At [client/src/components/Card.tsx:92](client/src/components/Card.tsx#L92) change:

```tsx
className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${costBgColors[color]}`}
```

to:

```tsx
className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white sm:h-7 sm:w-7 sm:text-sm ${costBgColors[color]}`}
```

**Step 6: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 7: Browser check**

At 375px width: cards should be ~68px wide and fit 5 per row comfortably. Tap still triggers play; discard button (when shown) is still tappable (4×4 = 16px, which is small — acceptable since the tap target extends to the card chrome around it, but flag this as a UX concern if it feels bad).

**Step 8: Commit**

```bash
git add client/src/components/Card.tsx
git commit -m "mobile: scale Card to 60% size below sm breakpoint"
```

---

## Task 5: Wrap the hand on mobile

**Files:**
- Modify: `client/src/components/Hand.tsx`

**Step 1: Enable wrapping on mobile, single row on desktop**

At [client/src/components/Hand.tsx:52](client/src/components/Hand.tsx#L52) change:

```tsx
<div className="flex items-center justify-center gap-2 px-4 py-3">
```

to:

```tsx
<div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 px-2 py-2 sm:flex-nowrap sm:gap-x-2 sm:gap-y-0 sm:px-4 sm:py-3">
```

**Step 2: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 3: Browser check**

At 375px width with 5+ cards: the hand wraps to 2 rows when cards overflow. At ≥640px: single row as before.

**Step 4: Commit**

```bash
git add client/src/components/Hand.tsx
git commit -m "mobile: wrap hand to multiple rows when cards overflow"
```

---

## Task 6: Shrink CardBack on mobile

**Files:**
- Modify: `client/src/components/CardBack.tsx`

**Why:** The deck (CardBack) sits in the center column. Keeping it at desktop size makes it disproportionate to the new smaller cards in the hand.

**Step 1: Shrink CardBack to match card size**

At [client/src/components/CardBack.tsx:3](client/src/components/CardBack.tsx#L3) change:

```tsx
<div className="flex h-40 w-28 flex-shrink-0 items-center justify-center rounded-lg border-2 border-stone-600 bg-gradient-to-b from-stone-700 to-stone-900">
```

to:

```tsx
<div className="flex h-24 w-[4.25rem] flex-shrink-0 items-center justify-center rounded-lg border-2 border-stone-600 bg-gradient-to-b from-stone-700 to-stone-900 sm:h-40 sm:w-28">
```

**Step 2: Shrink the inner ornate panel**

At [client/src/components/CardBack.tsx:5](client/src/components/CardBack.tsx#L5) change:

```tsx
<div className="flex h-32 w-20 items-center justify-center rounded border border-stone-600 bg-stone-800">
```

to:

```tsx
<div className="flex h-[4.5rem] w-12 items-center justify-center rounded border border-stone-600 bg-stone-800 sm:h-32 sm:w-20">
```

**Step 3: Shrink the ornate pattern pieces**

At [client/src/components/CardBack.tsx:7-11](client/src/components/CardBack.tsx#L7-L11) change:

```tsx
<div className="h-6 w-6 rounded-full border-2 border-amber-700/60 bg-amber-900/30" />
<div className="h-px w-12 bg-amber-700/40" />
<div className="text-[8px] font-bold uppercase tracking-widest text-amber-700/50">Towers</div>
<div className="h-px w-12 bg-amber-700/40" />
<div className="h-6 w-6 rounded-full border-2 border-amber-700/60 bg-amber-900/30" />
```

to:

```tsx
<div className="h-3 w-3 rounded-full border-2 border-amber-700/60 bg-amber-900/30 sm:h-6 sm:w-6" />
<div className="h-px w-8 bg-amber-700/40 sm:w-12" />
<div className="text-[6px] font-bold uppercase tracking-widest text-amber-700/50 sm:text-[8px]">Towers</div>
<div className="h-px w-8 bg-amber-700/40 sm:w-12" />
<div className="h-3 w-3 rounded-full border-2 border-amber-700/60 bg-amber-900/30 sm:h-6 sm:w-6" />
```

**Step 4: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 5: Browser check**

At 375px: CardBack is the same compact size as hand cards. At ≥640px: unchanged.

**Step 6: Commit**

```bash
git add client/src/components/CardBack.tsx
git commit -m "mobile: scale CardBack to match mobile card size"
```

---

## Task 7: Shrink LastPlayedCards on mobile

**Files:**
- Modify: `client/src/components/LastPlayedCards.tsx`

**Why:** These are rendered as cards in the center column and need to match the new mobile card size. The structure mirrors `Card.tsx`, so the changes parallel Task 4.

**Step 1: Shrink the played card size**

At [client/src/components/LastPlayedCards.tsx:57](client/src/components/LastPlayedCards.tsx#L57) change:

```tsx
className={`
  relative flex h-40 w-28 flex-shrink-0 flex-col rounded-lg border-2 bg-stone-800
  ${borderColors[def.color]}
  ${isDiscard ? 'opacity-50' : ''}
`}
```

to:

```tsx
className={`
  relative flex h-24 w-[4.25rem] flex-shrink-0 flex-col rounded-lg border-2 bg-stone-800
  sm:h-40 sm:w-28
  ${borderColors[def.color]}
  ${isDiscard ? 'opacity-50' : ''}
`}
```

**Step 2: Shrink the card name row**

At [client/src/components/LastPlayedCards.tsx:63](client/src/components/LastPlayedCards.tsx#L63) apply the same change as Card Task 4 Step 2:

```tsx
<div className="rounded-t-md bg-stone-700 px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-amber-100">
```

to:

```tsx
<div className="rounded-t-md bg-stone-700 px-1 py-0.5 text-center text-[8px] font-bold uppercase leading-tight text-amber-100 sm:px-2 sm:py-1 sm:text-xs sm:tracking-wide">
```

**Step 3: Shrink the art placeholder**

At [client/src/components/LastPlayedCards.tsx:68](client/src/components/LastPlayedCards.tsx#L68) change:

```tsx
<div className={`mx-1 mt-1 h-8 rounded bg-gradient-to-b ${gradientColors[def.color]}`} />
```

to:

```tsx
<div className={`mx-1 mt-0.5 h-4 rounded bg-gradient-to-b sm:mt-1 sm:h-8 ${gradientColors[def.color]}`} />
```

**Step 4: Shrink the effect text**

At [client/src/components/LastPlayedCards.tsx:71](client/src/components/LastPlayedCards.tsx#L71) change:

```tsx
<div className="flex-1 px-2 py-1 text-center text-[10px] leading-tight text-stone-300">
```

to:

```tsx
<div className="flex-1 px-1 py-0.5 text-center text-[7px] leading-tight text-stone-300 sm:px-2 sm:py-1 sm:text-[10px]">
```

**Step 5: Shrink the bottom bar and cost circle**

At [client/src/components/LastPlayedCards.tsx:76](client/src/components/LastPlayedCards.tsx#L76) change:

```tsx
<div className="flex items-center justify-end px-2 pb-1">
```

to:

```tsx
<div className="flex items-center justify-end px-1 pb-0.5 sm:px-2 sm:pb-1">
```

At [client/src/components/LastPlayedCards.tsx:78](client/src/components/LastPlayedCards.tsx#L78) change:

```tsx
className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${costBgColors[def.color]}`}
```

to:

```tsx
className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white sm:h-7 sm:w-7 sm:text-sm ${costBgColors[def.color]}`}
```

**Step 6: Shrink the "discarded" badge text**

At [client/src/components/LastPlayedCards.tsx:87](client/src/components/LastPlayedCards.tsx#L87) change:

```tsx
<span className="px-2 py-0.5 text-[10px] font-bold uppercase text-stone-20/70">
```

to:

```tsx
<span className="px-1 py-0.5 text-[7px] font-bold uppercase text-stone-20/70 sm:px-2 sm:text-[10px]">
```

**Step 7: Tighten the gap between played cards and the label**

At [client/src/components/LastPlayedCards.tsx:115](client/src/components/LastPlayedCards.tsx#L115) change:

```tsx
<div className="flex gap-2">
```

to:

```tsx
<div className="flex gap-1 sm:gap-2">
```

**Step 8: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 9: Browser check**

At 375px: last played cards should be the same compact size as hand cards. At ≥640px: unchanged.

**Step 10: Commit**

```bash
git add client/src/components/LastPlayedCards.tsx
git commit -m "mobile: scale LastPlayedCards to match mobile card size"
```

---

## Task 8: Hide desktop history panel + handle on mobile

**Files:**
- Modify: `client/src/pages/GamePage.tsx`

**Why:** Before building the mobile drawer, we first hide the desktop-only pieces (drag handle + resizable history panel) below `sm`. The mobile collapsed bar and sheet are added in Task 9.

**Step 1: Hide the drag handle on mobile**

At [client/src/pages/GamePage.tsx:166-171](client/src/pages/GamePage.tsx#L166-L171) change:

```tsx
<div
  className="flex h-2 flex-shrink-0 cursor-row-resize items-center justify-center border-t border-stone-700 bg-stone-800 hover:bg-stone-700"
  onMouseDown={onDragStart}
>
  <div className="h-0.5 w-10 rounded-full bg-stone-500" />
</div>
```

to:

```tsx
<div
  className="hidden h-2 flex-shrink-0 cursor-row-resize items-center justify-center border-t border-stone-700 bg-stone-800 hover:bg-stone-700 sm:flex"
  onMouseDown={onDragStart}
>
  <div className="h-0.5 w-10 rounded-full bg-stone-500" />
</div>
```

**Step 2: Hide the resizable history panel on mobile**

At [client/src/pages/GamePage.tsx:174-177](client/src/pages/GamePage.tsx#L174-L177) change:

```tsx
<div
  className="flex flex-shrink-0 flex-col overflow-hidden bg-stone-950"
  style={{ height: historyHeight }}
>
```

to:

```tsx
<div
  className="hidden flex-shrink-0 flex-col overflow-hidden bg-stone-950 sm:flex"
  style={{ height: historyHeight }}
>
```

**Step 3: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 4: Browser check**

At 375px: the drag handle and history panel should be gone (we'll replace them in Task 9). At ≥640px: unchanged.

**Step 5: Commit**

```bash
git add client/src/pages/GamePage.tsx
git commit -m "mobile: hide desktop history panel and drag handle below sm"
```

---

## Task 9: Add mobile history drawer (collapsed bar + slide-up sheet)

**Files:**
- Modify: `client/src/pages/GamePage.tsx`

**Why:** Last piece — the mobile-only history UI. Defaults to a thin bar showing move count; tapping expands a slide-up sheet.

**Step 1: Add the `historyOpen` state**

At [client/src/pages/GamePage.tsx:43-45](client/src/pages/GamePage.tsx#L43-L45), just below the existing state hooks, add:

```tsx
const [historyOpen, setHistoryOpen] = useState(false)
```

The full state block should look like:

```tsx
const [historyHeight, setHistoryHeight] = useState(DEFAULT_HISTORY_HEIGHT)
const [showSettings, setShowSettings] = useState(false)
const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
const [historyOpen, setHistoryOpen] = useState(false)
const dragging = useRef(false)
```

**Step 2: Add the collapsed bar (mobile-only)**

Just before the closing `</div>` of the outer container — i.e. right before the existing `{/* Game over modal */}` block at [client/src/pages/GamePage.tsx:187](client/src/pages/GamePage.tsx#L187) — insert:

```tsx
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
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">History</span>
        <span className="text-xs text-stone-600">{gameState.history.length} moves</span>
        <button
          className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-amber-300"
          onClick={() => setHistoryOpen(false)}
          aria-label="Close history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M4.25 10.75a.75.75 0 0 1 0-1.5h11.5a.75.75 0 0 1 0 1.5H4.25Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <GameHistory history={gameState.history} yourPlayerId={you.playerId} />
      </div>
    </div>
  </div>
)}
```

**Note:** The backdrop and sheet are siblings inside a full-screen overlay so a backdrop tap (caught on the outer `<div>`) closes the sheet, while taps inside the sheet are stopped via `stopPropagation`.

**Step 3: Verify build**

Run: `cd client && npm run build`
Expected: clean build.

**Step 4: Browser check**

At 375px: a thin bar appears at the bottom reading `History · N moves ▲`. Tapping it opens a bottom sheet (60% viewport height) with the move list. Tapping the backdrop or the close button dismisses it. At ≥640px: the bar and sheet are invisible; desktop behavior is unchanged.

**Step 5: Commit**

```bash
git add client/src/pages/GamePage.tsx
git commit -m "mobile: add collapsed history bar with slide-up sheet"
```

---

## Task 10: Full-flow verification

**Files:** none (verification only)

**Step 1: Fresh build**

Run: `cd client && npm run build`
Expected: clean build, no TS errors, no warnings beyond the pre-existing `/env.js` warning.

**Step 2: Start the app and play through on mobile**

Run: `cd /Users/bevan/projects/towers/.worktrees/mobile-ui && npm run dev`

Open two browser tabs at http://localhost:5173, both sized to 375×667 (iPhone SE via DevTools device toolbar). Create a game in one tab, join in the other.

**Check each of the following at 375px:**
- [ ] Both towers are fully visible side-by-side (not clipped)
- [ ] Both PlayerStats columns are visible, showing Ore/Mana/Troops with amount + level
- [ ] Resource change animations (glow/flash/floating delta) still render correctly
- [ ] CardBack and LastPlayedCards are visible in the center column
- [ ] TurnIndicator is visible at the bottom of the center column
- [ ] Hand wraps to 2 rows when you have 6+ cards
- [ ] Tapping a playable card plays it
- [ ] Tapping the discard button on a card discards it
- [ ] Pending draw-discard banner shows correctly
- [ ] The thin history bar at the bottom shows the move count
- [ ] Tapping the history bar opens the slide-up sheet
- [ ] Scrolling inside the sheet works
- [ ] Tapping the backdrop or close button dismisses the sheet
- [ ] Settings and Leave buttons in the top bar still work
- [ ] Game-over modal appears when the game ends

**Check each at ≥640px (desktop):**
- [ ] Layout is identical to pre-change (no visual regression)
- [ ] History panel is resizable via the drag handle
- [ ] No mobile-only elements visible (no collapsed bar)

**Step 3: Final typecheck**

Run: `cd client && npx tsc --noEmit`
Expected: no errors.

**Step 4: No commit**

This is verification only. If any check fails, go back to the failing task and fix it, then re-run this verification.

---

## Out of Scope (per design doc)

- Touch-gesture swipe-to-dismiss on the history sheet (tap-to-dismiss only)
- Landscape-specific layout (portrait is the target; landscape falls through to desktop at ≥640px wide)
- Tablet-specific tuning (single `sm:` breakpoint; tablets get desktop layout)

---

## Reverting

Each task is its own commit. To revert any individual change: `git revert <sha>`. To revert the entire feature before merging: reset the branch to `main`.
