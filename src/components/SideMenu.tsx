import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { menuLinks } from './menuLinks'

type Props = {
  open: boolean
  onClose: () => void
}

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

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <nav
        id="side-menu"
        aria-label="More"
        inert={!open}
        className={`fixed inset-y-0 right-0 w-64 bg-gray-800 border-l border-gray-700 p-4 flex flex-col gap-1 transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Menu</span>
          <button type="button" onClick={onClose} aria-label="Close menu" className="px-2 py-1 text-gray-400">
            ✕
          </button>
        </div>
        {menuLinks.map((link, i) => (
          <NavLink
            key={link.to}
            to={link.to}
            ref={i === 0 ? firstLinkRef : undefined}
            onClick={onClose}
            className={({ isActive }) =>
              `rounded px-3 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
