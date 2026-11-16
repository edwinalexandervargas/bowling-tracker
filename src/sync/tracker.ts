import { TABLES, type LocalData, type Table } from './tables'

// Bookkeeping kept beside each record, on the device, never inside the record:
//   updatedAt  when it was last edited here (or the edit time of the copy we downloaded)
//   dirty      true while that edit is waiting to upload
//   deleted    the record is gone locally and the delete is waiting to upload
export type RecordMeta = { updatedAt: string; dirty: boolean; deleted?: true }
export type MetaMap = Record<string, RecordMeta>

export const metaKey = (table: Table, id: string) => `${table}:${id}`

const byId = (records: { id: string }[]) => new Map(records.map((r) => [r.id, r]))

// Works out what changed between two versions of the data and marks it as
// waiting to upload. The store never mutates a record, it replaces it, so a
// record that is a different object has been edited.
export function trackChanges(meta: MetaMap, prev: LocalData, next: LocalData, now: string): MetaMap {
  let result = meta
  const mark = (key: string, value: RecordMeta) => {
    if (result === meta) result = { ...meta } // copy on the first change only
    result[key] = value
  }

  for (const table of TABLES) {
    if (prev[table] === next[table]) continue // whole list untouched
    const before = byId(prev[table])
    const after = byId(next[table])
    for (const [id, record] of after) {
      if (before.get(id) !== record) mark(metaKey(table, id), { updatedAt: now, dirty: true })
    }
    for (const id of before.keys()) {
      if (!after.has(id)) mark(metaKey(table, id), { updatedAt: now, dirty: true, deleted: true })
    }
  }
  return result
}

// Records with no bookkeeping were created before sync was switched on (or
// before this account signed in). They are treated as edited just now.
export function adoptUntracked(meta: MetaMap, data: LocalData, now: string): MetaMap {
  let result = meta
  for (const table of TABLES) {
    for (const record of data[table]) {
      const key = metaKey(table, record.id)
      if (key in result) continue
      if (result === meta) result = { ...meta }
      result[key] = { updatedAt: now, dirty: true }
    }
  }
  return result
}

export const pendingCount = (meta: MetaMap) => Object.values(meta).filter((m) => m.dirty).length
