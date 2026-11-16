// Test doubles for the sync engine. Not imported by the app.
import type { Remote, SyncState } from './engine'
import type { RemoteRow } from './mappers'
import { trackChanges } from './tracker'
import { applyToList } from './merge'
import { emptyData, type LocalData, type LocalRecord, type Table } from './tables'

// Behaves like the real tables in supabase/schema.sql: one row per id, the
// newest edit wins, and every accepted write gets a later synced_at.
export class FakeServer {
  private rows = new Map<string, RemoteRow>()
  private tick = Date.UTC(2026, 10, 16, 12)
  online = true
  writes = 0
  pulls: { table: Table; since: string | null }[] = []
  // Runs in the middle of an upload, to simulate the bowler tapping while it is in flight.
  duringUpload: (() => void) | null = null

  private check() {
    if (!this.online) throw new Error('Failed to fetch')
  }

  private accept(key: string, row: RemoteRow) {
    const existing = this.rows.get(key)
    if (existing && Date.parse(row.updated_at) < Date.parse(existing.updated_at)) return
    this.tick += 1000
    this.rows.set(key, { ...row, synced_at: new Date(this.tick).toISOString() })
    this.writes++
  }

  remote: Remote = {
    pull: async (table, since) => {
      this.check()
      this.pulls.push({ table, since })
      return [...this.rows.entries()]
        .filter(([key, row]) => key.startsWith(`${table}:`) && (since === null || Date.parse(row.synced_at!) > Date.parse(since)))
        .map(([, row]) => row)
        .sort((a, b) => Date.parse(a.synced_at!) - Date.parse(b.synced_at!))
    },
    upsert: async (table, rows) => {
      this.check()
      this.duringUpload?.()
      for (const row of rows) this.accept(`${table}:${row.id}`, row)
    },
    markDeleted: async (table, items) => {
      this.check()
      for (const { id, updatedAt } of items) {
        const existing = this.rows.get(`${table}:${id}`)
        if (existing) this.accept(`${table}:${id}`, { ...existing, updated_at: updatedAt, deleted_at: updatedAt })
      }
    },
  }

  row(table: Table, id: string) {
    return this.rows.get(`${table}:${id}`)
  }
}

// One phone or laptop: its own data, its own bookkeeping, its own clock.
export class Device {
  data: LocalData = emptyData()
  state: SyncState = { meta: {}, cursors: {} }
  clock: number

  constructor(startMinute = 0) {
    this.clock = Date.UTC(2026, 10, 16, 20, startMinute)
  }

  now = () => new Date(this.clock).toISOString()

  // A change made by the bowler: replace the data and let the tracker notice.
  edit(minute: number, change: (data: LocalData) => Partial<LocalData>) {
    this.clock = Date.UTC(2026, 10, 16, 20, minute)
    const next = { ...this.data, ...change(this.data) }
    this.state = { ...this.state, meta: trackChanges(this.state.meta, this.data, next, this.now()) }
    this.data = next
  }

  local = {
    read: () => this.data,
    apply: (table: Table, upserts: LocalRecord[], deletes: string[]) => {
      this.data = { ...this.data, [table]: applyToList(this.data[table], upserts, deletes) }
    },
  }

  store = {
    get: () => this.state,
    set: (next: SyncState) => {
      this.state = next
    },
  }

  ids(table: Table) {
    return this.data[table].map((r) => r.id).sort()
  }
}
