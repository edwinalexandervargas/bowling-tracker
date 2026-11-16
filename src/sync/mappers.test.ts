import { describe, it, expect } from 'vitest'
import type { Ball, BallSpec, Pattern, SeasonClose, Session } from '../types'
import { toRow, fromRow } from './mappers'
import { PROFILE_ID, type LocalRecord, type Table } from './tables'

const STAMP = '2026-11-16T20:00:00.000Z'
// What the server sends back: its own time format, plus the bookkeeping columns.
const fromServer = (row: Record<string, unknown>) => ({ ...row, user_id: 'u1', synced_at: '2026-11-16T20:00:01.123456+00:00' })
const roundTrip = (table: Table, record: LocalRecord) =>
  fromRow(table, fromServer(toRow(table, record, STAMP)) as never)

describe('toRow', () => {
  it('writes snake_case columns, the id and the edit time', () => {
    const night: Session = { id: 'n1', date: '2026-11-16T03:00:00.000Z', type: 'league', eventName: 'Brunswick', patternId: 'p1', games: [] }
    expect(toRow('sessions', night as never, STAMP)).toEqual({
      id: 'n1', date: '2026-11-16T03:00:00.000Z', type: 'league', event_name: 'Brunswick', pattern_id: 'p1', games: [],
      updated_at: STAMP, deleted_at: null,
    })
  })

  it('sends null for a missing optional field, so clearing it on one device clears it everywhere', () => {
    const practice: Session = { id: 'n2', date: '2026-11-16T03:00:00.000Z', type: 'practice', games: [] }
    expect(toRow('sessions', practice as never, STAMP)).toMatchObject({ event_name: null, pattern_id: null })
  })
})

describe('round trip: device to server and back', () => {
  it('a night keeps its games exactly', () => {
    const night: Session = {
      id: 'n1', date: '2026-11-16T03:00:00.000Z', type: 'league', eventName: 'Brunswick',
      games: [{ id: 'g1', frames: [{ shots: [{ pinsBefore: 1023, pinsAfter: 0 }] }] }],
    }
    expect(roundTrip('sessions', night as never)).toEqual(night)
  })

  it('optional fields that were missing stay missing, not null', () => {
    const spec: BallSpec = { id: 's1', name: 'Phase II', brand: 'Storm', rg: 2.48 }
    const back = roundTrip('ball_specs', spec as never)
    expect(back).toEqual(spec)
    expect('coverstock' in back).toBe(false)
  })

  it('a ball keeps its layout object', () => {
    const ball: Ball = { id: 'b1', specId: 's1', weight: 15, surface: '2000 Abralon', layout: { system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 } }
    expect(roundTrip('balls', ball as never)).toEqual(ball)
  })

  it('a pattern, a season close and the profile survive', () => {
    const pattern: Pattern = { id: 'p1', kind: 'sport', name: 'Shark', length: 44, ratio: 3.2 }
    const close: SeasonClose = { id: 'c1', leagueKey: 'brunswick', closedAt: '2026-11-16T05:00:00.000Z' }
    const profile = { id: PROFILE_ID, papOver: 4.5, papUp: 0.625, hand: 'left', style: 'two-handed' }
    expect(roundTrip('patterns', pattern as never)).toEqual(pattern)
    expect(roundTrip('season_closes', close as never)).toEqual(close)
    expect(roundTrip('profiles', profile)).toEqual(profile)
  })

  it('times come back in the format the app writes, whatever format the server used', () => {
    const row = { id: 'n1', date: '2026-11-16T03:00:00+00:00', type: 'practice', event_name: null, pattern_id: null, games: [], updated_at: STAMP, deleted_at: null }
    expect(fromRow('sessions', row).date).toBe('2026-11-16T03:00:00.000Z')
  })
})
