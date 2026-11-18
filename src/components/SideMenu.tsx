import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { moreLinks } from './navLinks'
import { Icon } from './Icon'
import { AccountBlock } from './AccountBlock'
import { KingpinMark } from './ui'
import { navRowClass } from './styles'

type Props = {
  open: boolean
  onClose: () => void
}

// The phone's Menu drawer: the destinations that don't fit in the bottom bar.
export function SideMenu({ open, onClose }: Props) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    firstLinkRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden short:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <nav
        id="side-menu"
        aria-label="More"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 border-l border-line bg-surface p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform md:hidden short:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <KingpinMark className="h-6 w-7" />
            <span className="display text-lg">Kingpin</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 grid h-tap w-tap place-items-center rounded-lg text-muted"
          >
            <Icon name="close" />
          </button>
        </div>
        {moreLinks.map((link, i) => (
          <NavLink
            key={link.to}
            to={link.to}
            ref={i === 0 ? firstLinkRef : undefined}
            onClick={onClose}
            className={({ isActive }) => navRowClass(isActive)}
          >
            <Icon name={link.icon} />
            {link.label}
          </NavLink>
        ))}
        <div className="mt-auto border-t border-line pt-3">
          <AccountBlock onNavigate={onClose} />
        </div>
      </nav>
    </>
  )
}
