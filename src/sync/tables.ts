import type { Ball, BallSpec, BowlerProfile, Pattern, SeasonClose, Session } from '../types'

// The tables in supabase/schema.sql. Uploads go in this order.
export const TABLES = ['profiles', 'ball_specs', 'balls', 'patterns', 'sessions', 'season_closes'] as const
export type Table = (typeof TABLES)[number]

// To the sync layer every record is just "an object with an id".
export type LocalRecord = { id: string } & Record<string, unknown>
export type LocalData = Record<Table, LocalRecord[]>

export const emptyData = (): LocalData => ({
  profiles: [], ball_specs: [], balls: [], patterns: [], sessions: [], season_closes: [],
})

// The part of the app's store that syncs. activeEntry is left out on purpose:
// which frame you are entering is this device's business only.
export type Collections = {
  profile: BowlerProfile | null
  ballSpecs: BallSpec[]
  balls: Ball[]
  patterns: Pattern[]
  sessions: Session[]
  seasonCloses: SeasonClose[]
}

// The profile is one object with no id, so it syncs as a single record with a fixed id.
export const PROFILE_ID = 'profile'

// Change tracking compares records by identity, so the same profile object
// must always turn into the same record object.
const profileRecords = new WeakMap<BowlerProfile, LocalRecord>()
function profileRecord(profile: BowlerProfile): LocalRecord {
  let record = profileRecords.get(profile)
  if (!record) {
    record = { ...profile, id: PROFILE_ID }
    profileRecords.set(profile, record)
  }
  return record
}

export function toLocalData(c: Collections): LocalData {
  return {
    profiles: c.profile ? [profileRecord(c.profile)] : [],
    ball_specs: c.ballSpecs as unknown as LocalRecord[],
    balls: c.balls as unknown as LocalRecord[],
    patterns: c.patterns as unknown as LocalRecord[],
    sessions: c.sessions as unknown as LocalRecord[],
    season_closes: c.seasonCloses as unknown as LocalRecord[],
  }
}

// The store field each table lives in, and how to turn its records back.
export function toCollectionPatch(table: Table, records: LocalRecord[]): Partial<Collections> {
  switch (table) {
    case 'profiles': {
      const record = records[0]
      if (!record) return { profile: null }
      const profile = { ...record } as Record<string, unknown>
      delete profile.id
      return { profile: profile as BowlerProfile }
    }
    case 'ball_specs': return { ballSpecs: records as unknown as BallSpec[] }
    case 'balls': return { balls: records as unknown as Ball[] }
    case 'patterns': return { patterns: records as unknown as Pattern[] }
    case 'sessions': return { sessions: records as unknown as Session[] }
    case 'season_closes': return { seasonCloses: records as unknown as SeasonClose[] }
  }
}
