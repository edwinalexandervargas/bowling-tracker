import type { LocalRecord, Table } from './tables'

// A row as it travels to and from the server.
export type RemoteRow = {
  id: string
  updated_at: string
  deleted_at: string | null
  synced_at?: string   // set by the server; never sent
} & Record<string, unknown>

// [field in the app, column in the database, is it a time?]
type Field = [local: string, column: string, kind?: 'time']

// One list per table. This is the whole mapping between the app's records and
// the columns in supabase/schema.sql: adding a field means adding a line here
// and a column there.
const FIELDS: Record<Table, Field[]> = {
  profiles: [
    ['papOver', 'pap_over'], ['papUp', 'pap_up'], ['usbcNumber', 'usbc_number'],
    ['ballWeight', 'ball_weight'], ['hand', 'hand'], ['style', 'style'],
  ],
  ball_specs: [
    ['name', 'name'], ['brand', 'brand'], ['rg', 'rg'], ['differential', 'differential'],
    ['massBiasDiff', 'mass_bias_diff'], ['coverstock', 'coverstock'], ['core', 'core'],
  ],
  balls: [['specId', 'spec_id'], ['nickname', 'nickname'], ['weight', 'weight'], ['layout', 'layout'], ['surface', 'surface']],
  patterns: [['name', 'name'], ['kind', 'kind'], ['length', 'length'], ['ratio', 'ratio'], ['volume', 'volume'], ['notes', 'notes']],
  sessions: [['date', 'date', 'time'], ['type', 'type'], ['eventName', 'event_name'], ['patternId', 'pattern_id'], ['games', 'games']],
  season_closes: [['leagueKey', 'league_key'], ['closedAt', 'closed_at', 'time']],
}

// Device record -> server row. A missing optional field is sent as null, so
// clearing a field on one device clears it on the others.
export function toRow(table: Table, record: LocalRecord, updatedAt: string): RemoteRow {
  const row: RemoteRow = { id: record.id, updated_at: updatedAt, deleted_at: null }
  for (const [local, column] of FIELDS[table]) row[column] = record[local] ?? null
  return row
}

// Server row -> device record. Nulls become missing fields again, and times are
// rewritten in the format the app itself writes (the server uses +00:00, the
// app uses Z), because the app sorts nights by comparing those strings.
export function fromRow(table: Table, row: RemoteRow): LocalRecord {
  const record: LocalRecord = { id: row.id }
  for (const [local, column, kind] of FIELDS[table]) {
    const value = row[column]
    if (value === null || value === undefined) continue
    record[local] = kind === 'time' ? new Date(value as string).toISOString() : value
  }
  return record
}
