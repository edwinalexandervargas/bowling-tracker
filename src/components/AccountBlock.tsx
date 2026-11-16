import { NavLink } from 'react-router'
import { useAuthStore } from '../auth/authStore'
import { Icon } from './Icon'
import { navRowClass } from './styles'

// Sign in / sign out, shown at the bottom of the sidebar and the menu drawer.
// The app works signed out, so this is an option, never a gate.
export function AccountBlock({ onNavigate, rowClass = navRowClass }: {
  onNavigate?: () => void
  rowClass?: (active: boolean) => string
}) {
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)

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
      <button
        type="button"
        onClick={() => {
          onNavigate?.()
          void signOut()
        }}
        className={`${rowClass(false)} w-full`}
      >
        <Icon name="signin" className="h-5 w-5 rotate-180" />
        <span>Sign out</span>
      </button>
    </div>
  )
}
