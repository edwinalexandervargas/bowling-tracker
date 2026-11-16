import { describe, it, expect } from 'vitest'
import { syncSummary } from './summary'

const at = '2026-11-16T23:14:00.000Z'
const time = new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

describe('syncSummary', () => {
  it('says nothing when sync is off', () => {
    expect(syncSummary({ status: 'off', pending: 0, lastSyncedAt: null, error: null })).toBeNull()
  })

  it('backed up, with the time of the last sync', () => {
    expect(syncSummary({ status: 'idle', pending: 0, lastSyncedAt: at, error: null })).toEqual({
      icon: 'check', label: 'Backed up', detail: `Last backed up ${time}.`,
    })
  })

  it('syncing', () => {
    expect(syncSummary({ status: 'syncing', pending: 3, lastSyncedAt: at, error: null })).toMatchObject({ icon: 'sync', label: 'Syncing' })
  })

  it('changes waiting, with the count', () => {
    expect(syncSummary({ status: 'idle', pending: 1, lastSyncedAt: at, error: null })).toMatchObject({ icon: 'sync', label: '1 waiting', detail: '1 change waiting to upload.' })
    expect(syncSummary({ status: 'offline', pending: 4, lastSyncedAt: at, error: null })).toEqual({
      icon: 'sync', label: '4 waiting', detail: "No signal. 4 changes will upload when it's back.",
    })
  })

  it('offline with nothing waiting', () => {
    expect(syncSummary({ status: 'offline', pending: 0, lastSyncedAt: at, error: null })).toMatchObject({ label: 'Offline', detail: 'No signal. Everything so far is backed up.' })
  })

  it('a problem shows the reason and invites a retry', () => {
    expect(syncSummary({ status: 'error', pending: 2, lastSyncedAt: at, error: 'permission denied for table sessions' })).toEqual({
      icon: 'close', label: 'Retry sync', detail: "Couldn't sync: permission denied for table sessions",
    })
  })
})
