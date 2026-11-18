import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import type { Session as AuthSession } from '@supabase/supabase-js'
import { FakeServer } from '../sync/fakes'
import { openApp, MemoryStorage, startNight, bowlPerfectGame } from './testEnv'

// The real sync loop, with a fake server in place of Supabase. This is the
// "nothing a guest does reaches the database" check, run on every test run.
// The real database has its own guard: rows only go to the authenticated role,
// and a guest has no session at all (see DECISIONS.md, Guest mode).

let server: FakeServer

beforeEach(() => {
  server = new FakeServer()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
  vi.doMock('../sync/supabaseRemote', () => ({ supabaseRemote: () => server.remote }))
})

afterEach(() => {
  vi.doUnmock('../sync/supabaseRemote')
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

async function openWithSync(storage = new MemoryStorage()) {
  const app = await openApp(storage)
  const { useAuthStore } = await import('../auth/authStore')
  const { useSyncStore } = await import('../sync/syncStore')
  const { startSync, syncNow } = await import('../sync/sync')
  const { startGuestBridge } = await import('./guestBridge')
  const stops = [startSync(), startGuestBridge()]
  const signIn = (id = 'user-1') => useAuthStore.setState({ session: { user: { id } } as AuthSession, loading: false })
  // Waits for a sync run to finish.
  const synced = async () => {
    const before = useSyncStore.getState().lastSyncedAt
    syncNow()
    await vi.waitFor(() => {
      const { status, lastSyncedAt } = useSyncStore.getState()
      expect(status).toBe('idle')
      expect(lastSyncedAt).not.toBe(before)
    }, { timeout: 3000, interval: 10 })
  }
  return { ...app, useSyncStore, signIn, synced, stop: () => stops.forEach((s) => s()) }
}

describe('nothing a guest does reaches the database', () => {
  it('control: a signed-in bowler\'s night is uploaded', async () => {
    const app = await openWithSync()
    app.signIn()
    startNight(app.useGameStore, 'real-night')
    bowlPerfectGame(app.useGameStore)
    await app.synced()

    expect(server.row('sessions', 'real-night')).toBeDefined()
    app.stop()
  })

  it('a guest scoring, with sync running, writes nothing and leaves nothing waiting', async () => {
    const app = await openWithSync()
    app.enterGuest()
    startNight(app.useGameStore)
    bowlPerfectGame(app.useGameStore)
    app.useGameStore.getState().addBall({ id: 'b1', specId: 's1', surface: '2000', layout: { system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 } })
    await new Promise((r) => setTimeout(r, 50))

    expect(server.writes).toBe(0)
    expect(server.pulls).toEqual([])
    expect(app.useSyncStore.getState().meta).toEqual({})
    app.stop()
  })

  it('signing up without keeping uploads none of the guest\'s nights or the sample data', async () => {
    const app = await openWithSync()
    app.enterGuest()
    startNight(app.useGameStore)
    bowlPerfectGame(app.useGameStore)
    app.clearCarry() // keep was unticked

    app.signIn()
    await vi.waitFor(() => expect(app.useGuestStore.getState().active).toBe(false))
    await app.synced()

    expect(server.writes).toBe(0)
    expect(app.useGameStore.getState().sessions).toEqual([])
    app.stop()
  })

  it('signing up and keeping uploads the guest\'s night and nothing else', async () => {
    const app = await openWithSync()
    app.enterGuest()
    startNight(app.useGameStore)
    bowlPerfectGame(app.useGameStore)
    app.saveCarry(app.guestNightsToKeep(app.useGameStore.getState().sessions))

    app.signIn()
    await vi.waitFor(() => expect(app.useGameStore.getState().sessions.map((s) => s.id)).toEqual(['guest-night']))
    await app.synced()

    expect(server.row('sessions', 'guest-night')).toBeDefined()
    expect(server.row('sessions', 'sample-night-1')).toBeUndefined()
    expect(server.row('balls', 'sample-ball-1')).toBeUndefined()
    expect(server.writes).toBe(1)
    app.stop()
  })
})
