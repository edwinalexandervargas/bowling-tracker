import { describe, it, expect } from 'vitest'
import { formatLayout } from './formatLayout'

describe('formatLayout', () => {
  it('formats 2LS as three distances', () => {
    expect(formatLayout({ system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 })).toBe('5 × 4 × 3')
  })

  it('formats dual angle with degrees around the distance', () => {
    expect(
      formatLayout({ system: 'dual-angle', drillingAngle: 45, pinToPap: 4.5, valAngle: 30 }),
    ).toBe('45° × 4 1/2 × 30°')
  })
})
