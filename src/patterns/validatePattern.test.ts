import { describe, it, expect } from 'vitest'
import { validatePatternDraft, formatRatio, type PatternDraft } from './validatePattern'

const draft = (overrides: Partial<PatternDraft> = {}): PatternDraft => ({
  kind: 'sport',
  name: 'Kegel Middle Road',
  length: '41',
  ratio: '',
  volume: '',
  notes: '',
  ...overrides,
})

describe('validatePatternDraft', () => {
  it('accepts name and length only', () => {
    const result = validatePatternDraft(draft())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ kind: 'sport', name: 'Kegel Middle Road', length: 41 })
    }
  })

  it('parses all optional numbers and trims text', () => {
    const result = validatePatternDraft(
      draft({ name: '  House  ', ratio: '3.2', volume: '24.5', notes: ' heavy ' }),
    )
    expect(result).toEqual({
      ok: true,
      value: { kind: 'sport', name: 'House', length: 41, ratio: 3.2, volume: 24.5, notes: 'heavy' },
    })
  })

  it('accepts a ratio typed as "3.2:1"', () => {
    const result = validatePatternDraft(draft({ ratio: '3.2:1' }))
    expect(result.ok && result.value.ratio).toBe(3.2)
  })

  it('requires a name', () => {
    const result = validatePatternDraft(draft({ name: '   ' }))
    expect(result).toEqual({ ok: false, errors: { name: 'Name is required.' } })
  })

  it('rejects a missing or non-numeric length', () => {
    expect(validatePatternDraft(draft({ length: '' })).ok).toBe(false)
    expect(validatePatternDraft(draft({ length: 'long' })).ok).toBe(false)
  })

  it('rejects lengths outside 20-70 ft', () => {
    expect(validatePatternDraft(draft({ length: '10' })).ok).toBe(false)
    expect(validatePatternDraft(draft({ length: '80' })).ok).toBe(false)
  })

  it('rejects a ratio below 1', () => {
    const result = validatePatternDraft(draft({ ratio: '0.5' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.ratio).toBeDefined()
  })

  it('rejects a non-positive volume', () => {
    expect(validatePatternDraft(draft({ volume: '0' })).ok).toBe(false)
    expect(validatePatternDraft(draft({ volume: '-3' })).ok).toBe(false)
  })

  it('reports every bad field at once', () => {
    const result = validatePatternDraft(draft({ name: '', length: 'x', ratio: '0' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['length', 'name', 'ratio'])
  })
})

describe('validatePatternDraft: house shot', () => {
  it('accepts a house shot with just a name', () => {
    expect(validatePatternDraft(draft({ kind: 'house', name: 'Pinz house', length: '' }))).toEqual({
      ok: true,
      value: { kind: 'house', name: 'Pinz house' },
    })
  })

  it('keeps a house shot length if one is given', () => {
    const result = validatePatternDraft(draft({ kind: 'house', length: '40' }))
    expect(result.ok && result.value.length).toBe(40)
  })

  it('still validates a house shot length that is given', () => {
    expect(validatePatternDraft(draft({ kind: 'house', length: '5' })).ok).toBe(false)
  })

  it('still requires a name for a house shot', () => {
    expect(validatePatternDraft(draft({ kind: 'house', name: '' })).ok).toBe(false)
  })
})

describe('formatRatio', () => {
  it('adds :1', () => {
    expect(formatRatio(3.2)).toBe('3.2:1')
    expect(formatRatio(10)).toBe('10:1')
  })
})
