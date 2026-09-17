# Project: Fleet Combat

A browser-based, turn-based tactical space combat game. Two fleets face off and
fight to destruction. Single-player: human commander versus AI, with selectable
difficulty.

Battle style reference: **Master of Orion 2**. Turn-based, positional, resolved
on a discrete board — not a real-time action shooter.

---

## Hard technical constraints

- Vanilla HTML, CSS, and JavaScript. **No build step, no bundler, no npm
  dependencies, no frameworks.** It must run by opening `index.html`.
- Rendering via HTML5 Canvas 2D. No WebGL.
- **All asset and module paths must be relative** (`assets/ship.png`, not
  `/assets/ship.png`). The game is deployed to GitHub Pages as a project site
  served from a subpath, and absolute paths will 404 in production while
  working fine locally.
- Keep `.nojekyll` at the repository root. Do not delete it.
- No server-side code, no database, no network requests. Everything runs in the
  visitor's browser.
- Persistence via `localStorage` only, wrapped in try/catch, with the game
  rendering correctly when storage is empty or unavailable.
- Layout must remain usable down to 390px wide. Turn-based play is touch
  friendly and a lot of players will open the link on a phone. Do not build
  interactions that require hover or right-click as the only path.

---

## Combat model

### Board

Positional but deliberately simple: **range bands**, not a hex grid.

- 6 bands, numbered 1 (closest) to 6 (furthest).
- Each fleet occupies one side. A ship sits in a band and moves between bands.
- Fleets start at maximum separation and close.

Do not introduce a hex grid, facing arcs, or pathfinding without being asked.
The band model is chosen on purpose to keep targeting and range logic trivial.

### Turn structure

1. Initiative order computed from ship class and speed, recalculated each turn.
2. Each ship, on its activation: move (up to its movement allowance) and fire.
3. **Reaction step:** point-defense-capable ships fire at any missiles that will
   reach them before their next activation.
4. Missiles in flight advance.
5. End-of-turn: shield regeneration, destruction checks, victory check.

### Damage resolution order

Every hit resolves in this order, and this order is load-bearing:

1. **Shields** — a regenerating pool, per ship. Absorbs damage first. Partially
   regenerates at end of turn.
2. **Armor** — non-regenerating ablative value. Reduces or absorbs what gets
   through shields.
3. **Structure** — hull integrity. At 0, the ship is destroyed.

Weapon types have different multipliers against each of these three layers.
That multiplier table is the primary balance lever in the game — keep it in one
place, as data, not scattered through the combat code.

---

## Weapon platforms

Four platforms. Each must feel tactically distinct, not just differently
numbered.

| Platform | Range | Behavior |
| --- | --- | --- |
| **Beam** | Long, with falloff | Resolves instantly on fire. Damage decreases with distance. Strong against shields, weak against armor. |
| **Pulse cannon** | Short only (bands 1–2) | High rate of fire, steep falloff, low per-hit damage. **Doubles as point defense** in the reaction step — this is its most important role. |
| **Projectile** | All ranges, no falloff | Railguns and mass drivers. Flat reliable damage regardless of distance. Strong against armor, weak against shields. |
| **Missile** | Very long | Launched as a **persistent entity that travels the board over multiple turns**. Interceptable by pulse cannons. High damage on impact. Limited ammunition. |

The missile-versus-point-defense interplay is the tactical heart of the game.
A light ship survives a heavy salvo by shooting the torpedoes down, not by
absorbing them. Protect this mechanic when making balance changes.

---

## Ship classes

Six classes, light to heavy. Each should have a real role rather than being a
bigger version of the one below it.

| Class | Role |
| --- | --- |
| Patrol Craft | Fast, fragile, cheap. Screening and missile interception. |
| Corvette | Fast skirmisher. Closes to pulse cannon range. |
| Frigate | General purpose line ship. Mixed armament. |
| Destroyer | Missile platform with meaningful point defense. |
| Cruiser | Heavy armor and beams. Absorbs punishment. |
| Fleet Carrier | Long-range missile platform. Devastating at distance, nearly helpless in close. |

Ship definitions live in a **single data file**, separate from combat logic, so
stats can be tuned without touching code.

---

## Art direction

Hard science fiction industrial. Reaction-drive silhouettes, long spines,
utilitarian ribbed hulls, visible thruster geometry, no aerodynamic curves.
Muted metal palette. Aesthetic reference is *The Expanse*.

**Take the aesthetic only.** Do not reproduce named ships, specific hull
designs, faction names, or insignia from any existing franchise. All ship
names, factions, and markings in this project are original.

Note that this project intentionally departs from that reference in two ways:
it has energy weapons and it has shields. Both are deliberate design choices.

---

## AI and difficulty

Three tiers (names are placeholders — change freely):

- **Ensign** — fires at random valid targets, closes predictably, launches
  missiles piecemeal, minimal point defense coordination.
- **Commander** — focuses fire on the weakest target, holds position at its
  optimal range band, allocates point defense sensibly.
- **Admiral** — coordinates missile alpha strikes, targets by role rather than
  by weakness, exploits range bands against the player's loadout, and may field
  a larger fleet point budget.

**Difficulty must come from better decisions and fleet budget, never from raw
stat bonuses to AI ships.** Stat cheats feel unfair and, worse, they hide
whether the underlying balance actually works.

---

## Working agreements

- Work in **small milestones**. Finish, verify, and commit one before starting
  the next.
- Commit frequently with clear messages. Never make a large multi-system change
  in a single commit.
- Do not refactor, rename, or restructure existing code unless asked.
- Keep the combat resolution logic pure and testable: functions that take state
  and return new state, separate from rendering and input.
- Keep individual files under roughly 500 lines. Split by responsibility.
- All tunable numbers (ship stats, weapon tables, difficulty parameters) go in
  data files, never inline as literals in logic.
- When a change affects balance, say so explicitly rather than burying it.

---

## Milestone 1 (current)

The smallest playable, verifiable slice:

- Canvas renders the 6 range bands and two fleets of 3 placeholder ships.
- Initiative order computed and displayed.
- Ships can move between bands.
- **One** weapon type implemented (projectile), resolving damage correctly
  through shields, then armor, then structure.
- Ships are destroyed at 0 structure. Battle ends when one fleet is gone.

Placeholder rectangles are fine. Do not add art, sound, UI polish, the other
three weapon platforms, or the AI tiers until this loop is correct.

---

## Out of scope until asked

Fleet builder UI, campaign or persistent progression, multiplayer, fighters and
drones, subsystem criticals and boarding, sound design, animated sprite art.
