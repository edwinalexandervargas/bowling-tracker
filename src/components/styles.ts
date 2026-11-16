// Shared class strings, so every form and button is styled in one place.

// 16px text stops iOS Safari zooming the page when an input gets focus.
export const inputClass =
  'mt-1 block w-full min-h-tap rounded-lg bg-raised px-3 text-base text-ink ring-1 ring-line outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-accent'

export const inputErrorClass = 'ring-2 ring-danger'

export const labelClass = 'text-sm text-muted'

const button = 'inline-flex min-h-tap items-center justify-center rounded-lg px-4 font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100'

export const primaryButton = `${button} bg-accent text-on-accent hover:bg-accent-strong`
export const secondaryButton = `${button} bg-raised text-ink ring-1 ring-line`
export const dangerButton = `${button} text-danger ring-1 ring-danger`

// Small text action ("Edit", "See all"): padded out to a 44px target.
export const textButton = 'inline-flex min-h-tap items-center px-2 text-sm font-medium text-accent'
// The same, for actions that should stay in the background ("Undo last shot").
export const quietTextButton = 'inline-flex min-h-tap items-center px-2 text-sm font-medium text-muted underline underline-offset-4'

// One option in a row of toggles. Selected is filled, unselected is outlined,
// so the state shows without relying on colour.
export const toggleClass = (selected: boolean) =>
  `flex-1 min-h-tap rounded-lg px-2 text-sm font-medium ${
    selected ? 'bg-accent text-on-accent' : 'bg-surface text-muted ring-1 ring-line'
  }`

// A row in the side navigation or the menu drawer.
export const navRowClass = (active: boolean) =>
  `flex min-h-tap items-center gap-3 rounded-lg px-3 text-sm font-medium ${
    active ? 'bg-raised text-ink ring-1 ring-line' : 'text-muted hover:text-ink'
  }`
