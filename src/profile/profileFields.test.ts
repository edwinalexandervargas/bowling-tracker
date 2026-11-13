import { describe, it, expect } from 'vitest'
import { parseBallWeight, parseUsbcNumber } from './profileFields'

describe('parseBallWeight', () => {
  it('accepts whole pounds 6-16', () => {
    expect(parseBallWeight('15')).toBe(15)
    expect(parseBallWeight(' 6 ')).toBe(6)
    expect(parseBallWeight('16')).toBe(16)
  })
  it('rejects out of range, decimals, blanks and junk', () => {
    expect(parseBallWeight('5')).toBeNull()
    expect(parseBallWeight('17')).toBeNull()
    expect(parseBallWeight('14.5')).toBeNull()
    expect(parseBallWeight('')).toBeNull()
    expect(parseBallWeight('15lb')).toBeNull()
  })
})

describe('parseUsbcNumber', () => {
  it('treats blank as not set', () => {
    expect(parseUsbcNumber('')).toBeUndefined()
    expect(parseUsbcNumber('   ')).toBeUndefined()
  })
  it('accepts digits with optional dashes, trimmed', () => {
    expect(parseUsbcNumber(' 1234-56789 ')).toBe('1234-56789')
    expect(parseUsbcNumber('123456789')).toBe('123456789')
  })
  it('rejects letters, stray dashes and very long input', () => {
    expect(parseUsbcNumber('12ab')).toBeNull()
    expect(parseUsbcNumber('-1234')).toBeNull()
    expect(parseUsbcNumber('1234-')).toBeNull()
    expect(parseUsbcNumber('1234--5678')).toBeNull()
    expect(parseUsbcNumber('1'.repeat(21))).toBeNull()
  })
})
