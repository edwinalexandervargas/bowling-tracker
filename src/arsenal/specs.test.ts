import { describe, it, expect } from 'vitest'
import { findSpec } from './specs'
import type { BallSpec } from '../types'

const phase2: BallSpec = { id: 's1', brand: 'Storm', name: 'Phase II' }

describe('findSpec', () => {
  it('finds a spec by brand and name', () => {
    expect(findSpec([phase2], 'Storm', 'Phase II')).toBe(phase2)
  })

  it('ignores case and surrounding spaces', () => {
    expect(findSpec([phase2], ' storm ', 'phase ii')).toBe(phase2)
  })

  it('returns undefined when the brand differs', () => {
    expect(findSpec([phase2], 'Roto Grip', 'Phase II')).toBeUndefined()
  })

  it('returns undefined for an empty list', () => {
    expect(findSpec([], 'Storm', 'Phase II')).toBeUndefined()
  })
})
