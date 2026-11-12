import { describe, it, expect } from 'vitest'
import { validateSessionDraft } from './validateSession'

const ids = ['p1']
const draft = (o: Partial<Parameters<typeof validateSessionDraft>[0]> = {}) => ({
  type: 'league' as const, eventName: 'Thursday Mixed', patternId: '', ...o,
})

describe('validateSessionDraft', () => {
  it('league with blank pattern = house shot (no patternId)', () => {
    expect(validateSessionDraft(draft(), ids)).toEqual({
      ok: true, value: { type: 'league', eventName: 'Thursday Mixed' },
    })
  })

  it('keeps a known patternId and trims the name', () => {
    expect(validateSessionDraft(draft({ eventName: '  City  ', type: 'tournament', patternId: 'p1' }), ids))
      .toEqual({ ok: true, value: { type: 'tournament', eventName: 'City', patternId: 'p1' } })
  })

  it('requires event name for league and tournament', () => {
    for (const type of ['league', 'tournament'] as const) {
      const r = validateSessionDraft(draft({ type, eventName: '   ' }), ids)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.errors.eventName).toBeDefined()
    }
  })

  it('practice needs nothing; blank name is dropped', () => {
    expect(validateSessionDraft(draft({ type: 'practice', eventName: '' }), ids))
      .toEqual({ ok: true, value: { type: 'practice' } })
  })

  it('rejects an unknown patternId', () => {
    const r = validateSessionDraft(draft({ patternId: 'gone' }), ids)
    expect(r).toEqual({ ok: false, errors: { patternId: 'That pattern no longer exists.' } })
  })

  it('reports all errors at once', () => {
    const r = validateSessionDraft(draft({ eventName: '', patternId: 'gone' }), ids)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['eventName', 'patternId'])
  })
})
