import { describe, it, expect } from 'vitest'
import { parseInches, formatInches } from './inches'

describe('parseInches', () => {
  it('parses a mixed number', () => {
    expect(parseInches('4 1/2')).toBe(4.5)
  })

  it('parses a plain fraction', () => {
    expect(parseInches('5/8')).toBe(0.625)
  })

  it('parses a whole number', () => {
    expect(parseInches('4')).toBe(4)
  })

  it('parses sixteenths exactly', () => {
    expect(parseInches('3 7/16')).toBe(3.4375)
  })

  it('accepts a decimal on the 1/16 grid', () => {
    expect(parseInches('4.5')).toBe(4.5)
  })

  it('ignores extra spaces and a trailing inch mark', () => {
    expect(parseInches('  4  1/2" ')).toBe(4.5)
  })

  it('returns null for junk', () => {
    expect(parseInches('abc')).toBeNull()
    expect(parseInches('')).toBeNull()
  })

  it('returns null for a zero denominator', () => {
    expect(parseInches('4 1/0')).toBeNull()
  })

  it('returns null for values off the 1/16 grid', () => {
    expect(parseInches('1/3')).toBeNull()
    expect(parseInches('4.3')).toBeNull()
  })

  it('returns null for negative values', () => {
    expect(parseInches('-1')).toBeNull()
  })
})

describe('formatInches', () => {
  it('formats a mixed number', () => {
    expect(formatInches(4.5)).toBe('4 1/2')
  })

  it('formats a plain fraction', () => {
    expect(formatInches(0.625)).toBe('5/8')
  })

  it('formats a whole number', () => {
    expect(formatInches(4)).toBe('4')
  })

  it('formats zero', () => {
    expect(formatInches(0)).toBe('0')
  })

  it('reduces sixteenths to lowest terms', () => {
    expect(formatInches(3.25)).toBe('3 1/4')
    expect(formatInches(3.4375)).toBe('3 7/16')
  })

  it('round-trips with parseInches', () => {
    for (const s of ['4 1/2', '5/8', '3 7/16', '6', '1/16']) {
      expect(formatInches(parseInches(s)!)).toBe(s)
    }
  })
})
