import { fromRow, type RemoteRow } from './mappers'
import { metaKey, type MetaMap } from './tracker'
import type { LocalRecord, Table } from './tables'

export type Merged = {
  upserts: LocalRecord[]   // records to add or replace on this device
  deletes: string[]        // ids to remove from this device
  meta: MetaMap
}

// Decides what to do with rows downloaded from the server.
// The rule is the same one the database enforces: the newest edit wins.
export function mergePulled(table: Table, rows: RemoteRow[], meta: MetaMap): Merged {
  const upserts: LocalRecord[] = []
  const deletes: string[] = []
  let result = meta

  for (const row of rows) {
    const key = metaKey(table, row.id)
    const local = result[key]
    // Compared as moments in time: the server and the device format them differently.
    if (local && Date.parse(local.updatedAt) >= Date.parse(row.updated_at)) continue

    if (result === meta) result = { ...meta }
    if (row.deleted_at) {
      deletes.push(row.id)
      delete result[key]
    } else {
      upserts.push(fromRow(table, row))
      result[key] = { updatedAt: new Date(row.updated_at).toISOString(), dirty: false }
    }
  }
  return { upserts, deletes, meta: result }
}

// Applies upserts and deletes to a list without mutating it.
export function applyToList<T extends { id: string }>(list: T[], upserts: T[], deletes: string[]): T[] {
  if (upserts.length === 0 && deletes.length === 0) return list
  const incoming = new Map(upserts.map((r) => [r.id, r]))
  const gone = new Set(deletes)
  const kept = list.filter((r) => !gone.has(r.id)).map((r) => incoming.get(r.id) ?? r)
  const existing = new Set(list.map((r) => r.id))
  return [...kept, ...upserts.filter((r) => !existing.has(r.id))]
}
