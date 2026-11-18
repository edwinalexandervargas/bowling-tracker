import { useAuthStore } from '../auth/authStore'
import { syncNow } from '../sync/sync'
import { isGuest } from './guestStore'
import { leaveGuest, claimCarry } from './guest'

// When a real account signs in, guest mode ends and any nights the guest chose
// to keep join that account. Kept apart from guest.ts because it needs the
// auth store, which needs a browser.
async function onSignedIn() {
  if (isGuest()) await leaveGuest()
  claimCarry()
  // The sync run that signing in started may have been skipped while the
  // guest's data was being swapped out, so go again now it's done.
  syncNow()
}

// Call once when the app starts. Returns a function that undoes it.
export function startGuestBridge(): () => void {
  if (useAuthStore.getState().session) void onSignedIn()
  return useAuthStore.subscribe((state, prev) => {
    if (state.session && !prev.session) void onSignedIn()
  })
}
