import { describe, it, expect } from 'vitest'
import type { Frame } from '../types'
import { frameMark } from './frameMark'
import { FULL, TEN_PIN, s, frames } from './fixtures'

describe('frameMark', () => {
  it('frames 1-9: strike, spare, open', () => {
    const [strike, spare, open] = frames('X / -')
    expect(frameMark(strike)).toBe('strike')
    expect(frameMark(spare)).toBe('spare')
    expect(frameMark(open)).toBe('open')
  })

  it('is pending with no shots, a missing frame, or only a first ball that left pins', () => {
    expect(frameMark({ shots: [] })).toBe('pending')
    expect(frameMark(undefined)).toBe('pending')
    expect(frameMark(frames('?')[0])).toBe('pending')
  })

  it('counts pins by what is left standing, not by a fixed leave', () => {
    const splitSpare: Frame = { shots: [s(FULL, 576), s(576, 0)] }       // 7-10 converted
    const splitOpen: Frame = { shots: [s(FULL, 576), s(576, 512)] }      // 7-10, picked one
    expect(frameMark(splitSpare)).toBe('spare')
    expect(frameMark(splitOpen)).toBe('open')
  })

  it('gutter then all ten on the second ball is a spare, not a strike', () => {
    const gutterSpare: Frame = { shots: [s(FULL, FULL), s(FULL, 0)] }
    expect(frameMark(gutterSpare)).toBe('spare')
  })

  describe('10th frame: only the first rack decides the mark', () => {
    it('strike on the first ball is a strike before any fill ball is thrown', () => {
      expect(frameMark({ shots: [s(FULL, 0)] })).toBe('strike')
    })

    it('strike stays a strike whatever the fill balls do', () => {
      const strikeThenOpen: Frame = { shots: [s(FULL, 0), s(FULL, TEN_PIN), s(TEN_PIN, TEN_PIN)] }
      const threeStrikes: Frame = { shots: [s(FULL, 0), s(FULL, 0), s(FULL, 0)] }
      expect(frameMark(strikeThenOpen)).toBe('strike')
      expect(frameMark(threeStrikes)).toBe('strike')
    })

    it('spare with the first two balls is a spare, before and after the fill ball', () => {
      const spareNoFill: Frame = { shots: [s(FULL, TEN_PIN), s(TEN_PIN, 0)] }
      const spareThenGutter: Frame = { shots: [s(FULL, TEN_PIN), s(TEN_PIN, 0), s(FULL, FULL)] }
      expect(frameMark(spareNoFill)).toBe('spare')
      expect(frameMark(spareThenGutter)).toBe('spare')
    })

    it('gutter then all ten in the 10th is a spare, with or without the fill ball', () => {
      const noFill: Frame = { shots: [s(FULL, FULL), s(FULL, 0)] }
      const withFill: Frame = { shots: [s(FULL, FULL), s(FULL, 0), s(FULL, TEN_PIN)] }
      expect(frameMark(noFill)).toBe('spare')
      expect(frameMark(withFill)).toBe('spare')
    })

    it('strike then a spare on the fill balls is still just a strike', () => {
      const strikeThenSpare: Frame = { shots: [s(FULL, 0), s(FULL, TEN_PIN), s(TEN_PIN, 0)] }
      expect(frameMark(strikeThenSpare)).toBe('strike')
    })

    it('open with the first two balls is open', () => {
      expect(frameMark({ shots: [s(FULL, TEN_PIN), s(TEN_PIN, TEN_PIN)] })).toBe('open')
    })
  })
})
