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


## Pattern import: drop CSV/JSON, screenshots after the backend
- Decision: manual entry only for now. Screenshot import (vision API fills the manual form as a draft for review) comes once Supabase exists. CSV/JSON import is dropped.
- Alternatives: CSV/JSON import (patterns are almost never published that way); vision API now (pulls backend setup ahead of stats); Tesseract.js OCR (unreliable on graph-heavy pattern sheets); attach screenshot to pattern (images too big for localStorage).
- Why: a pattern is about four numbers entered at home, so manual entry is cheap. Stats and the dashboard deliver more value first, and the vision import becomes a small add-on once a server function can hold the API key.


## Strike % counts every fresh rack (12 chances in a perfect game)
- Decision: a strike chance is any shot thrown at a full rack, including 10th-frame fill balls. Stats start from firstBalls(game): one entry per fresh rack with its leave and whether it was converted.
- Alternatives: one chance per frame (10 per game; hides 10th-frame fill balls).
- Why: counts every shot where a strike was possible, which matches league software. Working per rack instead of per frame also makes the 10th frame need no special case.


## Split = headpin down + a gap between standing pins
- Decision: isSplit(leave) builds groups of standing pins that touch (side by side, diagonal, or directly behind like 2-8) and calls it a split when the headpin is down and there is more than one group.
- Alternatives: a hard-coded list of named splits (misses rare combos, easy to get wrong); "any two non-adjacent pins" (would wrongly count sleepers like 2-8).
- Why: matches the USBC idea of a split from the bitmask alone, so baby splits (3-10, 2-7) and big splits are all caught, and it's testable leave by leave.

## Per-ball stats are shot stats only
- Decision: byBall reports strike/spare/leave stats per ball, not average or high game.
- Alternatives: credit a game's score to the ball used most (misleading when switching mid-game); force one ball per game (doesn't match how I bowl).
- Why: the ball is recorded per frame, so only rack-level outcomes can be attributed honestly.

## Average and high series use completed games only
- Decision: a game counts toward average/high game once all 10 frames are scorable. High series needs a session with 3+ completed games. Average is floored like league averages.
- Alternatives: include partial games (drags the average down mid-game); allow any game count for series (a 1-game practice could be "high series").
- Why: keeps headline numbers comparable to a league sheet. Shot stats (strike/spare %) still count every rack, finished or not.

## Navigation: short bottom bar + side drawer
- Decision: the bottom bar keeps Score, Nights, Stats, plus a Menu tab. Menu opens a side drawer with Arsenal, Patterns, Profile. The Menu tab shows as active on those routes.
- Alternatives: 6-tab bottom bar (cramped, ~60px per tab); hamburger drawer with everything (Score becomes two taps, and the top-corner button is hard to reach one-handed); "More" bottom sheet (no side menu).
- Why: league-night screens stay one thumb-tap away, and setup screens (rarely used at the lane) move out of the way. The Menu button sits in the bar, so it's still thumb-reachable.

## Side pots are derived, and a frame's mark is settled by its first rack
- Decision: bingoBoard(games) and threeSixNine(games) are pure functions over a session's first 3 games; nothing about the pots is stored. A bingo square is decided by frameMark, which judges the first rack only: strike on ball 1 or spare with balls 1-2 is a hit (gutter then all ten is a spare), open is a miss. A 10th-frame square lights before the fill balls, which never count.
- Alternatives: store pot state on the session (second source of truth, breaks on undo); wait for the whole 10th frame to finish (fill balls can't change the result, so it only delays the square).
- Why: same rule as scores, computed at render from shots. Reusing isFrameComplete on the first rack means the 10th frame needs no special case.

## Scoring doesn't record a ball; the arsenal is reference only
- Decision: score entry no longer asks which ball was thrown. Frame has no ballId, and per-ball stats (byBall, the "By ball" table) are removed. Supersedes "Per-ball stats are shot stats only".
- Alternatives: keep the picker but make it optional (dead control on the busiest screen, and a stats table that stays empty); record one ball per game instead of per frame (fewer taps, but wrong whenever I switch mid-game).
- Why: the score screen is used one-handed between shots, so every control there has to earn its place. Balls and layouts still live in Arsenal.

## Navigation: league-night bottom bar on phones, sidebar from 768px
- Decision: on a phone the bottom bar holds Home, Score, Side pots, Nights and Menu; Menu opens a drawer with Stats, Arsenal, Patterns, Profile. From 768px, and on a phone held sideways, a sidebar shows all eight and there is no drawer. All three render from one list in navLinks.ts. Supersedes "Navigation: short bottom bar + side drawer".
- Alternatives: put Side pots in the drawer (two taps away mid-game, exactly when I'd check it); drawer only with a top menu button (every switch is two taps and the corner is a stretch one-handed).
- Why: Score and Side pots are the screens I flip between during a game, so both stay one thumb-tap away. Stats moves to the drawer because Home already shows the headline numbers.

## Visual direction: Lane at night, role-named tokens, one dark theme
- Decision: one dark theme (oil blue, maple accent, pin white) defined as role tokens in Tailwind's @theme: page, surface, raised, line, ink, muted, accent, on-accent, danger. Tailwind's default palette is switched off. Archivo Variable is bundled with the app; scores use its narrow width with fixed-width digits.
- Alternatives: a light "scoresheet" theme (most legible sheet, but a bright screen in a dim alley and weaker glow effects); a "cosmic" theme with two loud accents (most personality, but tempting to signal state by colour alone); loading the font from Google (fails with no signal).
- Why: the app is used in a dim alley, and one accent keeps states clear. Role names mean the palette can change in one file, and with the defaults off a screen can't use a colour that isn't a token.

## Sign-in is optional, never a gate
- Decision: the app is fully usable signed out. Sign-in lives at /login, reached from the menu and sidebar, and nothing waits on the auth check at startup.
- Alternatives: require sign-in before anything else (blocks the app with no signal, and blocks it entirely if auth is misconfigured).
- Why: offline-first means every tap saves locally first. An account is only needed for backup and sync.

## Side pots screen: a tested "looks" layer between pot logic and UI
- Decision: bingoLooks and threeSixNineLooks turn pot state into one of seven looks per square (won, lit, dim, miss, closest, target, idle). The screen only maps a look to classes. A line counts as "closest" once it has a hit; nothing glows after a pot is secured or lost; a finished night that never completed a line reads "Not won".
- Alternatives: decide the look inside the component (untested branching in JSX); add "live" and "decided" handling to bingoBoard itself (mixes display concerns into the rules).
- Why: what happened and what to show are different questions. The second depends on whether the night is live, which the rules shouldn't know about. As a pure function it is unit tested.

## Auth: email and password
- Decision: sign in with email and password through Supabase Auth. Password reset is a later item.
- Alternatives: emailed six-digit code (every sign-in sends an email, and Supabase's built-in sender allows 2 per hour); Google sign-in (one tap, but needs a Google Cloud project and redirect setup outside the code).
- Why: it was already built and tested, sign-in happens once per device, and it has the fewest moving parts outside my code.

## Cloud schema: one row per record, games as JSON inside the night
- Decision: a table per top-level thing (profiles, ball_specs, balls, patterns, sessions, season_closes). A night is one row with its games in a JSONB column. Primary key is (user_id, id). Row-level security limits every row to its owner.
- Alternatives: one JSON blob per user (simplest, but a conflict can only be settled for everything at once); fully normalised down to one row per shot (queryable in SQL, but far more mapping and sync code, and my stats run in the browser anyway).
- Why: a night is the unit the app reads and writes, so conflicts resolve per night and the mapping stays small, while still being real tables with real security rules.

## Sync: automatic in the background, newest edit wins
- Decision: every change is marked as waiting and uploaded when there is signal; newer records are downloaded on open, sign-in, focus and reconnect. Per record, the newest edit wins, enforced by a database trigger. Deletes are a deleted_at marker. The UI never waits on any of it.
- Alternatives: manual backup and restore buttons (simple, but easy to forget and not really sync); live updates over a realtime connection (more complexity and battery than one bowler needs).
- Why: a night bowled with no signal should back itself up later without me thinking about it. The rule fits in one sentence, and conflicts are rare because they are per night.
- Risk: "newest" trusts each device's clock.

## Editing reuses the add forms
- Decision: tapping a ball opens the Add ball form filled in; tapping a pattern loads it into the form on the Patterns screen. Both get Save changes and a Delete with a confirm step. A ball model's details (brand, name, RG, differential) are shared by every copy of that ball.
- Alternatives: edit in place on the card (fast, but cramped on a phone and a second form to keep in step); edit in a bottom sheet (focused, but the most new UI and focus handling).
- Why: one form per thing means add and edit can't drift apart, and it was the smallest change.

## Sign-in required for the whole app
- Decision: signed out, the only reachable screen is Sign in. No navigation, no local-only use. A route guard waits for the saved-session check, then redirects, handing the attempted path back so a deep link survives signing in.
- Alternatives: app open signed out with sign-in optional for backup (the original offline-first rule); gated by default with a "continue without an account" escape hatch.
- Why: one mental model, and every screen can assume there is a user. A build with no Supabase keys stays open, since gating one would leave an app nobody can get into.
- Risk: an expired session with no usable signal at the alley leaves my nights on the device but unreachable, because Supabase refreshes sessions over the network.

## Bingo lines must be all strikes or all spares
- Decision: a row, column or diagonal wins only if its five frames are the same mark. A line holding one of each is dead, the same as one holding an open frame.
- Alternatives: any five marks win (what was built first); only frames bowled back to back count, which would leave columns and diagonals unwinnable.
- Why: it matches how the pot is actually run, and it makes a spare in the middle of a strike line a real cost instead of a free pass.
- Note: a board can now be lost with no open frame on it.

## Guest mode: local only, no Supabase session
- **Decision:** "Try as guest" fills the store with sample data and runs the app with no Supabase session at all. A guest's data is saved on the device under its own key (`bowling-tracker-guest`), sync ignores the store while a guest holds it, and every action that would save to an account (arsenal, patterns, profile and PAP, seasons, reset) does nothing and opens a "Create a free account to save this." prompt. Scoring, sessions and side pots work as normal. On sign-up, the guest can keep the nights they bowled; those wait on the device (up to two days, for the email confirmation) and join the account's nights at its first sign-in here, where sync uploads them like any other edit. Sample records all have ids starting `sample-`, so they never come along.
- **Alternatives:** Supabase anonymous sign-ins (a real user id, and upgrading to a full account keeps the same id, so nothing has to be copied); reusing the normal store key (a guest on a phone that was signed in before would see that account's nights, and their games would upload at the next sign-in).
- **Why:** anonymous users get the same `authenticated` role as real ones, so every table's policies would need an extra "not anonymous" rule, and one missed table would be an open write. They also leave a user row behind for every visitor. The app already works fully from the device, so a guest needs no backend: with no session there is no token, and the tables grant nothing to the `anon` role. The UI blocking is for the experience; the database refusing anything without a signed-in user is the real guard.
- **Risk:** kept nights only survive the confirmation in the same browser, so confirming on another device loses them. A demo left mid-sign-up hands its kept nights to whoever signs in next on that browser within two days. Guests can't add patterns, so a night bowled on a sample pattern is kept as house shot.
