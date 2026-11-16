import { supabase } from '../lib/supabase'
import type { Remote } from './engine'
import type { RemoteRow } from './mappers'

// The API returns at most this many rows per request, so downloads go in pages.
const PAGE = 1000

const fail = (what: string, message: string): never => {
  throw new Error(`${what}: ${message}`)
}

// The real server: the tables in supabase/schema.sql, reached with supabase-js.
// Row-level security means every call only ever sees this user's rows.
export function supabaseRemote(userId: string): Remote {
  return {
    async pull(table, since) {
      const rows: RemoteRow[] = []
      for (let from = 0; ; from += PAGE) {
        let query = supabase.from(table).select('*').order('synced_at', { ascending: true }).range(from, from + PAGE - 1)
        if (since) query = query.gt('synced_at', since)
        const { data, error } = await query
        if (error) fail(`Download ${table}`, error.message)
        rows.push(...((data ?? []) as RemoteRow[]))
        if (!data || data.length < PAGE) return rows
      }
    },

    // Insert, or update when the row exists. The database drops any row whose
    // edit is older than what it already has (see keep_newest in schema.sql).
    async upsert(table, rows) {
      const { error } = await supabase
        .from(table)
        .upsert(rows.map((row) => ({ ...row, user_id: userId })), { onConflict: 'user_id,id' })
      if (error) fail(`Upload ${table}`, error.message)
    },

    // Deletes are an update that sets deleted_at, so other devices can learn about them.
    async markDeleted(table, items) {
      for (const { id, updatedAt } of items) {
        const { error } = await supabase
          .from(table)
          .update({ deleted_at: updatedAt, updated_at: updatedAt })
          .eq('user_id', userId)
          .eq('id', id)
        if (error) fail(`Delete from ${table}`, error.message)
      }
    },
  }
}
