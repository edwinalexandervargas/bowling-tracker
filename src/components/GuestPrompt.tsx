import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useGuestStore } from '../guest/guestStore'
import { primaryButton, secondaryButton } from './styles'

// Shown when a guest taps something that would save to an account. The button
// they tapped stays where it is and works for real users; this explains why it
// didn't do anything here. A native modal dialog traps focus and closes on Escape.
export function GuestPrompt() {
  const open = useGuestStore((s) => s.promptOpen)
  const close = useGuestStore((s) => s.closePrompt)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={close}
      aria-labelledby="guest-prompt-title"
      aria-describedby="guest-prompt-detail"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-surface p-6 text-ink ring-1 ring-line backdrop:bg-page/80"
    >
      <h2 id="guest-prompt-title" className="text-lg font-semibold">Create a free account to save this.</h2>
      <p id="guest-prompt-detail" className="mt-2 text-sm text-muted">
        As a guest you can score games and run side pots, but nothing is saved to an account.
      </p>
      <div className="mt-5 flex gap-2">
        <Link to="/login" state={{ mode: 'signup' }} onClick={close} className={`${primaryButton} flex-1`}>Sign up</Link>
        {/* Focused first, so Enter or a stray tap never leaves the page unexpectedly. */}
        <button type="button" autoFocus onClick={close} className={`${secondaryButton} flex-1`}>Keep trying</button>
      </div>
    </dialog>
  )
}
