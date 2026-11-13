import type { Frame, Pattern, Session } from '../types'
import { scoreStats, seriesScore, shotStats, gameScore, type ScoreStats, type ShotStats } from './stats'

export const HOUSE_SHOT = 'house-shot' // bucket key for sessions with no patternId

const allFrames = (sessions: Session[]): Frame[] =>
  sessions.flatMap((s) => s.games.flatMap((g) => g.frames))

export type Summary = {
  sessions: number
  score: ScoreStats
  shots: ShotStats
  highSeries: number | null
}

export function summarize(sessions: Session[]): Summary {
  const series = sessions.map((s) => seriesScore(s.games)).filter((x): x is number => x !== null)
  return {
    sessions: sessions.length,
    score: scoreStats(sessions.flatMap((s) => s.games)),
    shots: shotStats(allFrames(sessions)),
    highSeries: series.length ? Math.max(...series) : null,
  }
}

export type PatternSlice = Summary & { key: string; label: string }

// Per pattern. Sessions without a pattern (or whose pattern was deleted) fall
// into the "House shot" bucket. Sorted by number of games, most first.
export function byPattern(sessions: Session[], patterns: Pattern[]): PatternSlice[] {
  const groups = new Map<string, Session[]>()
  for (const s of sessions) {
    const pattern = s.patternId ? patterns.find((p) => p.id === s.patternId) : undefined
    const key = pattern?.id ?? HOUSE_SHOT
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      label: key === HOUSE_SHOT ? 'House shot' : patterns.find((p) => p.id === key)!.name,
      ...summarize(group),
    }))
    .sort((a, b) => b.score.games - a.score.games || a.label.localeCompare(b.label))
}

export type BallSlice = { ballId: string; shots: ShotStats }

// Per ball. The ball is recorded per frame, so only shot stats apply here:
// a game score can't be split between the balls used in it.
// Frames with no ball recorded are left out.
export function byBall(sessions: Session[]): BallSlice[] {
  const groups = new Map<string, Frame[]>()
  for (const f of allFrames(sessions)) {
    if (!f.ballId) continue
    groups.set(f.ballId, [...(groups.get(f.ballId) ?? []), f])
  }
  return [...groups.entries()]
    .map(([ballId, frames]) => ({ ballId, shots: shotStats(frames) }))
    .sort((a, b) => b.shots.strikeChances - a.shots.strikeChances)
}

export type NightSummary = {
  session: Session
  scores: (number | null)[]   // one per game, null while in progress
  series: number | null       // total of completed games (any count)
  shots: ShotStats
}

// One row per session for the league night overview, newest first.
export function nights(sessions: Session[]): NightSummary[] {
  return [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => {
      const scores = session.games.map(gameScore)
      const done = scores.filter((x): x is number => x !== null)
      return {
        session,
        scores,
        series: done.length ? done.reduce((a, b) => a + b, 0) : null,
        shots: shotStats(session.games.flatMap((g) => g.frames)),
      }
    })
}
