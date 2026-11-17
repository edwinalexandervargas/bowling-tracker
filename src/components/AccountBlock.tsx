import { NavLink, useNavigate } from 'react-router'
import { useAuthStore } from '../auth/authStore'
import { useSyncStore } from '../sync/syncStore'
import { syncSummary } from '../sync/summary'
import { pendingCount } from '../sync/tracker'
import { syncNow } from '../sync/sync'
import { Icon } from './Icon'
import { navRowClass } from './styles'

// Where backup stands, in an icon and two or three words. Tapping it syncs now.
function SyncRow({ rowClass }: { rowClass: (active: boolean) => string }) {
  const status = useSyncStore((s) => s.status)
  const pending = useSyncStore((s) => pendingCount(s.meta))
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)
  const error = useSyncStore((s) => s.error)

  const summary = syncSummary({ status, pending, lastSyncedAt, error })
  if (!summary) return null

  return (
    <>
      <button type="button" onClick={syncNow} aria-label={`${summary.label}. ${summary.detail} Tap to sync now.`} className={`${rowClass(false)} w-full`}>
        <Icon name={summary.icon} />
        <span>{summary.label}</span>
      </button>
      {/* The sentence of detail is hidden on the narrow icon rail, where it can't fit. */}
      <p role="status" className={`px-3 pb-2 text-xs max-lg:md:hidden ${status === 'error' ? 'text-danger' : 'text-muted'}`}>{summary.detail}</p>
    </>
  )
}

// Sign in / sign out, shown at the bottom of the sidebar and the menu drawer.
// The app works signed out, so this is an option, never a gate.
export function AccountBlock({ onNavigate, rowClass = navRowClass }: {
  onNavigate?: () => void
  rowClass?: (active: boolean) => string
}) {
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  if (!session) {
    return (
      <NavLink to="/login" onClick={onNavigate} className={({ isActive }) => rowClass(isActive)}>
        <Icon name="signin" />
        <span>Sign in</span>
      </NavLink>
    )
  }

  return (
    <div>
      {session.user.email && (
        <p className="truncate px-3 pb-1 text-xs text-muted max-lg:md:hidden">{session.user.email}</p>
      )}
      <SyncRow rowClass={rowClass} />
      <button
        type="button"
        onClick={() => {
          onNavigate?.()
          // Go to the Sign in screen once the session is actually gone. That screen
          // sends signed-in users home, so going there first would bounce straight back.
          void signOut().then(() => navigate('/login'))
        }}
        className={`${rowClass(false)} w-full`}
      >
        <Icon name="signin" className="h-5 w-5 rotate-180" />
        <span>Sign out</span>
      </button>
    </div>
  )
}
