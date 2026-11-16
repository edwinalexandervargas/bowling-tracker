import { describe, it, expect } from 'vitest'
import { trackChanges, adoptUntracked, pendingCount, metaKey, type MetaMap } from './tracker'
import { emptyData, type LocalData } from './tables'

const T1 = '2026-11-16T20:00:00.000Z'
const T2 = '2026-11-16T20:05:00.000Z'
const with_ = (patch: Partial<LocalData>): LocalData => ({ ...emptyData(), ...patch })

describe('trackChanges', () => {
  it('a new record is marked as waiting to upload', () => {
    const next = with_({ balls: [{ id: 'b1' }] })
    expect(trackChanges({}, emptyData(), next, T1)).toEqual({ 'balls:b1': { updatedAt: T1, dirty: true } })
  })

  it('a record replaced by a new object counts as edited; an untouched one does not', () => {
    const kept = { id: 'n1' }
    const prev = with_({ sessions: [kept, { id: 'n2' }] })
    const next = with_({ sessions: [kept, { id: 'n2', eventName: 'edited' }] })
    const meta: MetaMap = { 'sessions:n1': { updatedAt: T1, dirty: false }, 'sessions:n2': { updatedAt: T1, dirty: false } }
    expect(trackChanges(meta, prev, next, T2)).toEqual({
      'sessions:n1': { updatedAt: T1, dirty: false },
      'sessions:n2': { updatedAt: T2, dirty: true },
    })
  })

  it('a removed record leaves a delete marker', () => {
    const prev = with_({ balls: [{ id: 'b1' }] })
    const meta: MetaMap = { 'balls:b1': { updatedAt: T1, dirty: false } }
    expect(trackChanges(meta, prev, emptyData(), T2)).toEqual({ 'balls:b1': { updatedAt: T2, dirty: true, deleted: true } })
  })

  it('returns the same object when nothing changed, so nothing re-renders or re-saves', () => {
    const data = with_({ balls: [{ id: 'b1' }] })
    const meta: MetaMap = { 'balls:b1': { updatedAt: T1, dirty: false } }
    expect(trackChanges(meta, data, data, T2)).toBe(meta)
  })
})

describe('adoptUntracked', () => {
  it('marks records that existed before sync was switched on as waiting to upload', () => {
    const data = with_({ sessions: [{ id: 'old-night' }], balls: [{ id: 'b1' }] })
    const meta: MetaMap = { 'balls:b1': { updatedAt: T1, dirty: false } }
    expect(adoptUntracked(meta, data, T2)).toEqual({
      'balls:b1': { updatedAt: T1, dirty: false },
      'sessions:old-night': { updatedAt: T2, dirty: true },
    })
  })
})

describe('pendingCount', () => {
  it('counts records waiting to upload, deletes included', () => {
    const meta: MetaMap = {
      [metaKey('balls', 'a')]: { updatedAt: T1, dirty: true },
      [metaKey('balls', 'b')]: { updatedAt: T1, dirty: false },
      [metaKey('balls', 'c')]: { updatedAt: T1, dirty: true, deleted: true },
    }
    expect(pendingCount(meta)).toBe(2)
  })
})
