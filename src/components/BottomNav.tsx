import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { SideMenu } from './SideMenu'
import { primaryLinks, moreLinks } from './navLinks'
import { Icon } from './Icon'

// The active tab gets a bar along its top edge and bolder text, as well as
// the accent colour, so it can be told apart without relying on colour.
const tabClass = (active: boolean) =>
  `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
    active
      ? 'font-semibold text-accent before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:rounded-full before:bg-accent'
      : 'font-medium text-muted'
  }`

// Phone navigation: the league-night screens one thumb-tap away, the rest behind Menu.
// Hidden from 768px up and on phones held sideways, where the Sidebar takes over.
export function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const onMenuRoute = pathname === '/login' || moreLinks.some((l) => pathname.startsWith(l.to))

  const closeMenu = () => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden short:hidden"
      >
        {primaryLinks.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => tabClass(isActive)}>
            <Icon name={tab.icon} />
            {tab.label}
          </NavLink>
        ))}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="side-menu"
          className={tabClass(onMenuRoute)}
        >
          <Icon name="profile" />
          Menu
        </button>
      </nav>
      <SideMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
