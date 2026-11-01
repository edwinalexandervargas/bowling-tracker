cat > DECISIONS.md << 'EOF'
# Decisions Log

## Frontend stack: Vite + React + TS + Tailwind + Zustand
- **Decision:** Vite, React, TypeScript, Tailwind, Zustand, built mobile-first as an installable PWA.
- **Alternatives:** Next.js (SSR not needed for a mobile-first tracker), Redux (more boilerplate for this state size).
- **Why:** Matches my existing skills, fast iteration, small footprint for an app used on a phone.

## Backend: Supabase (Postgres)
- **Decision:** Supabase for database and auth.
- **Alternatives:** Firebase/Firestore (faster to start and I've used it before, but weaker for relational data and cross-game aggregates); local-first IndexedDB with later sync (more work than needed since offline isn't a requirement).
- **Why:** The data is relational (session → games → shots, ball → layouts, pattern → sessions), so Postgres fits it directly. I haven't used Supabase before, so it broadens my stack, and I get schema design, constraints, and migrations to talk about in interviews.

## Linter: ESLint
- **Decision:** ESLint with typescript-eslint and react-hooks rules.
- **Alternatives:** Oxlint (much faster, but fewer rules and no full type-aware linting yet).
- **Why:** Most complete React/TS rule coverage and the standard in most codebases. Lint speed isn't a bottleneck at this project's size.

## TypeScript pinned to 6.0.x
- **Decision:** Pin TypeScript to ~6.0.3 instead of the 7.x the Vite template installed.
- **Alternatives:** `--legacy-peer-deps` (hides the conflict, risks broken linting); wait for typescript-eslint to support TS 7.
- **Why:** typescript-eslint's peer range excludes TS 7. Pinning keeps the linter supported and the install clean. Revisit when typescript-eslint adds TS 7 support.

## Repo visibility: public
- **Decision:** Public GitHub repo from the first commit.
- **Alternatives:** Private while building, then switch to public later.
- **Why:** It's a portfolio project, so commit history showing the work is part of the point. Secrets stay out of git through .env.local and the .gitignore.
EOF

## Scorer loops over frames with a roll pointer, not over rolls
- Decision: for-loop over 10 frames, with an index `i` into the flat rolls array that advances by 1 (strike) or 2 (otherwise).
- Alternatives: reduce over rolls (can't see frame boundaries); convert to Frame[] first (extra step, and the 10th frame still needs special handling).
- Why: bonuses read ahead from `i`, and the frame count is fixed at 10, so the loop condition is simple and never runs past the game.