import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isFrameComplete } from '../scoring/frame'
import { addShot } from '../game/game'
import { removeLastShot } from '../game/removeLastShot'
import type { Ball, BallSpec, Session, Pattern, BowlerProfile, Game } from '../types'

type GameEntry = {
  sessionId: string
  gameIndex: number
  frameIndex: number
  currentBallId?: string
}

type AppState = {
  // Data
  profile: BowlerProfile | null
  ballSpecs: BallSpec[]
  balls: Ball[]
  sessions: Session[]
  patterns: Pattern[]

  // Entry state
  activeEntry: GameEntry | null

  // Profile
  setProfile: (profile: BowlerProfile) => void

  // Arsenal
  addBallSpec: (spec: BallSpec) => void
  addBall: (ball: Ball) => void
  updateBall: (id: string, updates: Partial<Ball>) => void
  removeBall: (id: string) => void

  // Patterns
  addPattern: (pattern: Pattern) => void

  // Session flow
  startSession: (session: Session) => void
  startGame: (ballId?: string) => void
  endSession: () => void

  // Entry flow
  recordShot: (pinsAfter: number) => void
  undoShot: () => void
  goToFrame: (frameIndex: number) => void
  changeBall: (ballId: string) => void
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
      profile: null,
      ballSpecs: [],
      balls: [],
      sessions: [],
      patterns: [],
      activeEntry: null,

      setProfile: (profile) => set({ profile }),

      addBallSpec: (spec) =>
        set((state) => ({ ballSpecs: [...state.ballSpecs, spec] })),

      addBall: (ball) =>
        set((state) => ({ balls: [...state.balls, ball] })),

      updateBall: (id, updates) =>
        set((state) => ({
          balls: state.balls.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      removeBall: (id) =>
        set((state) => ({
          balls: state.balls.filter((b) => b.id !== id),
        })),

      addPattern: (pattern) =>
        set((state) => ({ patterns: [...state.patterns, pattern] })),

      startSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
        })),

      startGame: (ballId) => {
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
            currentBallId: ballId,
          },
        })
      },

      endSession: () => set({ activeEntry: null }),

      recordShot: (pinsAfter) => {
        const state = get()
        const entry = state.activeEntry
        if (!entry) return

        const game = getActiveGame(state)
        if (!game) return

        // All shot rules live in the tested pure function
        const newGame = addShot(game, entry.frameIndex, pinsAfter, entry.currentBallId)

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

      changeBall: (ballId) => {
        const state = get()
        const entry = state.activeEntry
        if (!entry) return

        const game = getActiveGame(state)
        if (!game) return

        // New game with the current frame's ball swapped (if that frame exists yet)
        const newGame: Game = {
          ...game,
          frames: game.frames.map((f, i) =>
            i === entry.frameIndex ? { ...f, ballId } : f
          ),
        }

        set({
          sessions: replaceGame(state.sessions, entry.sessionId, entry.gameIndex, newGame),
          activeEntry: { ...entry, currentBallId: ballId },
        })
      },

      nextGame: () => {
        const entry = get().activeEntry
        if (!entry) return
        get().startGame(entry.currentBallId)
      },
    }),
    {
      name: 'bowling-tracker',
    }
  )
)