import { create } from 'zustand'

// Guest mode: someone trying the app with no account. Everything works for the
// visit, nothing reaches Supabase. This file holds only the flag and the
// sign-up prompt, so the game store and the sync layer can read it without
// importing anything that imports them back.

// Saved so a refresh keeps the guest in guest mode, mid-game included.
export const GUEST_FLAG_KEY = 'bowling-tracker-guest-active'

function readFlag(): boolean {
  try {
    return globalThis.localStorage?.getItem(GUEST_FLAG_KEY) === '1'
  } catch {
    return false // storage blocked: guest mode lasts for this page only
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) globalThis.localStorage?.setItem(GUEST_FLAG_KEY, '1')
    else globalThis.localStorage?.removeItem(GUEST_FLAG_KEY)
  } catch {
    /* storage blocked */
  }
}

type GuestState = {
  active: boolean       // in guest mode
  switching: boolean    // swapping the store's contents in or out; sync must not see it
  promptOpen: boolean   // the "Create a free account to save this." dialog
  setActive: (on: boolean) => void
  setSwitching: (on: boolean) => void
  openPrompt: () => void
  closePrompt: () => void
}

export const useGuestStore = create<GuestState>()((set) => ({
  active: readFlag(),
  switching: false,
  promptOpen: false,
  setActive: (on) => {
    writeFlag(on)
    set({ active: on, promptOpen: false })
  },
  setSwitching: (on) => set({ switching: on }),
  openPrompt: () => set({ promptOpen: true }),
  closePrompt: () => set({ promptOpen: false }),
}))

export const isGuest = () => useGuestStore.getState().active

// True while the game store holds guest data, or is being swapped. The sync
// layer reads this: nothing a guest does is tracked, uploaded or downloaded.
export const guestHoldsStore = () => {
  const { active, switching } = useGuestStore.getState()
  return active || switching
}

// For an action a guest can't take. Returns true (and shows the sign-up
// prompt) when the caller should stop; false when it's a real user.
export function blockedForGuest(): boolean {
  if (!isGuest()) return false
  useGuestStore.getState().openPrompt()
  return true
}
