import { NavLink } from 'react-router'

const tabs = [
  { to: '/', label: 'Score' },
  { to: '/arsenal', label: 'Arsenal' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/profile', label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-800 border-t border-gray-700 flex">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-sm font-medium ${
              isActive ? 'text-white bg-gray-700' : 'text-gray-400'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
