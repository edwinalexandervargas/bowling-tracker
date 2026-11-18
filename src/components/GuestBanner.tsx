import { Link } from 'react-router'
import { useGuestStore } from '../guest/guestStore'
import { textButton } from './styles'

// A slim line at the top of every screen in guest mode, so it's never a
// surprise that nothing is being saved.
export function GuestBanner() {
  const guest = useGuestStore((s) => s.active)
  if (!guest) return null

  return (
    <aside aria-label="Guest mode" className="mb-4 flex items-center gap-3 rounded-lg bg-raised py-1 pr-1 pl-3 text-sm ring-1 ring-line md:mb-6 short:mb-2">
      <p className="min-w-0 flex-1">You're trying it as a guest. Sign up to save your games.</p>
      <Link to="/login" state={{ mode: 'signup' }} className={`${textButton} shrink-0`}>Sign up</Link>
    </aside>
  )
}
