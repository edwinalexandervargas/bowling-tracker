import type { Frame, Pattern, SeasonClose, Session } from '../types'
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

export type LeagueSlice = Summary & { key: string; label: string }

// One slice per league (type 'league' only), keyed by eventName. Names are
// trimmed and matched case-insensitively, so "Brunswick" and "brunswick " merge;
// the label is the first spelling seen. Sorted by games, most first.
// Shared key so "Brunswick" and " brunswick " are the same league everywhere.
export const leagueKey = (eventName: string) => eventName.trim().toLowerCase()

export function byLeague(sessions: Session[]): LeagueSlice[] {
  const groups = new Map<string, { label: string; sessions: Session[] }>()
  for (const s of sessions) {
    if (s.type !== 'league') continue
    const label = s.eventName.trim()
    const key = leagueKey(label)
    const group = groups.get(key) ?? { label, sessions: [] }
    group.sessions.push(s)
    groups.set(key, group)
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, label: g.label, ...summarize(g.sessions) }))
    .sort((a, b) => b.score.games - a.score.games || a.label.localeCompare(b.label))
}

// Sport shot = the session's pattern exists and is kind 'sport'. Missing or
// deleted patterns count as house shot, same as byPattern's bucket.
export function isSportShot(session: Session, patterns: Pattern[]): boolean {
  return patterns.find((p) => p.id === session.patternId)?.kind === 'sport'
}

// The overview's default view: house-shot sessions only, so sport averages
// (e.g. a rotating-pattern league) don't drag the main number around.
export const houseShotSessions = (sessions: Session[], patterns: Pattern[]): Session[] =>
  sessions.filter((s) => !isSportShot(s, patterns))

export type Season = {
  id: string                 // close id, or 'current'
  label: string              // "Current season", "2026", "2025–2026"
  closedAt: string | null    // null for the open season
  sessions: Session[]        // oldest first
}

// Splits one league's sessions into seasons using its close timestamps.
// Newest first; the open season is always included (it may be empty).
export function leagueSeasons(sessions: Session[], closes: SeasonClose[], key: string): Season[] {
  const mine = sessions
    .filter((s) => s.type === 'league' && leagueKey(s.eventName) === key)
    .sort((a, b) => a.date.localeCompare(b.date))
  const ends = closes
    .filter((c) => c.leagueKey === key)
    .sort((a, b) => a.closedAt.localeCompare(b.closedAt))

  const seasons: Season[] = []
  let start = ''
  for (const c of ends) {
    const inSeason = mine.filter((s) => s.date > start && s.date <= c.closedAt)
    seasons.push({ id: c.id, label: yearLabel(inSeason, c.closedAt), closedAt: c.closedAt, sessions: inSeason })
    start = c.closedAt
  }
  seasons.push({ id: 'current', label: 'Current season', closedAt: null, sessions: mine.filter((s) => s.date > start) })
  return seasons.reverse()
}

// "2026" or "2025–2026" from the season's first and last night.
function yearLabel(sessions: Session[], fallback: string): string {
  const first = (sessions[0]?.date ?? fallback).slice(0, 4)
  const last = (sessions.at(-1)?.date ?? fallback).slice(0, 4)
  return first === last ? first : `${first}–${last}`
}
