# A Guide to Styling Game UIs Like Towers

Opinionated guide tailored to the Towers codebase. The short version: **games aren't documents — they're single-screen, no-scroll, fixed-viewport apps with a strict reading order.** That one distinction drives most of the structural decisions below.

---

## 1. The mental model: "reading order" over "layout"

Before thinking in CSS, rank every element by how often a player needs to glance at it during a turn. For Towers, a rough ranking:

1. **Whose turn is it / timer** — glanced at every second
2. **My hand** — decision surface, looked at constantly
3. **My tower + wall** — my state, looked at before each play
4. **Opponent's tower + wall** — their state, looked at before each play
5. **My resources / opponent's resources** — numbers, scanned frequently
6. **Deck / last-played** — context, checked occasionally
7. **History** — reference, opened rarely
8. **Settings / leave** — almost never

Your UI should put 1–2 in the most visually dominant place, 3–6 as persistent HUD around the edges, and 7–8 collapsed behind a tap. **Legibility and hierarchy before aesthetics.**

The practical test: squint at a screenshot. The top-3 items should still be identifiable.

---

## 2. The anatomy of a game screen

Nearly every 1v1 game screen — cards, board games, RTS, fighting — decomposes into the same five regions:

```
┌─────────────── TOP BAR ───────────────┐   status / turn / menu
├──────┬─────────────────────┬──────────┤
│ YOU  │   SHARED / CENTER   │ OPPONENT │   mirrored HUDs
│ HUD  │   (deck, last play) │   HUD    │
├──────┴─────────────────────┴──────────┤
│            MY HAND / ACTIONS          │   input surface
├───────────────────────────────────────┤
│           HISTORY / LOG (opt.)        │   ambient info
└───────────────────────────────────────┘
```

Towers' desktop layout at [GamePage.tsx:78-182](../../client/src/pages/GamePage.tsx#L78-L182) already follows this — top bar, three-column main area with mirrored sides, hand at bottom, resizable history at the very bottom. Good bones.

**Rules for this anatomy:**

- **Mirror opposing players.** Symmetry makes "mine vs. theirs" preattentive. Towers does this via `side="left"` / `side="right"` on `PlayerStats` and `TowerVisual`.
- **Input surface always at the bottom** on both desktop and mobile — hands go near thumbs; mice move down naturally; it keeps the clickable area away from browser chrome.
- **Center is for shared state**, not for HUD. The deck and last-played cards belong here because both players look at them.

---

## 3. Desktop-and-mobile as one design, not two

The single biggest mistake in web game UIs is treating mobile as a scaled-down desktop, then hiding things with `hidden md:block`. Both views should share the same *anatomy* above — only the *arrangement* of those regions changes.

Decision tree when adding or moving anything:

```
Is this element part of the core anatomy?
├── Yes → Present on both. Resize or relocate, never hide.
└── No  → Collapse on mobile (sheet / drawer / badge).
          Show inline on desktop.
```

The mobile history sheet at [GamePage.tsx:184-221](../../client/src/pages/GamePage.tsx#L184-L221) is a textbook example of the `No` branch — ambient info, collapsed into a bar on mobile that slides up into a sheet. Desktop shows it inline.

### Breakpoints

Pick few, pick intentionally. For a 1v1 game, two is usually enough:

| Breakpoint | Width | What changes |
|---|---|---|
| `base` (mobile portrait) | <640 px | Single column or stacked rows. Hand takes ~30% height. Ambient info collapsed. |
| `sm` and up (tablet/desktop) | ≥640 px | Three-column main area. Persistent side HUDs. History panel visible. |

Tailwind's default `sm/md/lg/xl` is more than you need. The current branch uses `sm:` consistently — resist the urge to add `md:`/`lg:` tweaks unless there's a real break.

### Use container queries for components

Breakpoints on the viewport tell you about the *window*, not the *card*. Once a component is placed inside a resizable tower or a flex column that shrinks, viewport breakpoints lie. Use container queries on `Card`, `TowerVisual`, `PlayerStats` — the component resizes based on its parent, which is what you actually want. Tailwind supports them via the `@container` plugin (built in since v3.4).

Example: instead of `text-xs sm:text-sm` on `PlayerStats`, make `PlayerStats` a container and use `@sm:text-sm` so it adapts to the tower's width, not the viewport's.

---

## 4. Viewport, safe areas, and the "no-scroll" rule

Games don't scroll. The whole game must fit in the viewport at all times. This is trickier on mobile web than it sounds because:

- `100vh` is wrong on iOS Safari — it's the *largest* viewport (URL bar hidden), so when the URL bar is visible, 100vh overflows and causes scrolling.
- The visible area *changes* as the user scrolls or the keyboard appears.

Use the modern viewport units:

| Unit | Meaning | When to use |
|---|---|---|
| `100svh` | **Small** viewport height — assumes browser chrome visible | Safe default for game root; nothing will ever overflow |
| `100dvh` | **Dynamic** — changes as chrome appears/disappears | When you want to fill *all* available space; can cause layout jumps |
| `100lvh` | **Large** — assumes chrome hidden | Rarely needed directly |

The Towers root currently uses `h-screen` at [GamePage.tsx:79](../../client/src/pages/GamePage.tsx#L79), which maps to `100vh` — **swap this for `h-dvh` or `h-svh`**. `min-h-dvh` is usually the right pick for a game root.

Add safe-area handling for notches — matters as soon as someone installs the game as a PWA:

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
/* on root or top/bottom bars */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

Also disable pinch-zoom *inside* the game area (`touch-action: none` on interactive elements like cards) but allow it on things like the history sheet if text gets small — blanket disabling is accessibility-unfriendly.

---

## 5. Typography and sizing (fluid, not stepped)

Steps (`text-xs sm:text-sm md:text-base`) work but require many breakpoints. Fluid typography with `clamp()` eliminates them:

```css
font-size: clamp(0.75rem, 0.7rem + 0.4vw, 1rem);
```

That's: min 12px, scales with viewport, caps at 16px. No breakpoints needed. Tailwind v4 lets you write these in the config; pre-v4 use arbitrary values: `text-[clamp(0.75rem,0.7rem+0.4vw,1rem)]`.

**For game-specific numbers** (resource counts, tower heights), go one size larger than body text and use a tabular/mono font so numbers don't jitter as they change:

```css
font-variant-numeric: tabular-nums;
```

A 3-digit resource counter shouldn't change width when it ticks from 99 → 100.

---

## 6. Touch targets and spacing

Apple's 44×44pt HIG guideline is the floor for tappable items. For game interactions that compete with adjacent elements (a card in a fan of cards), bump to 48px and give ≥8px gaps.

Towers' Card at ~56×80 mobile is below that. Two options:

1. Keep the visual card small but add a larger **invisible hit target** around it (`padding` + `pointer-events: auto`). Common in card games.
2. Overlap cards with a fan/stack and only expose the topmost card's full area; tapping a partially-covered card *selects* it (brings it forward) before a second tap plays it. Two-stage interaction is the norm on mobile card games.

Also: **long-press → card preview** is worth adding on mobile. It's the mobile equivalent of hover-to-enlarge.

---

## 7. Color, contrast, and theming

The stone/amber palette is tasteful, but games need more **state color** than document UIs:

- **Active/your-turn** — a strong accent (amber-400 here, good)
- **Inactive/their-turn** — desaturate toward stone
- **Danger / low resource** — red, pulsing if critical
- **Gained / increased** — green flash for +1 effects
- **Disabled / unplayable card** — reduce opacity + grayscale

Build a small state-color system rather than picking colors per component:

```ts
// theme/state.ts
export const state = {
  mine: 'text-amber-300 border-amber-500',
  theirs: 'text-sky-300 border-sky-500',
  danger: 'text-red-400',
  gain: 'text-emerald-400',
  dim: 'opacity-60 grayscale',
}
```

Then `Card`, `PlayerStats`, `TowerVisual` reference `state.mine` instead of hand-picking amber each time. Consistency is what makes a UI feel designed.

Also run your palette through a contrast checker — amber on stone-900 is fine, but amber on stone-700 (hover states) can fall below 4.5:1.

---

## 8. Animation: functional, never decorative

Game UI animation has one job: **make state changes legible.** A card played should:

1. Move from hand to tower (clear source and destination)
2. The resource it costs should flash and tick down
3. The tower should settle visibly

If you can remove an animation and the state change is still understandable, it was decorative and should go.

Use Framer Motion (`motion` package) layout animations or CSS transitions with the `FLIP` technique. Keep durations short: 150–250ms for UI, up to 400ms for "dramatic" moments (card play, tower break). Never block input during animation — players should be able to queue the next action.

For Towers specifically, the `LastPlayedCards` stack is a great candidate for a subtle slide-in when a new card enters. The tower gaining a level could animate the new block growing from zero height.

---

## 9. HUD density and the "glance test"

A good HUD passes the **glance test**: can a player, after 0.5s of looking, answer "what's my state, what's theirs, and whose turn is it?" If they have to read text, it fails.

Tools to hit this:

- **Icons for resources, not labels.** A hammer icon + number beats "Stone: 5".
- **Bars for bounded values** (HP, wall), **numbers for unbounded** (stone, points).
- **Position = meaning.** Mine on left, theirs on right, always.
- **Never interleave text and numbers.** "Stone 5" → put the icon and number together, no colon, no word.

`TurnIndicator` at the top is correct: one sentence, one color change, no icons fighting for attention.

---

## 10. Mobile-specific patterns worth stealing

From mobile card games (Hearthstone, Slay the Spire mobile, Balatro mobile):

- **Fan of cards that expands on tap.** Tap hand → fan opens covering lower half; tap outside → collapses.
- **Drag to play, drop on target.** On tower or on an opponent.
- **Haptic feedback** on play / draw (`navigator.vibrate([10])`).
- **Sticky active card preview** — selecting a card pins a larger version to the side while the hand stays interactive.
- **Bottom sheets instead of modals.** Already used for history; extend to settings, game-over, etc.

---

## 11. References worth bookmarking

Game UI / HUD:

- [Level Up: A Guide to Game UI — Toptal](https://www.toptal.com/designers/ui/game-ui) — best single overview
- [What Is a HUD in Games? — Vsquad](https://vsquad.art/blog/what-hud-games-complete-guide-game-interfaces) — diegetic vs. non-diegetic HUDs
- [Game HUD Essentials — Page Flows](https://pageflows.com/resources/game-hud/) — examples and anti-patterns
- [Game UX Medium post — Bruna Delfino](https://medium.com/@brdelfino.work/ux-and-ui-in-game-design-exploring-hud-inventory-and-menus-5d8c189deb65) — inventory and menus

Responsive and mobile web:

- [MDN: env()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) — safe-area insets
- [Viewport units svh/dvh/lvh](https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a)
- [Make PWAs look handsome on iOS](https://itnext.io/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777) — meta tags, status bar, safe areas
- [Responsive design principles 2026 — UXPin](https://www.uxpin.com/studio/blog/best-practices-examples-of-excellent-responsive-design/)

Inspiration / examples to study the actual CSS of:

- **Balatro web demo** — small-screen card game with great HUD density
- **Sky: Children of the Light web companion** — diegetic-leaning state
- **Wordle / NYT Games** — the gold standard for "fits any screen without scrolling"

---

## What to change in Towers next, concretely

Small, high-leverage things based on the above:

1. **Swap `h-screen` → `min-h-dvh`** at [GamePage.tsx:79](../../client/src/pages/GamePage.tsx#L79), and add `viewport-fit=cover` + safe-area padding on the top and bottom bars.
2. **Centralize state colors** in a `theme/state.ts` file and replace hand-picked amber/stone/red classes across `Card`, `PlayerStats`, `TowerVisual`.
3. **Container-ize `PlayerStats` and `TowerVisual`** so they respond to column width, not viewport width. This removes several `sm:` breakpoints.
4. **Tabular numbers** on all resource counters.
5. **Long-press preview** for cards on mobile — biggest UX win per line of code.
6. **Animate the `LastPlayedCards` stack and tower level-ups** with `motion.div layout`.
