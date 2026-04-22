# Mobile Responsive UI Design

## Problem

On mobile devices, the game UI doesn't fit in the viewport. The opponent's tower and resources get clipped, and the player can't see half the content. The layout was designed for desktop widths and has no responsive behavior.

## Goals

- All game state visible on a 375px-wide viewport without horizontal scroll
- Preserve the current spatial layout (left/center/right) — no radical restructuring
- Keep the desktop experience identical
- No new dependencies; pure Tailwind responsive variants plus minimal state

## Approach

CSS-only responsive via Tailwind's `sm:` breakpoint (640px). Same component tree, sizes scale down below 640px. One piece of state added for the mobile history drawer.

## Layout Changes

### Top bar
No changes — already compact.

### Main game area
Keep the horizontal 3-column structure. Scale children aggressively on mobile.

- Outer container padding: `px-4 py-2` → `px-1 py-1 sm:px-4 sm:py-2`
- Column gap: `gap-3` → `gap-1 sm:gap-3`

### TowerVisual
- Container width: `w-28` → `w-14 sm:w-28`
- Brick row widths (`w-10`, `w-8`, `w-12`, `w-9`) halved via responsive variants
- `maxTowerBricks` / `maxWallBricks` unchanged — bricks just render narrower

### PlayerStats
Capped to tower width on mobile (`w-14`).

- Container: `w-40` → `w-14 sm:w-40`
- Username row: `hidden sm:block`
- Resource row padding: `px-3 py-2` → `px-1 py-0.5 sm:px-3 sm:py-2`
- Label: `text-xs` → `text-[9px] sm:text-xs`, drop `uppercase tracking-wide` on mobile
- Amount: `text-2xl` → `text-sm sm:text-2xl`
- Level: `text-sm` → `text-[9px] sm:text-sm`
- Row gap: `gap-2` → `gap-0.5 sm:gap-2`

Change animations (glow/flash/delta floats) remain functional at the smaller scale.

### Center column
- CardBack: scale down via `sm:` variants (~60% on mobile)
- LastPlayedCards: scale card visuals similarly
- TurnIndicator: `mb-2` → `mb-1 sm:mb-2`

### Hand
Wrap-when-needed on mobile.

- Container: `flex` → `flex flex-wrap justify-center sm:flex-nowrap`
- Add `gap-y-1` so wrapped rows don't touch
- Card size scaled down via `sm:` variants in `Card.tsx` so ~5 cards fit per row at 375px

No changes to card interactivity — tap-to-play/discard works the same.

## History Panel

### Desktop
Unchanged. Drag handle and resizable panel remain. Both get `hidden sm:flex` wrappers so they don't render on mobile.

### Mobile — collapsed bar
- `sm:hidden` bar at bottom, ~28px tall
- Content: `History · N moves ▲` (chevron on right)
- Styled like existing history header (`bg-stone-950`, `text-stone-500`)
- Tappable whole bar

### Mobile — expanded sheet
- Tap collapsed bar → sheet slides up over the game area
- `fixed inset-x-0 bottom-0`, height `60vh`, `bg-stone-950`, rounded top corners
- Header: `History`, move count, close button (▼ or ✕)
- Body: reuses the existing `<GameHistory />` component
- Backdrop: `fixed inset-0 bg-black/40`, tap to close
- Slide animation: `transform translate-y-full → translate-y-0`

### State
New `const [historyOpen, setHistoryOpen] = useState(false)` in `GamePage.tsx`. Only consumed by mobile-only elements.

## Files Touched

- `client/src/pages/GamePage.tsx` — layout changes, new state, mobile drawer
- `client/src/components/PlayerStats.tsx` — scale-down classes
- `client/src/components/TowerVisual.tsx` — scale-down classes
- `client/src/components/Hand.tsx` — wrap on mobile
- `client/src/components/Card.tsx` — smaller card on mobile
- `client/src/components/CardBack.tsx` — smaller on mobile
- `client/src/components/LastPlayedCards.tsx` — smaller on mobile
- `client/src/components/TurnIndicator.tsx` — minor padding tweaks

## Out of Scope

- Touch gestures (swipe to dismiss the history sheet) — can be added later if wanted
- Landscape-specific layout — portrait is the target; landscape will fall through to desktop layout at ≥640px wide
- Tablet-specific tuning — `sm:` is the only breakpoint; tablets get the desktop layout
