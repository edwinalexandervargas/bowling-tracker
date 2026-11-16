import { toRow, type RemoteRow } from './mappers'
import { mergePulled } from './merge'
import { adoptUntracked, metaKey, type MetaMap } from './tracker'
import { TABLES, type LocalData, type LocalRecord, type Table } from './tables'

// The server, as far as the engine cares. The real one is in supabaseRemote.ts;
// tests use a fake, which is why the engine never imports Supabase.
export type Remote = {
  // Rows changed on the server after `since` (a synced_at value), oldest first.
  pull(table: Table, since: string | null): Promise<RemoteRow[]>
  upsert(table: Table, rows: RemoteRow[]): Promise<void>
  markDeleted(table: Table, items: { id: string; updatedAt: string }[]): Promise<void>
}

// This device's data.
export type LocalStore = {
  read(): LocalData
  apply(table: Table, upserts: LocalRecord[], deletes: string[]): void
}

// What the device remembers between syncs.
export type SyncState = {
  meta: MetaMap
  cursors: Partial<Record<Table, string>>   // newest synced_at seen, per table
}
export type StateStore = { get(): SyncState; set(next: SyncState): void }

// Each download re-reads the last 30 seconds. A write the server finished
// slightly out of order would otherwise be missed for good; re-reading is
// harmless because merging the same row twice changes nothing.
const OVERLAP_MS = 30_000

type Deps = { remote: Remote; local: LocalStore; state: StateStore; now: () => string }

// One full sync: download and merge, then upload what is waiting.
// Throws if the network fails; whatever was not uploaded simply stays waiting.
export async function syncOnce({ remote, local, state, now }: Deps): Promise<{ pulled: number; pushed: number }> {
  let pulled = 0
  let pushed = 0

  // 0. Anything on the device that has never been tracked is waiting to upload.
  state.set({ ...state.get(), meta: adoptUntracked(state.get().meta, local.read(), now()) })

  // 1. Download first, so an older local edit never overwrites a newer one from another device.
  for (const table of TABLES) {
    const cursor = state.get().cursors[table]
    const since = cursor ? new Date(Date.parse(cursor) - OVERLAP_MS).toISOString() : null
    const rows = await remote.pull(table, since)
    if (rows.length === 0) continue

    const merged = mergePulled(table, rows, state.get().meta)
    local.apply(table, merged.upserts, merged.deletes)
    pulled += merged.upserts.length + merged.deletes.length

    const newest = rows.reduce((max, row) => (Date.parse(row.synced_at!) > Date.parse(max) ? row.synced_at! : max), rows[0].synced_at!)
    state.set({ meta: merged.meta, cursors: { ...state.get().cursors, [table]: newest } })
  }

  // 2. Upload what is waiting.
  for (const table of TABLES) {
    const meta = state.get().meta
    const records = new Map(local.read()[table].map((r) => [r.id, r]))
    const rows: RemoteRow[] = []
    const deleted: { id: string; updatedAt: string }[] = []

    for (const [key, m] of Object.entries(meta)) {
      if (!m.dirty || !key.startsWith(`${table}:`)) continue
      const id = key.slice(table.length + 1)
      const record = records.get(id)
      if (m.deleted) deleted.push({ id, updatedAt: m.updatedAt })
      else if (record) rows.push(toRow(table, record, m.updatedAt))
    }
    if (rows.length === 0 && deleted.length === 0) continue

    if (rows.length > 0) await remote.upsert(table, rows)
    if (deleted.length > 0) await remote.markDeleted(table, deleted)
    pushed += rows.length + deleted.length

    // Clear the waiting flag, but only if the record was not edited again while
    // the upload was in flight. If it was, it stays waiting for the next sync.
    const after = { ...state.get().meta }
    for (const { id, updated_at } of rows) {
      const key = metaKey(table, id)
      if (after[key]?.updatedAt === updated_at) after[key] = { updatedAt: updated_at, dirty: false }
    }
    for (const { id, updatedAt } of deleted) {
      const key = metaKey(table, id)
      if (after[key]?.updatedAt === updatedAt) delete after[key]
    }
    state.set({ ...state.get(), meta: after })
  }

  return { pulled, pushed }
}
