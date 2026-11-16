import type { IconName } from '../components/Icon'
import { count } from '../format'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'offline' | 'error'

type Input = { status: SyncStatus; pending: number; lastSyncedAt: string | null; error: string | null }

// What the sync indicator shows: an icon, two or three words, and a sentence
// of detail. null means show nothing (signed out, or Supabase not set up).
export function syncSummary({ status, pending, lastSyncedAt, error }: Input): { icon: IconName; label: string; detail: string } | null {
  if (status === 'off') return null
  if (status === 'syncing') return { icon: 'sync', label: 'Syncing', detail: 'Syncing with your account.' }
  if (status === 'error') return { icon: 'close', label: 'Retry sync', detail: `Couldn't sync: ${error ?? 'unknown problem'}` }

  if (status === 'offline') {
    return pending > 0
      ? { icon: 'sync', label: `${pending} waiting`, detail: `No signal. ${count(pending, 'change')} will upload when it's back.` }
      : { icon: 'sync', label: 'Offline', detail: 'No signal. Everything so far is backed up.' }
  }

  if (pending > 0) return { icon: 'sync', label: `${pending} waiting`, detail: `${count(pending, 'change')} waiting to upload.` }
  const time = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null
  return { icon: 'check', label: 'Backed up', detail: time ? `Last backed up ${time}.` : 'Everything is backed up.' }
}
