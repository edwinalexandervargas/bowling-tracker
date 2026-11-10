import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isFrameComplete } from '../scoring/frame'
import type { Ball, Session, Pattern, BowlerProfile, Shot, Frame } from '../types'

type GameEntry = {
  sessionId: string
  gameIndex: number
  frameIndex: number
  currentBallId?: string
}

type AppState = {
  // Data
  profile: BowlerProfile | null
  balls: Ball[]
  sessions: Session[]
  patterns: Pattern[]

  // Entry state
  activeEntry: GameEntry | null

  // Profile
  setProfile: (profile: BowlerProfile) => void

  // Arsenal
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

export const useGameStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      balls: [],
      sessions: [],
      patterns: [],
      activeEntry: null,

      setProfile: (profile) => set({ profile }),

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

        const newGame = { id: crypto.randomUUID(), frames: [] }
        session.games.push(newGame)

        set({
          sessions: [...state.sessions],
          activeEntry: {
            sessionId: session.id,
            gameIndex: session.games.length - 1,
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

        const { frameIndex } = entry
        let frame = game.frames[frameIndex]

        // Create the frame if it doesn't exist yet
        if (!frame) {
          frame = { shots: [], ballId: entry.currentBallId }
          game.frames[frameIndex] = frame
        }

        // First shot starts with full rack, second starts where first left off
        const pinsBefore =
          frame.shots.length === 0
            ? 1023
            : frame.shots[frame.shots.length - 1].pinsAfter

        // 10th frame: reset pins after a strike or spare
        const isTenth = frameIndex === 9
        const lastShot = frame.shots[frame.shots.length - 1]
        const pinsBeforeResolved =
          isTenth && lastShot && lastShot.pinsAfter === 0
            ? 1023
            : pinsBefore

        const shot: Shot = { pinsBefore: pinsBeforeResolved, pinsAfter }
        frame.shots.push(shot)

        // Use the tested helper for auto-advance
        const complete = isFrameComplete(frame.shots, frameIndex)
        const nextFrameIndex = complete && frameIndex < 9
          ? frameIndex + 1
          : frameIndex

        set({
          sessions: [...state.sessions],
          activeEntry: { ...entry, frameIndex: nextFrameIndex },
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

        const frame = game.frames[entry.frameIndex]
        if (frame) {
          frame.ballId = ballId
        }

        set({
          sessions: [...state.sessions],
          activeEntry: { ...entry, currentBallId: ballId },
        })
      },

      nextGame: () => {
        const state = get()
        const entry = state.activeEntry
        if (!entry) return
        get().startGame(entry.currentBallId)
      },
    }),
    {
      name: 'bowling-tracker',
    }
  )
)