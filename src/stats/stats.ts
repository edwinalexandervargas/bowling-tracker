import type { Frame, Game } from '../types'
import { frameFirstBalls } from './firstBalls'
import { isSinglePin, isSplit } from '../pins/leaves'
import { frameScores } from '../scoring/scorer'
import { gameToRolls } from '../game/gameToRolls'

// Percent rounded to one decimal, or null when there were no chances (shows as "—").
export function pct(made: number, chances: number): number | null {
  return chances === 0 ? null : Math.round((made / chances) * 1000) / 10
}

// "62.5%", or null when there were no chances
export function fmtPct(p: number | null): string | null {
  return p === null ? null : `${p}%`
}

export type ShotStats = {
  strikes: number
  strikeChances: number      // every fresh rack, incl. 10th-frame fill balls
  spares: number
  spareChances: number       // leaves with a second ball thrown
  singlePinSpares: number
  singlePinChances: number
  splits: number             // splits left on a first ball
  splitsConverted: number
  openFrames: number
  frames: number             // frames whose strike/spare/open outcome is known
}

// Shot-level stats over any set of frames, so they can be sliced by ball as
// well as by game. Frames carry no index, but strike/spare/open only depend on
// a frame's own shots, which makes the 10th frame work the same way.
export function shotStats(frames: Frame[]): ShotStats {
  const s: ShotStats = {
    strikes: 0, strikeChances: 0, spares: 0, spareChances: 0,
    singlePinSpares: 0, singlePinChances: 0, splits: 0, splitsConverted: 0,
    openFrames: 0, frames: 0,
  }

  for (const frame of frames) {
    const balls = frameFirstBalls(frame, 0)
    for (const b of balls) {
      s.strikeChances++
      if (b.leave === 0) { s.strikes++; continue }
      if (isSplit(b.leave)) {
        s.splits++
        if (b.converted) s.splitsConverted++
      }
      if (b.converted === undefined) continue // second ball not thrown yet
      s.spareChances++
      if (b.converted) s.spares++
      if (isSinglePin(b.leave)) {
        s.singlePinChances++
        if (b.converted) s.singlePinSpares++
      }
    }

    // Frame outcome is decided by the frame's first rack.
    const first = balls[0]
    if (!first) continue
    if (first.leave === 0 || first.converted !== undefined) s.frames++
    if (first.converted === false) s.openFrames++
  }
  return s
}

// A game counts for scores only once all 10 frames are scorable.
export function gameScore(game: Game): number | null {
  const totals = frameScores(gameToRolls(game))
  return totals.length === 10 ? totals[9] : null
}

export type ScoreStats = {
  games: number            // completed games
  totalPins: number
  average: number | null   // whole pins, rounded down like league averages
  highGame: number | null
}

export function scoreStats(games: Game[]): ScoreStats {
  const scores = games.map(gameScore).filter((x): x is number => x !== null)
  const totalPins = scores.reduce((a, b) => a + b, 0)
  return {
    games: scores.length,
    totalPins,
    average: scores.length ? Math.floor(totalPins / scores.length) : null,
    highGame: scores.length ? Math.max(...scores) : null,
  }
}

// Series = total of a session's completed games. Only sessions with at least
// 3 completed games count, so a short practice can't be a "high series".
export function seriesScore(games: Game[]): number | null {
  const scores = games.map(gameScore).filter((x): x is number => x !== null)
  return scores.length >= 3 ? scores.reduce((a, b) => a + b, 0) : null
}

export type LeaveStat = {
  leave: number
  attempts: number      // times left (with a second ball thrown)
  converted: number
}

// Frequency and conversion per leave, most common first.
export function leaveStats(frames: Frame[]): LeaveStat[] {
  const byLeave = new Map<number, LeaveStat>()
  for (const frame of frames) {
    for (const b of frameFirstBalls(frame, 0)) {
      if (b.leave === 0 || b.converted === undefined) continue
      const stat = byLeave.get(b.leave) ?? { leave: b.leave, attempts: 0, converted: 0 }
      stat.attempts++
      if (b.converted) stat.converted++
      byLeave.set(b.leave, stat)
    }
  }
  return [...byLeave.values()].sort((a, b) => b.attempts - a.attempts || a.leave - b.leave)
}
