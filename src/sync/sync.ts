import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../auth/authStore'
import { supabaseConfigured } from '../lib/supabaseConfig'
import { useSyncStore } from './syncStore'
import { syncOnce, type LocalStore, type StateStore } from './engine'
import { trackChanges } from './tracker'
import { applyToList } from './merge'
import { toLocalData, toCollectionPatch, type LocalData } from './tables'

// Connects the sync engine to the app: watches the game store for changes,
// and runs a sync when there is a reason to. Nothing here is awaited by the
// UI, so a slow or missing network can never hold up a tap.

// Wait this long after the last change before uploading, so a run of quick
// taps becomes one upload instead of several.
const DEBOUNCE_MS = 2000

const now = () => new Date().toISOString()
const userId = () => useAuthStore.getState().session?.user.id ?? null

let baseline: LocalData = toLocalData(useGameStore.getState())
let applyingRemote = false   // true while downloaded records are being written to the store
let running = false
let runAgain = false
let timer: ReturnType<typeof setTimeout> | undefined

const local: LocalStore = {
  read: () => toLocalData(useGameStore.getState()),
  apply(table, upserts, deletes) {
    const current = toLocalData(useGameStore.getState())[table]
    const next = applyToList(current, upserts, deletes)
    if (next === current) return
    // Downloaded records are not local edits, so the change tracker must not see them.
    applyingRemote = true
    try {
      useGameStore.getState().applyRemote(toCollectionPatch(table, next))
    } finally {
      applyingRemote = false
    }
  },
}

const state: StateStore = {
  get: () => ({ meta: useSyncStore.getState().meta, cursors: useSyncStore.getState().cursors }),
  set: (next) => useSyncStore.setState(next),
}

function schedule(delay = DEBOUNCE_MS) {
  clearTimeout(timer)
  timer = setTimeout(run, delay)
}

async function run() {
  const id = userId()
  if (!id || !supabaseConfigured) return useSyncStore.setState({ status: 'off', error: null })
  if (running) {
    runAgain = true // a change arrived mid-sync; go round once more when this one ends
    return
  }
  if (!navigator.onLine) return useSyncStore.setState({ status: 'offline', error: null })

  running = true
  useSyncStore.setState({ status: 'syncing', error: null })
  try {
    // A different account from last time: start its bookkeeping from scratch, so
    // everything on the device is merged with that account's data.
    if (useSyncStore.getState().ownerId !== id) useSyncStore.setState({ ownerId: id, meta: {}, cursors: {} })

    // Loaded on demand: this is the only file that needs the Supabase library.
    const { supabaseRemote } = await import('./supabaseRemote')
    await syncOnce({ remote: supabaseRemote(id), local, state, now })
    useSyncStore.setState({ status: 'idle', lastSyncedAt: now() })
  } catch (e) {
    // Whatever failed stays marked as waiting, so the next run picks it up.
    useSyncStore.setState(
      navigator.onLine
        ? { status: 'error', error: e instanceof Error ? e.message : String(e) }
        : { status: 'offline', error: null },
    )
  } finally {
    running = false
    if (runAgain) {
      runAgain = false
      schedule(0)
    }
  }
}

// For the "tap to sync" control.
export const syncNow = () => schedule(0)

// Call once when the app starts. Returns a function that undoes it.
export function startSync(): () => void {
  baseline = toLocalData(useGameStore.getState())

  // Every change to the data is noted as waiting to upload, signed in or not,
  // so edits made signed out or offline are uploaded later.
  const stopWatchingData = useGameStore.subscribe((s) => {
    const next = toLocalData(s)
    if (!applyingRemote) {
      const meta = useSyncStore.getState().meta
      const tracked = trackChanges(meta, baseline, next, now())
      if (tracked !== meta) {
        useSyncStore.setState({ meta: tracked })
        schedule()
      }
    }
    baseline = next
  })

  // Signing in or out.
  let lastUser = userId()
  const stopWatchingAuth = useAuthStore.subscribe(() => {
    if (userId() === lastUser) return
    lastUser = userId()
    schedule(0)
  })

  // Signal coming back, and the app returning to the foreground.
  const onOnline = () => schedule(0)
  const onVisible = () => document.visibilityState === 'visible' && schedule(0)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOnline)
  document.addEventListener('visibilitychange', onVisible)

  schedule(0)

  return () => {
    clearTimeout(timer)
    stopWatchingData()
    stopWatchingAuth()
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOnline)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
