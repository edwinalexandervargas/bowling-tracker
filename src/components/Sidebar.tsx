import { NavLink } from 'react-router'
import { primaryLinks, moreLinks, type NavItem } from './navLinks'
import { Icon } from './Icon'
import { KingpinMark } from './ui'
import { AccountBlock } from './AccountBlock'
import { navRowClass } from './styles'

// Below 1024px the sidebar is a narrow rail: icon above a short label.
// From 1024px it is a full list with group headings.
const railRowClass = (active: boolean) =>
  `${navRowClass(active)} max-lg:flex-col max-lg:justify-center max-lg:gap-1 max-lg:px-1 max-lg:py-2 max-lg:text-center max-lg:text-[11px] max-lg:leading-tight`

function Group({ title, links }: { title: string; links: NavItem[] }) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-xs font-semibold text-muted max-lg:hidden">{title}</p>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => railRowClass(isActive)}>
          <Icon name={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </div>
  )
}

// Navigation for tablets, desktops and phones held sideways. All eight
// destinations are visible, so there is no drawer at these sizes.
export function Sidebar() {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-surface px-2 py-4 pl-[max(0.5rem,env(safe-area-inset-left))] md:flex lg:w-60 lg:px-3 short:flex short:gap-2 short:py-2"
    >
      <div className="flex items-center gap-2.5 px-3 text-ink max-lg:justify-center max-lg:px-0 short:hidden">
        <KingpinMark className="h-7 w-8" />
        <span className="display text-base max-lg:hidden">Kingpin</span>
      </div>
      <Group title="League night" links={primaryLinks} />
      <Group title="More" links={moreLinks} />
      <div className="mt-auto border-t border-line pt-3">
        <AccountBlock rowClass={railRowClass} />
      </div>
    </nav>
  )
}
