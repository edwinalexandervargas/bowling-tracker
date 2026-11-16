import { describe, it, expect } from 'vitest'
import { count } from './format'

describe('count', () => {
  it('uses the singular for exactly one', () => {
    expect(count(1, 'game')).toBe('1 game')
  })

  it('uses the plural for zero and for more than one', () => {
    expect(count(0, 'game')).toBe('0 games')
    expect(count(3, 'week')).toBe('3 weeks')
  })
})
