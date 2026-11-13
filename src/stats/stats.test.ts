import { describe, it, expect } from 'vitest'
import type { Frame, Game } from '../types'
import { pct, shotStats, scoreStats, seriesScore, leaveStats, gameScore } from './stats'

const FULL = 1023
const m = (...pins: number[]) => pins.reduce((mask, p) => mask | (1 << (p - 1)), 0)
const s = (pinsBefore: number, pinsAfter: number) => ({ pinsBefore, pinsAfter })

const strike: Frame = { shots: [s(FULL, 0)] }
const spare = (leave: number): Frame => ({ shots: [s(FULL, leave), s(leave, 0)] })
const open = (leave: number, after = leave): Frame => ({ shots: [s(FULL, leave), s(leave, after)] })
const game = (frames: Frame[]): Game => ({ id: crypto.randomUUID(), frames })

const perfectTenth: Frame = { shots: [s(FULL, 0), s(FULL, 0), s(FULL, 0)] }
const perfect = game([...Array(9).fill(strike), perfectTenth])
// 9 frames of 9/ (10-pin spare) + 10th 9/ then 9: every frame 19 => 190
const allSpares = game([
  ...Array(9).fill(spare(m(10))),
  { shots: [s(FULL, m(10)), s(m(10), 0), s(FULL, m(10))] },
])
// 10 open frames of 9 (10 pin left and missed) => 90
const allOpens = game(Array(10).fill(open(m(10))))

describe('pct', () => {
  it('rounds to one decimal and returns null with no chances', () => {
    expect(pct(1, 3)).toBe(33.3)
    expect(pct(0, 0)).toBeNull()
  })
})

describe('shotStats', () => {
  it('perfect game: 12 of 12 strikes, no spares, no opens', () => {
    const st = shotStats(perfect.frames)
    expect(st).toMatchObject({ strikes: 12, strikeChances: 12, spareChances: 0, openFrames: 0, frames: 10 })
  })

  it('all spares: 11 strike chances (fill ball counts), 10 of 10 single-pin spares', () => {
    const st = shotStats(allSpares.frames)
    expect(st).toMatchObject({
      strikes: 0, strikeChances: 11, spares: 10, spareChances: 10,
      singlePinSpares: 10, singlePinChances: 10, openFrames: 0, frames: 10,
    })
  })

  it('all opens: 10 open frames, 0 of 10 spares', () => {
    expect(shotStats(allOpens.frames)).toMatchObject({ strikeChances: 10, spares: 0, spareChances: 10, openFrames: 10 })
  })

  it('counts splits and split conversions', () => {
    const st = shotStats([spare(m(7, 10)), open(m(4, 6), m(6)), spare(m(2, 8))])
    expect(st).toMatchObject({ splits: 2, splitsConverted: 1, spareChances: 3, spares: 2, singlePinChances: 0 })
  })

  it('10th: strike then a leave that is missed is not an open frame', () => {
    const tenth: Frame = { shots: [s(FULL, 0), s(FULL, m(10)), s(m(10), m(10))] }
    expect(shotStats([tenth])).toMatchObject({ strikes: 1, strikeChances: 2, spareChances: 1, spares: 0, openFrames: 0 })
  })

  it('pending second ball: strike chance counted, spare and frame outcome not yet', () => {
    const pending: Frame = { shots: [s(FULL, m(10))] }
    expect(shotStats([pending])).toMatchObject({ strikeChances: 1, spareChances: 0, frames: 0, openFrames: 0 })
  })
})

describe('gameScore / scoreStats', () => {
  it('scores complete games only', () => {
    expect(gameScore(perfect)).toBe(300)
    expect(gameScore(game([strike]))).toBeNull()
  })

  it('average floors, high game is the max, incomplete games ignored', () => {
    expect(scoreStats([perfect, allSpares, allOpens, game([strike])])).toEqual({
      games: 3, totalPins: 580, average: 193, highGame: 300,
    })
  })

  it('no complete games: nulls', () => {
    expect(scoreStats([])).toEqual({ games: 0, totalPins: 0, average: null, highGame: null })
  })
})

describe('seriesScore', () => {
  it('needs 3 completed games', () => {
    expect(seriesScore([perfect, allSpares])).toBeNull()
    expect(seriesScore([perfect, allSpares, allOpens])).toBe(580)
  })
})

describe('leaveStats', () => {
  it('groups by leave, most frequent first, ignores strikes and pending', () => {
    const frames = [spare(m(10)), open(m(10)), spare(m(7)), strike, { shots: [s(FULL, m(7))] }]
    expect(leaveStats(frames)).toEqual([
      { leave: m(10), attempts: 2, converted: 1 },
      { leave: m(7), attempts: 1, converted: 1 },
    ])
  })
})
