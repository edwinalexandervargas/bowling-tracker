// Test helpers for guest mode. Not imported by the app, so it never reaches the bundle.
import { vi } from 'vitest'

// localStorage, in memory. Shared across a "refresh" by passing the same one back in.
export class MemoryStorage implements Storage {
  private items = new Map<string, string>()
  get length() { return this.items.size }
  key(i: number) { return [...this.items.keys()][i] ?? null }
  getItem(key: string) { return this.items.get(key) ?? null }
  setItem(key: string, value: string) { this.items.set(key, String(value)) }
  removeItem(key: string) { this.items.delete(key) }
  clear() { this.items.clear() }
}

// Loads the app's stores from scratch, the way opening the page does: each
// store reads what the device has saved when it is first imported.
export async function openApp(storage = new MemoryStorage()) {
  vi.resetModules()
  const session = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('sessionStorage', session)
  vi.stubGlobal('window', {
    localStorage: storage,
    sessionStorage: session,
    location: { search: '', hash: '', pathname: '/', origin: 'http://localhost' },
    history: { replaceState() {} },
    addEventListener() {},
    removeEventListener() {},
  })
  vi.stubGlobal('document', { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} })
  vi.stubGlobal('navigator', { onLine: true })

  const game = await import('../store/gameStore')
  const guestStore = await import('./guestStore')
  const guest = await import('./guest')
  return { storage, ...game, ...guestStore, ...guest }
}

// Pins standing after a ball, as the store takes them.
export const STRIKE = 0
export const TEN_PIN = 512
export const SPARE = 0

type Store = Awaited<ReturnType<typeof openApp>>['useGameStore']

// Starts a league night the way the Score tab does.
export function startNight(useGameStore: Store, id = 'guest-night') {
  const { startSession, startGame } = useGameStore.getState()
  startSession({ id, date: '2026-11-18T03:00:00.000Z', type: 'league', eventName: 'Try-out night', games: [] })
  startGame()
}

// 12 strikes.
export function bowlPerfectGame(useGameStore: Store) {
  for (let i = 0; i < 12; i++) useGameStore.getState().recordShot(STRIKE)
}

// 9 and a spare every frame, then a 9 on the fill ball: 190.
export function bowlAllSpares(useGameStore: Store) {
  for (let i = 0; i < 10; i++) {
    useGameStore.getState().recordShot(TEN_PIN)
    useGameStore.getState().recordShot(SPARE)
  }
  useGameStore.getState().recordShot(TEN_PIN)
}
