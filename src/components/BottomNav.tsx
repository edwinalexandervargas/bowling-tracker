import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { SideMenu } from './SideMenu'
import { menuLinks } from './menuLinks'

const tabs = [
  { to: '/', label: 'Score' },
  { to: '/nights', label: 'Nights' },
  { to: '/stats', label: 'Stats' },
]

const tabClass = (active: boolean) =>
  `flex-1 py-3 text-center text-xs font-medium ${active ? 'text-white bg-gray-700' : 'text-gray-400'}`

export function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const onMenuRoute = menuLinks.some((l) => pathname.startsWith(l.to))

  const closeMenu = () => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <>
      <nav aria-label="Main" className="fixed bottom-0 inset-x-0 bg-gray-800 border-t border-gray-700 flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => tabClass(isActive)}
          >
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
          Menu
        </button>
      </nav>
      <SideMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
