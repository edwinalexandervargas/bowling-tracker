import type { IconName } from './Icon'

export type NavItem = { to: string; label: string; icon: IconName }

// The one list of destinations. The phone's bottom bar shows `primaryLinks`
// and puts `moreLinks` in the Menu drawer; the sidebar on wider screens shows both.
export const primaryLinks: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/score', label: 'Score', icon: 'score' },
  { to: '/side-pots', label: 'Side pots', icon: 'pots' },
  { to: '/nights', label: 'Nights', icon: 'nights' },
]

export const moreLinks: NavItem[] = [
  { to: '/stats', label: 'Stats', icon: 'stats' },
  { to: '/arsenal', label: 'Arsenal', icon: 'arsenal' },
  { to: '/patterns', label: 'Patterns', icon: 'patterns' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
]
