## Vitest as the test runner
- **Decision:** Vitest.
- **Alternatives:** Jest (needs extra config for TS/ESM in a Vite project).
- **Why:** It reuses the Vite config and handles TypeScript and ESM natively.

## Scorer input is a flat list of pins knocked down per roll
- **Decision:** score(rolls: number[]). Bitmask-to-pin-count conversion happens outside the scorer.
- **Alternatives:** Structured Frame[] input (the scorer would need to know about frame structure and the 10th-frame exception up front).
- **Why:** The scorer stays decoupled from the pin deck and bitmasks, and tests are just arrays of numbers.

## Scorer loops over frames with a roll pointer, not over rolls
- **Decision:** for-loop over 10 frames, with an index `i` into the flat rolls array that advances by 1 (strike) or 2 (otherwise).
- **Alternatives:** reduce over rolls (can't see frame boundaries); convert to Frame[] first (extra step, and the 10th frame still needs special handling).
- **Why:** Bonuses read ahead from `i`, and the frame count is fixed at 10, so the loop never runs past the game.

## 10th frame handled by the flat rolls array, no special case
- **Decision:** No dedicated 10th-frame logic. Bonus rolls are read ahead from the flat array, and the loop stops at 10 frames. Strike (perfect game), spare, and open 10th are all tested.
- **Alternatives:** Frame[] input with a special 10th-frame shape (up to 3 rolls).
- **Why:** The bonus rolls are just the next entries in the array.

## Live scratch score via frameScores; score() is a wrapper
- **Decision:** frameScores(rolls) returns cumulative totals for scorable frames only. score() returns the last entry (0 if none).
- **Alternatives:** Treat missing rolls as 0 (a pending strike shows 10, then jumps); make score() partial-aware.
- **Why:** Matches an alley scoresheet, where a frame stays blank until its bonus rolls exist.
- **Risk:** Callers can't tell "finished" from "partial" by score() alone; check frameScores(rolls).length === 10.

## Roll validity is enforced by the pin deck, not the scorer
- **Decision:** score() assumes every roll is valid (0-10, consistent with pins standing). The pin deck is the only producer of rolls.
- **Alternatives:** Validate inside score() and throw; validate at the persistence boundary.
- **Why:** The deck makes invalid rolls unrepresentable at input time.

## Pins standing stored as a 10-bit bitmask
- **Decision:** Pin N is bit N-1. 1 = standing, 0 = down. All standing = 1023, strike = 0.
- **Alternatives:** Array of 10 booleans; array of pin numbers.
- **Why:** One small integer per shot is compact to store, and leaves, splits, and conversions can be derived with bit operations.


## Build order: UI before leave and split logic
- Decision: after pinsKnockedDown, build the data model and score entry UI next. Leave names, split detection, and spare conversion come later, alongside the stats.
- Alternatives: finish all pin logic first, then build UI.
- Why: a working screen gives faster feedback and keeps momentum. Entry only needs pinsKnockedDown, and the stats are the only consumers of leave logic.

## Offline-first, local storage now, Supabase later
- Decision: phase 1 writes to Zustand persist (localStorage). Phase 2 adds Supabase for backup and sync.
- Alternatives: Supabase from day one (blocked on setup, fails offline); IndexedDB (more storage, but heavier API for this data size).
- Why: bowling alleys have bad signal, and a tap that doesn't save mid-game is unacceptable. Local-first means the app works before any backend exists.
- Risk: localStorage caps at ~5 MB. Fine for a few seasons of league data, but worth monitoring.

## Layout type supports three drilling systems
- Decision: discriminated union on `system` field: '2ls', 'pin-buffer', 'traditional'. Each branch carries only its own measurements.
- Alternatives: one flat type with optional fields for every system (no compile-time safety); separate Ball types per system.
- Why: TypeScript enforces that only the right fields exist per system, so you can't set pinToCog on a traditional layout.

## Surface lives on Ball, not Layout
- Decision: surface is a Ball field, not a Layout field.
- Why: you can change surface without redrilling. They have different lifecycles.

## Store records shots; scoring stays in pure functions
- Decision: the Zustand store manages shot recording, frame navigation, and arsenal. Scoring (score, frameScores) is called by the UI at render time, not stored.
- Alternatives: store computed scores alongside shots (duplicated state, can drift).
- Why: scores are derived from shots. Computing at render keeps one source of truth.

## Pin deck: tap what's left standing
- Decision: all pins display as standing. The bowler taps only the pins still up after the shot, then confirms. Untapped pins are counted as knocked down. A strike is zero taps.
- Alternatives: tap pins knocked down (more taps on good shots); drag to select (harder on a small phone screen).
- Why: at the alley you're looking at what's left, not what you hit. Minimizes taps on the most common outcomes.

## Shot recording is a pure function; the store stays thin
- Decision: addShot(game, frameIndex, pinsAfter, ballId?) in src/game/ returns a
  NEW Game and never mutates its input. The Zustand store calls it and saves the result.
- Alternatives: manual spreads inside the store action; Immer middleware.
- Why: the old recordShot mutated nested objects, so subscribed components didn't
  re-render. A pure helper fixes that, and it also keeps the shot rules (pinsBefore,
  10th-frame rack reset, rejecting extra or impossible shots) unit-testable and
  out of the state library. Tradeoff: more code up front.

## Second-ball entry: Spare / Missed / partial tap
- Decision: when the rack isn't fresh, PinDeck offers Spare (0 standing), Missed (pinsAfter = pinsBefore), or tapping the pins still up. Only pins in pinsBefore are tappable.
- Alternatives: always tap what's left (more taps on the common spare/miss cases).
- Why: one tap for the two most common outcomes. The data model doesn't change, because every option produces a pinsAfter mask.

## Shortcut buttons are disabled once any pin is tapped
- Decision: Strike / Spare / Missed are disabled while any pin is tapped; Confirm or Clear are the only ways forward.
- Alternatives: shortcuts clear the taps and win (hides mistakes, skews spare stats); a confirm dialog (extra tap mid-game); hiding the buttons (layout jumps on mobile).
- Why: tapped pins and a shortcut contradict each other, so the UI shouldn't allow both. Disabling keeps button positions stable.


## Ball specs API is a separate project
- Decision: no external ball-spec API in this app. Specs are entered manually for now, and a standalone specs API (own repo) comes after step 7.
- Alternatives: scrape retailer/database sites (terms-of-use risk, brittle); build the API now (stalls the app); use an existing public API (none found).
- Why: the app must work offline at the alley, so an API would only ever seed specs. Keeping it separate keeps step 4 small and gives a second portfolio repo.

## Layouts: two systems, three numbers each
- Decision: Layout is '2ls' (pin-to-PAP × PSA-to-PAP × pin buffer, inches) or 'dual-angle' (drilling angle° × pin-to-PAP" × VAL angle°). Fields are ordered the way drillers write them.
- Alternatives: four systems including pin-buffer and traditional (more surface area than needed; pin-buffer merges into 2LS); free-text layout string (no per-system validation or stats).
- Why: matches how my layouts are written. The discriminated union still enforces per-system fields.

## Pattern volume is numeric mL, with free-text notes
- Decision: volume?: number (total oil, mL); ratio?: number (the X in X:1); notes?: string for anything else.
- Alternatives: volume as a string ("High", "24.5") — can't sort, compare or chart, and "High"/"heavy" split stats.
- Why: per-pattern stats need numbers. Notes keeps the freedom without polluting the numeric field.

## Pattern input: manual first, then CSV/JSON, screenshots later
- Decision: manual entry form now; CSV/JSON import next; screenshot import via a vision API once the backend exists. Every import fills the manual form as a draft for review.
- Alternatives: browser OCR (Tesseract.js: offline, but fragile per-layout parsing); vision API now (needs a backend for the API key, online only).
- Why: the form is the shared landing spot for every input method, and extracted numbers are never saved without a human check.

## Patterns: house shot vs sport
- Decision: Pattern has kind 'house' | 'sport'. Sport requires length; house shot needs only a name, numbers optional.
- Alternatives: make length optional for everything (loses the guarantee that sport patterns have a length); a separate HouseShot type (two lists to manage, sessions would need two kinds of pattern reference).
- Why: league nights are usually on an unpublished house shot. The union keeps one patterns list while TypeScript still enforces length on sport patterns.

## Sessions: no pattern picked means house shot
- Decision: patternId is optional on every session type. Blank = house shot; per-pattern stats bucket these as "House shot".
- Alternatives: require a pattern for league/tournament (forces adding a "THS" pattern first, extra taps at the alley); create a default House pattern record (a hidden fake row in the patterns list).
- Why: league nights are almost always on an unpublished house shot, so the default should cost zero taps. A sport pattern is only picked when one is actually published.

## Session pattern picker is a native <select>
- Decision: native <select> with "House shot" as the first option (value '').
- Alternatives: custom dropdown or bottom sheet (more code, accessibility work); tappable pattern cards (don't scale past a few patterns).
- Why: on mobile the OS picker is large, accessible, and free. Revisit if pattern details need to show while picking.
