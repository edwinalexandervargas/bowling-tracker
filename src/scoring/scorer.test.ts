import { describe, it, expect } from 'vitest'
import { isFrameComplete } from './frame'

describe('isFrameComplete', () => {
  // --- Frames 1-9 ---

  it('an empty frame is not complete', () => {
    expect(isFrameComplete([], 0)).toBe(false)
  })

  it('one non-strike shot does not complete frames 1-9', () => {
    const shots = [{ pinsBefore: 1023, pinsAfter: 576 }]
    expect(isFrameComplete(shots, 0)).toBe(false)
  })

  it('a strike completes frames 1-9', () => {
    const shots = [{ pinsBefore: 1023, pinsAfter: 0 }]
    expect(isFrameComplete(shots, 0)).toBe(true)
  })

  it('a spare completes frames 1-9', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 576 },
      { pinsBefore: 576, pinsAfter: 0 },
    ]
    expect(isFrameComplete(shots, 0)).toBe(true)
  })

  it('an open frame completes frames 1-9', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 576 },
      { pinsBefore: 576, pinsAfter: 512 },
    ]
    expect(isFrameComplete(shots, 0)).toBe(true)
  })

  // --- 10th frame ---

  it('a strike does not complete the 10th frame', () => {
    const shots = [{ pinsBefore: 1023, pinsAfter: 0 }]
    expect(isFrameComplete(shots, 9)).toBe(false)
  })

  it('a strike then a non-clearing shot does not complete the 10th', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 0 },
      { pinsBefore: 1023, pinsAfter: 64 },  // 7-pin left after bonus ball 1
    ]
    expect(isFrameComplete(shots, 9)).toBe(false)
  })

  it('an open frame completes the 10th', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 576 },
      { pinsBefore: 576, pinsAfter: 512 },
    ]
    expect(isFrameComplete(shots, 9)).toBe(true)
  })

  it('three strikes complete the 10th frame', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 0 },
      { pinsBefore: 1023, pinsAfter: 0 },
      { pinsBefore: 1023, pinsAfter: 0 },
    ]
    expect(isFrameComplete(shots, 9)).toBe(true)
  })

  it('a spare with a bonus shot completes the 10th', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 576 },
      { pinsBefore: 576, pinsAfter: 0 },
      { pinsBefore: 1023, pinsAfter: 512 },
    ]
    expect(isFrameComplete(shots, 9)).toBe(true)
  })

  it('a spare without a bonus shot does not complete the 10th', () => {
    const shots = [
      { pinsBefore: 1023, pinsAfter: 576 },
      { pinsBefore: 576, pinsAfter: 0 },
    ]
    expect(isFrameComplete(shots, 9)).toBe(false)
  })
})