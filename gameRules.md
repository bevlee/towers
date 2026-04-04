# Two Towers - Game Rules

## Overview

Two Towers is a two-player card game. Each player manages a tower, a wall, and three types of resources. The goal is to destroy your opponent's tower, build your own to a target height, or accumulate enough resources.

## Win Conditions

There are three ways to win:

1. **Tower Destruction** - Reduce your opponent's tower to 0 HP
2. **Tower Construction** - Build your own tower to 50 HP
3. **Resource Victory** - Accumulate 150 or more of every resource (ore, mana, and troops simultaneously)

If both players meet a win condition on the same turn (e.g. a card damages both towers to 0), the player who played the card wins.

## Time Limits

- **Game timer**: 10 minutes total. When it expires, the player with the taller tower wins. If towers are equal, the taller wall wins. If still tied, the player whose turn it was loses.
- **Turn timer**: 15, 20, or 30 seconds per turn (set when creating a room). If time runs out, a random card is automatically discarded.

## Starting Values

| Stat | Starting Value |
|------|---------------|
| Tower | 20 |
| Wall | 5 |
| Ore | 5 |
| Mana | 5 |
| Troops | 5 |
| Mine level | 2 |
| Monastery level | 2 |
| Barracks level | 2 |

## Resources and Sources

There are three resources, each produced by a corresponding source building:

| Resource | Source | Card Color |
|----------|--------|------------|
| Ore | Mine | Red |
| Mana | Monastery | Blue |
| Troops | Barracks | Green |

At the start of each turn, the current player gains resources equal to their source levels:

- Ore gained = Mine level
- Mana gained = Monastery level
- Troops gained = Barracks level

Source levels cannot drop below 1. Resources cannot drop below 0.

## Tower and Wall

- **Tower**: Your main structure. If it reaches 0, you lose. If it reaches 50, you win.
- **Wall**: A defensive barrier that absorbs incoming damage. The wall has no upper limit.

### Damage Resolution

- **Regular damage**: Hits the wall first. If damage exceeds the wall, the overflow hits the tower. Example: 8 damage against 5 wall = wall drops to 0, tower takes 3 damage.
- **Direct damage**: Bypasses the wall entirely and hits the tower. Only certain cards deal direct damage.
- **Self-damage**: Some cards damage you as a side effect. Self-damage follows regular damage rules (wall absorbs first).

Tower and wall cannot go below 0.

## Cards

The deck contains 78 cards in three colors. Each card has a resource cost that must be paid from the matching resource to play it.

### Card Colors

- **Red cards** (30 cards) - Cost ore. Primarily build walls and modify Mine levels.
- **Blue cards** (24 cards) - Cost mana. Primarily build towers and modify Monastery levels.
- **Green cards** (24 cards) - Cost troops. Primarily deal damage and modify Barracks levels.

### Hand

Each player holds 6 cards. After playing or discarding a card, you draw a replacement from the deck.

### Playing a Card

To play a card, you must have enough of the matching resource to pay its cost. The cost is deducted, then the card's effects are applied in order.

### Discarding

If you cannot or choose not to play a card, you may discard one instead. The discarded card is removed and you draw a replacement. One exception: **Lodestone** (blue, cost 5) cannot be discarded - it can only be played.

## Special Mechanics

### Play Again

Some cards grant an extra turn after being played. When this happens:

- You take another turn immediately
- Resources are **not** generated on the extra turn
- The turn timer resets

### Draw and Discard (Prism / Elven Scout)

Two cards (Prism and Elven Scout) let you draw a card and then choose one card from your hand to discard, followed by a play-again effect. This lets you cycle through the deck to find better cards.

### Conditional Effects

Several cards have effects that depend on the game state:

- **Foundations**: If your wall is 0, gain +6 wall. Otherwise, +3 wall.
- **Mother Lode**: If your Mine is lower than the enemy's, +2 Mine. Otherwise, +1 Mine.
- **Copping the Tech**: If your Mine is lower than the enemy's, set your Mine equal to theirs.
- **Spizzer**: If enemy wall is 0, deal 10 damage. Otherwise, 6 damage.
- **Unicorn**: If your Monastery is higher than the enemy's, deal 12 damage. Otherwise, 8 damage.
- **Werewolf**: Deal 9 damage. If the enemy's wall is 0 after damage, play again.

### "All Players" Effects

Some cards affect both players:

- **Brick Shortage**: All players lose 8 ore
- **Earthquake**: All players lose 1 Mine level
- **Mad Cow Disease**: All players lose 6 troops
- **Full Moon**: All players gain 1 Barracks level (you also gain 3 troops)
- **Tremors**: Both walls take 5 damage, then play again
- **Discord**: Both towers take 7 damage, both lose 1 Monastery level
- **Innovations**: All players gain 1 Mine level (you also gain 4 mana)
- **Imp**: 6 damage to enemy, then all players lose 5 ore, 5 mana, and 5 troops

### Swap and Steal

- **Phase Shift** (red, cost 17): Swap your wall with the enemy's wall.
- **Thief** (blue, cost 10): Steal 5 mana from the enemy. If they have less than 5, you only steal what they have.

## Card Reference

### Red Cards (Ore)

| Card | Cost | Copies | Effect |
|------|------|--------|--------|
| Strip Mine | 0 | 1 | -1 Mine, +10 wall, +5 mana |
| Lucky Cache | 0 | 1 | +2 ore, +2 mana; play again |
| Brick Shortage | 0 | 1 | All players lose 8 ore |
| Earthquake | 0 | 1 | -1 Mine to all players |
| Friendly Terrain | 1 | 2 | +1 wall; play again |
| Work Overtime | 2 | 2 | +5 wall, -6 mana |
| Basic Wall | 2 | 2 | +3 wall |
| Innovations | 2 | 1 | +1 Mine to all, +4 mana to you |
| Sturdy Wall | 3 | 1 | +4 wall |
| Foundations | 3 | 2 | If wall = 0: +6 wall; else +3 wall |
| Miners | 3 | 2 | +1 Mine |
| Collapse! | 4 | 1 | -1 enemy Mine |
| Mother Lode | 4 | 1 | If Mine < enemy: +2 Mine; else +1 Mine |
| Copping the Tech | 5 | 1 | If Mine < enemy: copy enemy Mine level |
| Big Wall | 5 | 2 | +6 wall |
| New Equipment | 6 | 1 | +2 Mine |
| Dwarven Miners | 7 | 1 | +4 wall, +1 Mine |
| Forced Labor | 7 | 1 | +9 wall, -5 troops |
| Tremors | 7 | 1 | -5 wall to all; play again |
| Reinforced Wall | 8 | 2 | +8 wall |
| Secret Room | 8 | 1 | +1 Monastery; play again |
| Crystal Rocks | 9 | 1 | +7 wall, +7 mana |
| Portcullis | 9 | 1 | +5 wall, +1 Barracks |
| Harmonic Ore | 11 | 1 | +6 wall, +3 tower |
| Mondo Wall | 13 | 1 | +12 wall |
| Focused Designs | 15 | 1 | +8 wall, +5 tower |
| Great Wall | 16 | 1 | +15 wall |
| Phase Shift | 17 | 1 | Swap your wall with enemy's wall |
| Rock Launcher | 18 | 1 | +6 wall, 10 damage to enemy |
| Dragon's Heart | 24 | 1 | +20 wall, +8 tower |

### Blue Cards (Mana)

| Card | Cost | Copies | Effect |
|------|------|--------|--------|
| Quartz | 1 | 2 | +1 tower; play again |
| Gemstone Flaw | 2 | 2 | 3 direct damage to enemy tower |
| Prism | 2 | 1 | Draw 1, discard 1; play again |
| Amethyst | 2 | 2 | +3 tower |
| Smoky Quartz | 2 | 1 | 1 direct damage to enemy tower; play again |
| Power Burn | 3 | 1 | -5 to your tower, +2 Monastery |
| Spell Weavers | 3 | 2 | +1 Monastery |
| Ruby | 3 | 2 | +5 tower |
| Quarry's Help | 4 | 1 | +7 tower, -10 ore |
| Gem Spear | 4 | 1 | 5 direct damage to enemy tower |
| Solar Flare | 4 | 1 | +2 tower, 2 direct damage to enemy tower |
| Discord | 5 | 1 | -7 tower to all, -1 Monastery to all |
| Lodestone | 5 | 1 | +3 tower (cannot be discarded) |
| Emerald | 6 | 2 | +8 tower |
| Crystal Matrix | 6 | 1 | +1 Monastery, +3 tower, +1 enemy tower |
| Harmonic Vibe | 7 | 1 | +5 tower, +1 enemy tower |
| Magic Drain | 8 | 1 | Enemy loses 8 mana |
| Crystallize | 8 | 1 | +11 tower, -6 wall |
| Sapphire | 10 | 1 | +11 tower |
| Thief | 10 | 1 | Steal 5 mana from enemy |
| Magic Vault | 11 | 1 | +1 Monastery, +6 tower |
| Succubus | 14 | 1 | 5 direct damage to enemy tower, enemy loses 8 troops |
| Diamond | 15 | 1 | +15 tower |
| Tower Surge | 18 | 1 | +20 tower |

### Green Cards (Troops)

| Card | Cost | Copies | Effect |
|------|------|--------|--------|
| Full Moon | 0 | 1 | +1 Barracks to all, +3 troops to you |
| Mad Cow Disease | 0 | 1 | All players lose 6 troops |
| Moody Goblins | 1 | 2 | 4 damage to enemy, -3 mana |
| Faery | 1 | 2 | 2 damage to enemy; play again |
| Elven Scout | 2 | 1 | Draw 1, discard 1; play again |
| Goblin Mob | 3 | 2 | 6 damage to enemy, 3 self-damage |
| Husbandry | 3 | 1 | +1 Barracks |
| Orc | 3 | 2 | 5 damage to enemy |
| Goblin Archers | 4 | 1 | 3 direct damage to enemy tower, 1 self-damage |
| Slasher | 5 | 1 | 6 damage to enemy |
| Dwarves | 5 | 2 | 4 damage to enemy, +3 wall |
| Imp | 5 | 1 | 6 damage to enemy, all players lose 5 ore, 5 mana, 5 troops |
| Ogre | 6 | 2 | 7 damage to enemy |
| Little Snakes | 6 | 1 | 4 direct damage to enemy tower |
| Rapid Sheep | 6 | 1 | 6 damage to enemy, enemy loses 3 troops |
| Shadow Faerie | 6 | 1 | 2 direct damage to enemy tower; play again |
| Troll Keeper | 7 | 2 | +2 Barracks |
| Spizzer | 8 | 1 | If enemy wall = 0: 10 damage; else 6 damage |
| Tower Gremlin | 8 | 1 | 2 damage to enemy, +4 wall, +2 tower |
| Unicorn | 9 | 1 | If Monastery > enemy: 12 damage; else 8 damage |
| Werewolf | 9 | 1 | 9 damage to enemy; if enemy wall = 0, play again |
| Stone Giant | 15 | 1 | 10 damage to enemy, +4 wall |
| Vampire | 17 | 1 | 10 damage to enemy, enemy loses 5 troops, -1 enemy Barracks |
| Dragon | 25 | 1 | 20 damage to enemy, enemy loses 10 mana, -1 enemy Barracks |
