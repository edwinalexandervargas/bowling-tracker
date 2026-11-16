import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MetaMap } from './tracker'
import type { Table } from './tables'
import type { SyncStatus } from './summary'

type SyncStore = {
  // Saved on the device, so a restart never forgets what is still waiting to upload.
  meta: MetaMap
  cursors: Partial<Record<Table, string>>
  ownerId: string | null         // the account this bookkeeping belongs to
  lastSyncedAt: string | null

  // Not saved: where the current run stands.
  status: SyncStatus
  error: string | null
}

// Kept apart from the game store on purpose: scoring never reads or waits on any of this.
export const useSyncStore = create<SyncStore>()(
  persist(
    (): SyncStore => ({
      meta: {},
      cursors: {},
      ownerId: null,
      lastSyncedAt: null,
      status: 'off',
      error: null,
    }),
    {
      name: 'bowling-tracker-sync',
      partialize: ({ meta, cursors, ownerId, lastSyncedAt }) => ({ meta, cursors, ownerId, lastSyncedAt }),
    },
  ),
)
