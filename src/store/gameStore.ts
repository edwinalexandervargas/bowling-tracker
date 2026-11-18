import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { isFrameComplete } from '../scoring/frame'
import { addShot } from '../game/game'
import { removeLastShot } from '../game/removeLastShot'
import type { Ball, BallSpec, Session, Pattern, BowlerProfile, Game, SeasonClose } from '../types'
import type { Collections } from '../sync/tables'
import { blockedForGuest, isGuest } from '../guest/guestStore'

// Where the store is saved on the device. A guest gets a key of their own, so a
// demo never overwrites, or shows, the nights of an account used on this device.
export const GAME_KEY = 'bowling-tracker'
export const GUEST_GAME_KEY = 'bowling-tracker-guest'

const savedAs = (name: string) => (isGuest() ? GUEST_GAME_KEY : name)
const local = () => globalThis.localStorage as Storage | undefined
const routedStorage: StateStorage = {
  getItem: (name) => local()?.getItem(savedAs(name)) ?? null,
  setItem: (name, value) => local()?.setItem(savedAs(name), value),
  removeItem: (name) => local()?.removeItem(savedAs(name)),
}

type GameEntry = {
  sessionId: string
  gameIndex: number
  frameIndex: number
}

type AppState = {
  // Data
  profile: BowlerProfile | null
  ballSpecs: BallSpec[]
  balls: Ball[]
  sessions: Session[]
  patterns: Pattern[]
  seasonCloses: SeasonClose[]

  // Entry state
  activeEntry: GameEntry | null

  // Profile
  updateProfile: (patch: Partial<BowlerProfile>) => void

  // Arsenal
  addBallSpec: (spec: BallSpec) => void
  updateBallSpec: (id: string, updates: Partial<BallSpec>) => void
  addBall: (ball: Ball) => void
  updateBall: (id: string, updates: Partial<Ball>) => void
  removeBall: (id: string) => void

  // Patterns
  addPattern: (pattern: Pattern) => void
  updatePattern: (pattern: Pattern) => void
  removePattern: (id: string) => void

  // Seasons
  closeSeason: (leagueKey: string) => void
  undoCloseSeason: (leagueKey: string) => void

  // Session flow
  startSession: (session: Session) => void
  startGame: () => void
  endSession: () => void
  resetNights: () => void

  // Sync: write records downloaded from the account into the store
  applyRemote: (patch: Partial<Collections>) => void

  // Entry flow
  recordShot: (pinsAfter: number) => void
  undoShot: () => void
  goToFrame: (frameIndex: number) => void
  nextGame: () => void
}

// Helper: find the current game being entered
function getActiveGame(state: AppState) {
  const entry = state.activeEntry
  if (!entry) return null

  const session = state.sessions.find((s) => s.id === entry.sessionId)
  if (!session) return null

  return session.games[entry.gameIndex] ?? null
}

// The store with no data in it: what a guest's demo is swapped out for.
export const emptyCollections = (): Collections & { activeEntry: GameEntry | null } => ({
  profile: null,
  ballSpecs: [],
  balls: [],
  sessions: [],
  patterns: [],
  seasonCloses: [],
  activeEntry: null,
})

// Helper: return NEW sessions with one game swapped out (never mutates)
function replaceGame(
  sessions: Session[],
  sessionId: string,
  gameIndex: number,
  newGame: Game
): Session[] {
  return sessions.map((s) =>
    s.id === sessionId
      ? { ...s, games: s.games.map((g, i) => (i === gameIndex ? newGame : g)) }
      : s
  )
}

export const useGameStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyCollections(),

      // Actions marked "Guest: blocked" do nothing in guest mode and show the
      // sign-up prompt instead. Screens check first too, so a form isn't
      // cleared or navigated away from; this is the backstop. Scoring and
      // sessions are open to guests: they stay on the device and never sync.

      // Merge so saving one part (e.g. weight) doesn't wipe another (e.g. PAP)
      updateProfile: (patch) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({ profile: { ...state.profile, ...patch } }))
      },

      addBallSpec: (spec) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({ ballSpecs: [...state.ballSpecs, spec] }))
      },

      // A model's details are shared by every copy of that ball
      updateBallSpec: (id, updates) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({
          ballSpecs: state.ballSpecs.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }))
      },

      addBall: (ball) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({ balls: [...state.balls, ball] }))
      },

      updateBall: (id, updates) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({
          balls: state.balls.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }))
      },

      removeBall: (id) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({
          balls: state.balls.filter((b) => b.id !== id),
        }))
      },

      addPattern: (pattern) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({ patterns: [...state.patterns, pattern] }))
      },

      // Replaces the whole pattern, so switching between house and sport can't leave stray fields
      updatePattern: (pattern) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({ patterns: state.patterns.map((p) => (p.id === pattern.id ? pattern : p)) }))
      },

      // Nights bowled on a removed pattern stay, and count as house shot in stats
      removePattern: (id) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({ patterns: state.patterns.filter((p) => p.id !== id) }))
      },

      closeSeason: (leagueKey) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => ({
          seasonCloses: [
            ...state.seasonCloses,
            { id: crypto.randomUUID(), leagueKey, closedAt: new Date().toISOString() },
          ],
        }))
      },

      // Reopens the most recently closed season of this league
      undoCloseSeason: (leagueKey) => {
        // Guest: blocked
        if (blockedForGuest()) return
        set((state) => {
          const mine = state.seasonCloses.filter((c) => c.leagueKey === leagueKey)
          const last = mine.sort((a, b) => b.closedAt.localeCompare(a.closedAt))[0]
          return last ? { seasonCloses: state.seasonCloses.filter((c) => c.id !== last.id) } : {}
        })
      },

      startSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
        })),

      startGame: () => {
        const state = get()
        const session = state.sessions[state.sessions.length - 1]
        if (!session) return

        const newGame: Game = { id: crypto.randomUUID(), frames: [] }

        set({
          sessions: state.sessions.map((s) =>
            s.id === session.id ? { ...s, games: [...s.games, newGame] } : s
          ),
          activeEntry: {
            sessionId: session.id,
            gameIndex: session.games.length, // old length = index of the new game
            frameIndex: 0,
          },
        })
      },

      endSession: () => set({ activeEntry: null }),

      // Clears every night and season close. Arsenal, patterns and profile stay.
      // When signed in, the sync layer sees the removals and deletes the cloud copies too.
      resetNights: () => {
        // Guest: blocked
        if (blockedForGuest()) return
        set({ sessions: [], seasonCloses: [], activeEntry: null })
      },

      applyRemote: (patch) => set(patch),

      recordShot: (pinsAfter) => {
        const state = get()
        const entry = state.activeEntry
        if (!entry) return

        const game = getActiveGame(state)
        if (!game) return

        // All shot rules live in the tested pure function
        const newGame = addShot(game, entry.frameIndex, pinsAfter)

        // Auto-advance when the frame is done (frames 1-9 only)
        const frame = newGame.frames[entry.frameIndex]
        const complete = isFrameComplete(frame.shots, entry.frameIndex)
        const nextFrameIndex =
          complete && entry.frameIndex < 9 ? entry.frameIndex + 1 : entry.frameIndex

        set({
          sessions: replaceGame(state.sessions, entry.sessionId, entry.gameIndex, newGame),
          activeEntry: { ...entry, frameIndex: nextFrameIndex },
        })
      },

      undoShot: () => {
        const state = get()
        const entry = state.activeEntry
        if (!entry) return

        const game = getActiveGame(state)
        if (!game || game.frames.length === 0) return

        // The undone shot lived in the last frame, so that's where the next ball goes
        const frameOfUndoneShot = game.frames.length - 1
        const newGame = removeLastShot(game)

        set({
          sessions: replaceGame(state.sessions, entry.sessionId, entry.gameIndex, newGame),
          activeEntry: { ...entry, frameIndex: frameOfUndoneShot },
        })
      },

      goToFrame: (frameIndex) =>
        set((state) => ({
          activeEntry: state.activeEntry
            ? { ...state.activeEntry, frameIndex }
            : null,
        })),

      nextGame: () => {
        if (!get().activeEntry) return
        get().startGame()
      },
    }),
    {
      name: GAME_KEY,
      storage: createJSONStorage(() => routedStorage),
    }
  )
)