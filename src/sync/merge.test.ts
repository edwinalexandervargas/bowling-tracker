import { describe, it, expect } from 'vitest'
import { mergePulled, applyToList } from './merge'
import type { MetaMap } from './tracker'
import type { RemoteRow } from './mappers'

const at = (minutes: number) => new Date(Date.UTC(2026, 10, 16, 20, minutes)).toISOString()
const pattern = (id: string, name: string, updatedAt: string, deletedAt: string | null = null): RemoteRow => ({
  id, name, kind: 'house', length: null, ratio: null, volume: null, notes: null,
  updated_at: updatedAt, deleted_at: deletedAt, synced_at: updatedAt,
})

describe('mergePulled', () => {
  it('takes a record this device has never seen', () => {
    const result = mergePulled('patterns', [pattern('p1', 'Shark', at(0))], {})
    expect(result.upserts).toEqual([{ id: 'p1', name: 'Shark', kind: 'house' }])
    expect(result.meta).toEqual({ 'patterns:p1': { updatedAt: at(0), dirty: false } })
  })

  it('newest edit wins: a newer server copy replaces a local edit and clears its waiting flag', () => {
    const meta: MetaMap = { 'patterns:p1': { updatedAt: at(5), dirty: true } }
    const result = mergePulled('patterns', [pattern('p1', 'From laptop', at(9))], meta)
    expect(result.upserts).toHaveLength(1)
    expect(result.meta['patterns:p1']).toEqual({ updatedAt: at(9), dirty: false })
  })

  it('newest edit wins: an older server copy is ignored and the local edit stays waiting', () => {
    const meta: MetaMap = { 'patterns:p1': { updatedAt: at(9), dirty: true } }
    const result = mergePulled('patterns', [pattern('p1', 'Stale', at(5))], meta)
    expect(result.upserts).toEqual([])
    expect(result.meta).toBe(meta)
  })

  it('ignores our own upload coming back (same edit time)', () => {
    const meta: MetaMap = { 'patterns:p1': { updatedAt: at(5), dirty: false } }
    expect(mergePulled('patterns', [pattern('p1', 'Same', at(5))], meta).upserts).toEqual([])
  })

  it('compares times as moments, not as text', () => {
    // The server writes +00:00 and microseconds; the device writes Z and milliseconds.
    const meta: MetaMap = { 'patterns:p1': { updatedAt: '2026-11-16T20:05:00.000Z', dirty: false } }
    const sameMoment = pattern('p1', 'Same', '2026-11-16T20:05:00+00:00')
    expect(mergePulled('patterns', [sameMoment], meta).upserts).toEqual([])
  })

  it('a newer server delete removes the record here and forgets its bookkeeping', () => {
    const meta: MetaMap = { 'patterns:p1': { updatedAt: at(1), dirty: false } }
    const result = mergePulled('patterns', [pattern('p1', 'Gone', at(7), at(7))], meta)
    expect(result.deletes).toEqual(['p1'])
    expect(result.meta).toEqual({})
  })

  it('a local edit made after a server delete wins over the delete', () => {
    const meta: MetaMap = { 'patterns:p1': { updatedAt: at(9), dirty: true } }
    const result = mergePulled('patterns', [pattern('p1', 'Gone', at(7), at(7))], meta)
    expect(result.deletes).toEqual([])
  })
})

describe('applyToList', () => {
  it('replaces by id, adds new ones at the end, and removes deletes', () => {
    const list = [{ id: 'a', v: 1 }, { id: 'b', v: 1 }, { id: 'c', v: 1 }]
    expect(applyToList(list, [{ id: 'b', v: 2 }, { id: 'd', v: 1 }], ['c'])).toEqual([
      { id: 'a', v: 1 }, { id: 'b', v: 2 }, { id: 'd', v: 1 },
    ])
  })

  it('returns the same list when there is nothing to apply', () => {
    const list = [{ id: 'a' }]
    expect(applyToList(list, [], [])).toBe(list)
  })
})
