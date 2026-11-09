import { describe, it, expect } from 'vitest'
import { isPinStanding, pinsStanding, pinsKnockedDown } from './pins'

describe('isPinStanding', () => {
  it('says whether a pin is standing', () => {
    // 520 = 10-pin + 4-pin standing
    expect(isPinStanding(520, 10)).toBe(true)
    expect(isPinStanding(520, 4)).toBe(true)
    expect(isPinStanding(520, 7)).toBe(false)
  })
})

describe('pinsStanding', () => {
  it('lists the pins standing in a mask', () => {
    expect(pinsStanding(520)).toEqual([4, 10])
    expect(pinsStanding(0)).toEqual([])
    expect(pinsStanding(1023)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('pinsKnockedDown', () => {
  it('counts the pins that fell between two masks', () => {
    expect(pinsKnockedDown(1023, 576)).toBe(8) // 576 = 7-pin + 10-pin left
    expect(pinsKnockedDown(1023, 0)).toBe(10) // strike
    expect(pinsKnockedDown(576, 512)).toBe(1) // 7-pin falls, 10-pin stays
  })
})