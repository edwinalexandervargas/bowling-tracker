import { describe, it, expect } from 'vitest'
import type { Frame, Game, Pattern, Session } from '../types'
import { summarize, byPattern, byBall, nights, HOUSE_SHOT } from './slices'

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
