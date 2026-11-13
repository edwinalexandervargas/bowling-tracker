import { describe, it, expect } from 'vitest'
import { isSplit, isSinglePin, leaveName } from './leaves'

// Build a mask from pin numbers
const m = (...pins: number[]) => pins.reduce((mask, p) => mask | (1 << (p - 1)), 0)

describe('isSplit', () => {
  it.each([
    ['7-10', m(7, 10)], ['4-6', m(4, 6)], ['7-9', m(7, 9)], ['8-10', m(8, 10)],
    ['5-7', m(5, 7)], ['5-10', m(5, 10)], ['4-7-10', m(4, 7, 10)],
    ['3-10 baby split', m(3, 10)], ['2-7 baby split', m(2, 7)], ['4-9', m(4, 9)],
    ['6-7-10 (big four minus one)', m(6, 7, 10)], ['4-6-7-10 big four', m(4, 6, 7, 10)],
  ])('%s is a split', (_, leave) => {
    expect(isSplit(leave)).toBe(true)
  })

  it.each([
    ['strike', 0], ['single 10', m(10)], ['2-8 sleeper', m(2, 8)], ['3-9 sleeper', m(3, 9)],
    ['4-5', m(4, 5)], ['5-8', m(5, 8)], ['3-6-10', m(3, 6, 10)], ['2-4-5-8 bucket', m(2, 4, 5, 8)],
    ['1-7-10 headpin up', m(1, 7, 10)],
  ])('%s is not a split', (_, leave) => {
    expect(isSplit(leave)).toBe(false)
  })
})

describe('isSinglePin', () => {
  it('true only for exactly one pin', () => {
    expect(isSinglePin(m(10))).toBe(true)
    expect(isSinglePin(m(1))).toBe(true)
    expect(isSinglePin(0)).toBe(false)
    expect(isSinglePin(m(7, 10))).toBe(false)
  })
})

describe('leaveName', () => {
  it('joins standing pins in order', () => {
    expect(leaveName(m(10, 7))).toBe('7-10')
    expect(leaveName(m(10))).toBe('10')
    expect(leaveName(0)).toBe('')
  })
})
