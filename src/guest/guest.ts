import { useGameStore, emptyCollections, GUEST_GAME_KEY } from '../store/gameStore'
import type { Session } from '../types'
import { useGuestStore } from './guestStore'
import { sampleData, isSampleId } from './sampleData'

// Starting and ending guest mode, and keeping a guest's games when they sign up.
// No Supabase here at all: a guest has no session, so there is nothing to call.

const storage = () => globalThis.localStorage as Storage | undefined

// Start the demo: the store switches to the guest's own saved copy and fills
// with sample data. The account copy on this device (if any) is left alone.
export function enterGuest(now = new Date()) {
  const guest = useGuestStore.getState()
  if (guest.active) return
  guest.setSwitching(true)
  try {
    guest.setActive(true) // from here the store saves under the guest key
    useGameStore.setState({ ...sampleData(now), activeEntry: null })
  } finally {
    guest.setSwitching(false)
  }
}

// End the demo: throw away the guest's data and load back whatever this
// device holds for an account. The sync layer is told to look away while the
// store is swapped, so reloading the account's nights isn't seen as an edit.
export async function leaveGuest() {
  const guest = useGuestStore.getState()
  if (!guest.active) return
  guest.setSwitching(true)
  try {
    useGameStore.setState(emptyCollections()) // still saving under the guest key
    guest.setActive(false)
    try {
      storage()?.removeItem(GUEST_GAME_KEY)
    } catch {
      /* storage blocked */
    }
    await useGameStore.persist.rehydrate()
  } finally {
    guest.setSwitching(false)
  }
}

// The nights a guest bowled themselves, ready to join an account. Sample
// nights stay behind, and so do empty ones. Sample patterns don't come along
// either, so a night bowled on one becomes a house-shot night.
export function guestNightsToKeep(sessions: Session[]): Session[] {
  return sessions
    .filter((s) => !isSampleId(s.id) && s.games.some((g) => g.frames.length > 0))
    .map((s) => {
      if (!s.patternId || !isSampleId(s.patternId)) return s
      const kept = { ...s }
      delete kept.patternId
      return kept
    })
}

// Adds kept nights to an account's nights, skipping any already there.
export function mergeNights(existing: Session[], incoming: Session[]): Session[] {
  const have = new Set(existing.map((s) => s.id))
  const added = incoming.filter((s) => !have.has(s.id))
  return added.length ? [...existing, ...added] : existing
}

// Signing up usually means confirming an email first, so the kept nights wait
// on the device until the account's first sign-in here. After two days they
// are dropped, so a demo left half-finished doesn't land in someone else's account.
export const CARRY_KEY = 'bowling-tracker-guest-carry'
const CARRY_MAX_AGE_MS = 2 * 86_400_000

type Carry = { savedAt: string; sessions: Session[] }

export function saveCarry(sessions: Session[], now = new Date()) {
  try {
    if (sessions.length === 0) return clearCarry()
    const carry: Carry = { savedAt: now.toISOString(), sessions }
    storage()?.setItem(CARRY_KEY, JSON.stringify(carry))
  } catch {
    /* storage blocked: nothing can wait, so nothing is kept */
  }
}

export function clearCarry() {
  try {
    storage()?.removeItem(CARRY_KEY)
  } catch {
    /* storage blocked */
  }
}

export function readCarry(now = new Date()): Session[] {
  try {
    const raw = storage()?.getItem(CARRY_KEY)
    if (!raw) return []
    const carry = JSON.parse(raw) as Carry
    const age = now.getTime() - Date.parse(carry.savedAt)
    if (!(age >= 0 && age <= CARRY_MAX_AGE_MS) || !Array.isArray(carry.sessions)) {
      clearCarry()
      return []
    }
    return carry.sessions
  } catch {
    clearCarry()
    return []
  }
}

// Called once a real account is signed in and guest mode has ended. The kept
// nights become ordinary edits, so the sync layer uploads them like any other.
// Returns how many nights were added.
export function claimCarry(now = new Date()): number {
  if (useGuestStore.getState().active) return 0 // only ever into a real account
  const incoming = readCarry(now)
  clearCarry()
  if (incoming.length === 0) return 0
  const before = useGameStore.getState().sessions
  const after = mergeNights(before, incoming)
  if (after !== before) useGameStore.setState({ sessions: after })
  return after.length - before.length
}
