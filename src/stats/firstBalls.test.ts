import { describe, it, expect } from 'vitest'
import type { Frame, Game } from '../types'
import { firstBalls } from './firstBalls'

const FULL = 1023
const TEN_PIN = 1 << 9
const s = (pinsBefore: number, pinsAfter: number) => ({ pinsBefore, pinsAfter })
const strike: Frame = { shots: [s(FULL, 0)] }
const spare10: Frame = { shots: [s(FULL, TEN_PIN), s(TEN_PIN, 0)] }
const open10: Frame = { shots: [s(FULL, TEN_PIN), s(TEN_PIN, TEN_PIN)] }
const game = (frames: Frame[]): Game => ({ id: 'g', frames })

describe('firstBalls', () => {
  it('empty game has no first balls', () => {
    expect(firstBalls(game([]))).toEqual([])
  })

  it('strike: leave 0, no conversion', () => {
    expect(firstBalls(game([strike]))).toEqual([{ frameIndex: 0, leave: 0 }])
  })

  it('spare and open: leave recorded with conversion', () => {
    expect(firstBalls(game([spare10, open10]))).toEqual([
      { frameIndex: 0, leave: TEN_PIN, converted: true },
      { frameIndex: 1, leave: TEN_PIN, converted: false },
    ])
  })

  it('second ball not thrown yet: conversion undefined', () => {
    const pending: Frame = { shots: [s(FULL, TEN_PIN)] }
    expect(firstBalls(game([pending]))[0]).toEqual({ frameIndex: 0, leave: TEN_PIN })
  })

  it('perfect game has 12 strike chances, all strikes', () => {
    const tenth: Frame = { shots: [s(FULL, 0), s(FULL, 0), s(FULL, 0)] }
    const fb = firstBalls(game([...Array(9).fill(strike), tenth]))
    expect(fb).toHaveLength(12)
    expect(fb.every((b) => b.leave === 0)).toBe(true)
  })

  it('10th: spare then fill ball counts the fill as a fresh rack', () => {
    const tenth: Frame = { shots: [s(FULL, TEN_PIN), s(TEN_PIN, 0), s(FULL, 0)] }
    expect(firstBalls(game([tenth]))).toEqual([
      { frameIndex: 0, leave: TEN_PIN, converted: true },
      { frameIndex: 0, leave: 0 },
    ])
  })

  it('10th: strike then a leave, picked up on the third ball', () => {
    const tenth: Frame = { shots: [s(FULL, 0), s(FULL, TEN_PIN), s(TEN_PIN, 0)] }
    expect(firstBalls(game([tenth]))).toEqual([
      { frameIndex: 0, leave: 0 },
      { frameIndex: 0, leave: TEN_PIN, converted: true },
    ])
  })

  it('10th: open frame has one first ball and no fill', () => {
    expect(firstBalls(game([open10]))).toHaveLength(1)
  })
})
