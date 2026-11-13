import { describe, it, expect } from 'vitest'
import type { Frame, Game, Pattern, Session } from '../types'
import { summarize, byPattern, byBall, byLeague, isSportShot, houseShotSessions, leagueSeasons, nights, HOUSE_SHOT } from './slices'

const FULL = 1023
const s = (pinsBefore: number, pinsAfter: number) => ({ pinsBefore, pinsAfter })
const strike = (ballId?: string): Frame => ({ shots: [s(FULL, 0)], ballId })
const open9 = (ballId?: string): Frame => ({ shots: [s(FULL, 512), s(512, 512)], ballId })

const perfect = (ballId?: string): Game => ({
  id: crypto.randomUUID(),
  frames: [...Array.from({ length: 9 }, () => strike(ballId)), { shots: [s(FULL, 0), s(FULL, 0), s(FULL, 0)], ballId }],
})
const ninety = (ballId?: string): Game => ({ id: crypto.randomUUID(), frames: Array.from({ length: 10 }, () => open9(ballId)) })

const session = (date: string, games: Game[], patternId?: string): Session => ({
  id: crypto.randomUUID(), date, type: 'league', eventName: 'Thu', patternId, games,
})
const patterns: Pattern[] = [{ id: 'shark', kind: 'sport', name: 'Shark', length: 44 }]

describe('summarize', () => {
  it('combines score, shot stats and high series', () => {
    const sum = summarize([
      session('2026-11-05', [perfect(), ninety(), ninety()]),   // 480
      session('2026-11-12', [ninety(), ninety()]),              // only 2 games: no series
    ])
    expect(sum.sessions).toBe(2)
    expect(sum.score).toMatchObject({ games: 5, average: 132, highGame: 300 })
    expect(sum.highSeries).toBe(480)
    expect(sum.shots.strikes).toBe(12)
  })
})

describe('byPattern', () => {
  it('buckets missing or deleted patterns as House shot', () => {
    const slices = byPattern([
      session('2026-11-05', [ninety()]),
      session('2026-11-06', [ninety()], 'deleted-id'),
      session('2026-11-12', [perfect()], 'shark'),
    ], patterns)
    expect(slices.map((x) => [x.key, x.label, x.score.games])).toEqual([
      [HOUSE_SHOT, 'House shot', 2],
      ['shark', 'Shark', 1],
    ])
  })
})

describe('byBall', () => {
  it('groups frames by ball and skips frames with no ball', () => {
    const mixed: Game = { id: 'g', frames: [strike('a'), strike('a'), open9('b'), open9()] }
    const slices = byBall([session('2026-11-12', [mixed])])
    expect(slices).toEqual([
      expect.objectContaining({ ballId: 'a', shots: expect.objectContaining({ strikes: 2, strikeChances: 2 }) }),
      expect.objectContaining({ ballId: 'b', shots: expect.objectContaining({ strikes: 0, openFrames: 1 }) }),
    ])
  })
})

describe('nights', () => {
  it('newest first, per-game scores with null for unfinished, series of finished games', () => {
    const inProgress: Game = { id: 'g', frames: [strike()] }
    const rows = nights([
      session('2026-11-05T19:00:00Z', [ninety()]),
      session('2026-11-12T19:00:00Z', [perfect(), inProgress]),
    ])
    expect(rows.map((r) => r.session.date)).toEqual(['2026-11-12T19:00:00Z', '2026-11-05T19:00:00Z'])
    expect(rows[0].scores).toEqual([300, null])
    expect(rows[0].series).toBe(300)
    expect(rows[1].series).toBe(90)
  })
})

describe('byLeague', () => {
  const league = (eventName: string, games: Game[]): Session => ({
    id: crypto.randomUUID(), date: '2026-11-05', type: 'league', eventName, games,
  })

  it('gives each league its own average', () => {
    const slices = byLeague([
      league('Brunswick', [perfect(), ninety()]),
      league('Mega Vegas', [ninety()]),
      league('Brunswick', [ninety()]),
    ])
    expect(slices.map((l) => [l.label, l.score.games, l.score.average])).toEqual([
      ['Brunswick', 3, 160],
      ['Mega Vegas', 1, 90],
    ])
  })

  it('merges names that differ only by case or spaces', () => {
    const slices = byLeague([league('Brunswick', [ninety()]), league(' brunswick ', [ninety()])])
    expect(slices).toHaveLength(1)
    expect(slices[0]).toMatchObject({ label: 'Brunswick', sessions: 2 })
  })

  it('leaves out tournaments and practice', () => {
    const slices = byLeague([
      { id: 't', date: '2026-11-05', type: 'tournament', eventName: 'City', games: [ninety()] },
      { id: 'p', date: '2026-11-05', type: 'practice', games: [ninety()] },
    ])
    expect(slices).toEqual([])
  })
})

describe('house vs sport shot', () => {
  const pats: Pattern[] = [
    { id: 'shark', kind: 'sport', name: 'Shark', length: 44 },
    { id: 'pinz', kind: 'house', name: 'Pinz house' },
  ]
  const sport = session('2026-11-05', [ninety()], 'shark')
  const house = session('2026-11-05', [ninety()], 'pinz')
  const none = session('2026-11-05', [ninety()])
  const deleted = session('2026-11-05', [ninety()], 'gone')

  it('only a known sport pattern is sport shot', () => {
    expect([sport, house, none, deleted].map((s) => isSportShot(s, pats))).toEqual([true, false, false, false])
  })

  it('houseShotSessions drops sport sessions', () => {
    expect(houseShotSessions([sport, house, none], pats)).toEqual([house, none])
  })
})

describe('leagueSeasons', () => {
  const night = (date: string, eventName = 'Brunswick'): Session => ({
    id: date + eventName, date, type: 'league', eventName, games: [ninety()],
  })
  const close = (closedAt: string) => ({ id: closedAt, leagueKey: 'brunswick', closedAt })

  it('with no closes, everything is the current season', () => {
    const seasons = leagueSeasons([night('2026-01-01T19:00:00Z')], [], 'brunswick')
    expect(seasons.map((s) => [s.label, s.sessions.length])).toEqual([['Current season', 1]])
  })

  it('splits at each close, newest first, labelled by year span', () => {
    const sessions = [
      night('2025-09-04T19:00:00Z'), night('2026-04-30T19:00:00Z'), // season 1
      night('2026-09-03T19:00:00Z'),                                // season 2 (open)
      night('2026-09-03T19:00:00Z', 'Mega Vegas'),                  // other league
    ]
    const seasons = leagueSeasons(sessions, [close('2026-05-01T00:00:00Z')], 'brunswick')
    expect(seasons.map((s) => [s.label, s.sessions.length])).toEqual([
      ['Current season', 1],
      ['2025–2026', 2],
    ])
  })

  it('a night on the close timestamp belongs to the closed season', () => {
    const t = '2026-05-01T00:00:00Z'
    const seasons = leagueSeasons([night(t)], [close(t)], 'brunswick')
    expect(seasons[1].sessions).toHaveLength(1)
    expect(seasons[0].sessions).toHaveLength(0)
  })
})
