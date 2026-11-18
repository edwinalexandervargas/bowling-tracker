import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { blockedForGuest } from '../guest/guestStore'
import { parseInches, formatInches } from '../measure/inches'
import { parseBallWeight, parseUsbcNumber } from '../profile/profileFields'
import type { BowlingStyle, Hand } from '../types'
import { Page } from '../components/ui'
import { dangerButton, inputClass, primaryButton, secondaryButton, textButton, toggleClass } from '../components/styles'
import { count } from '../format'

const handLabels: Record<Hand, string> = { left: 'Left', right: 'Right' }
const styleLabels: Record<BowlingStyle, string> = {
  'two-handed': 'Two-handed',
  'one-handed': 'One-handed',
  thumbless: 'Thumbless',
}

// Row of toggle buttons. Tapping the selected option again clears it (fields are optional).
function Segmented<T extends string>({ label, labels, value, onChange }: {
  label: string
  labels: Record<T, string>
  value: T | undefined
  onChange: (v: T | undefined) => void
}) {
  return (
    <div role="group" aria-label={label}>
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1 flex gap-2">
        {(Object.keys(labels) as T[]).map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(value === opt ? undefined : opt)}
            className={toggleClass(value === opt)}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ProfileScreen() {
  return (
    <Page title="Profile" wide>
      {/* Two columns from 1024px; stacked below that. */}
      <div className="grid max-w-md gap-8 lg:max-w-none lg:grid-cols-2 lg:items-start">
        <PapSection />
        <BowlerInfoSection />
      </div>
      <DataSection />
    </Page>
  )
}

// Reset: wipe every night so stats start again from zero.
// It deletes for good, so it takes two taps: the button, then a confirm.
function DataSection() {
  const nights = useGameStore((s) => s.sessions.length)
  const resetNights = useGameStore((s) => s.resetNights)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <section className="max-w-md space-y-3 border-t border-line pt-6">
      <h2 className="text-lg font-semibold">Reset nights and scores</h2>
      <p className="text-sm text-muted">
        Deletes every night and its games, so your stats start again from zero. Your arsenal, patterns and profile stay.
        If you're signed in, the backed-up copies are deleted too.
      </p>

      {done && <p role="status" className="text-sm">Nights and scores cleared.</p>}

      {nights === 0 ? (
        !done && <p className="text-sm text-muted">There are no nights saved.</p>
      ) : confirming ? (
        <div className="space-y-3 rounded-xl bg-surface p-4 ring-1 ring-danger">
          <p role="alert" className="text-sm">Delete {count(nights, 'night')}? This can't be undone.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (blockedForGuest()) return
                resetNights()
                setConfirming(false)
                setDone(true)
              }}
              className={`${dangerButton} flex-1`}
            >
              Delete {count(nights, 'night')}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={`${secondaryButton} flex-1`}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setConfirming(true)
            setDone(false)
          }}
          className={dangerButton}
        >
          Reset nights and scores
        </button>
      )}
    </section>
  )
}

function PapSection() {
  const profile = useGameStore((s) => s.profile)
  const hasPap = profile?.papOver !== undefined && profile?.papUp !== undefined
  const [editing, setEditing] = useState(false)

  if (hasPap && !editing) {
    const up = profile.papUp!
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">PAP</h2>
        <div className="flex items-center justify-between rounded-xl bg-surface py-1 pr-1 pl-4 ring-1 ring-line">
          <span>
            {formatInches(profile.papOver!)}" over, {formatInches(Math.abs(up))}" {up < 0 ? 'down' : 'up'}
          </span>
          <button type="button" onClick={() => setEditing(true)} className={textButton}>
            Edit
          </button>
        </div>
      </section>
    )
  }

  // key resets the form's state each time editing starts
  return <PapForm key={String(editing)} onDone={() => setEditing(false)} canCancel={hasPap} />
}

function PapForm({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const profile = useGameStore((s) => s.profile)
  const updateProfile = useGameStore((s) => s.updateProfile)

  // Text inputs hold what the user types; we only parse on save.
  const [over, setOver] = useState(profile?.papOver !== undefined ? formatInches(profile.papOver) : '')
  // Vertical is stored signed: positive = up, negative = down. The input holds the size only.
  const [up, setUp] = useState(profile?.papUp !== undefined ? formatInches(Math.abs(profile.papUp)) : '')
  const [direction, setDirection] = useState<'up' | 'down'>(
    profile?.papUp !== undefined && profile.papUp < 0 ? 'down' : 'up',
  )
  const [error, setError] = useState<string | null>(null)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const papOver = parseInches(over)
    const papUp = parseInches(up)
    if (papOver === null || papUp === null) {
      setError('Use inches in 1/16 steps, like 4 1/2 or 5/8.')
      return
    }
    if (blockedForGuest()) return
    updateProfile({ papOver, papUp: direction === 'down' ? -papUp : papUp })
    onDone() // swaps back to the read-only line
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-lg font-semibold">PAP</h2>

      <label className="block">
        <span className="text-sm text-muted">Over (inches)</span>
        <input value={over} onChange={(e) => setOver(e.target.value)} placeholder="4 1/2" className={inputClass} />
      </label>

      <div>
        <span className="text-sm text-muted">Vertical (inches)</span>
        <div className="mt-1 mb-2 flex gap-2">
          {(['up', 'down'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              aria-pressed={direction === d}
              className={`${toggleClass(direction === d)} capitalize`}
            >
              {d}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="sr-only">Vertical distance</span>
          <input value={up} onChange={(e) => setUp(e.target.value)} placeholder="5/8" className={inputClass} />
        </label>
      </div>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        {canCancel && (
          <button type="button" onClick={onDone} className={`${secondaryButton} flex-1`}>
            Cancel
          </button>
        )}
        <button type="submit" className={`${primaryButton} flex-1`}>
          Save PAP
        </button>
      </div>
    </form>
  )
}

function BowlerInfoSection() {
  const profile = useGameStore((s) => s.profile)
  const hasInfo =
    profile?.usbcNumber !== undefined ||
    profile?.ballWeight !== undefined ||
    profile?.hand !== undefined ||
    profile?.style !== undefined
  const [editing, setEditing] = useState(false)

  if (hasInfo && !editing) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">Bowler info</h2>
        <div className="flex items-start justify-between rounded-xl bg-surface py-1 pr-1 pl-4 ring-1 ring-line">
          <dl className="space-y-1 py-2">
            <div className="flex gap-2">
              <dt className="text-muted">Bowls</dt>
              <dd>
                {[profile?.hand && handLabels[profile.hand], profile?.style && styleLabels[profile.style]]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">USBC #</dt>
              <dd>{profile?.usbcNumber ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Ball weight</dt>
              <dd>{profile?.ballWeight !== undefined ? `${profile.ballWeight} lbs` : '—'}</dd>
            </div>
          </dl>
          <button type="button" onClick={() => setEditing(true)} className={textButton}>
            Edit
          </button>
        </div>
      </section>
    )
  }

  return <BowlerInfoForm key={String(editing)} onDone={() => setEditing(false)} canCancel={hasInfo} />
}

function BowlerInfoForm({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const profile = useGameStore((s) => s.profile)
  const updateProfile = useGameStore((s) => s.updateProfile)

  const [usbc, setUsbc] = useState(profile?.usbcNumber ?? '')
  const [weight, setWeight] = useState(profile?.ballWeight !== undefined ? String(profile.ballWeight) : '')
  const [hand, setHand] = useState(profile?.hand)
  const [style, setStyle] = useState(profile?.style)
  const [errors, setErrors] = useState<string[]>([])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const usbcNumber = parseUsbcNumber(usbc)
    const ballWeight = weight.trim() === '' ? undefined : parseBallWeight(weight)

    // Collect every error instead of stopping at the first
    const found: string[] = []
    if (usbcNumber === null) found.push('USBC #: digits and dashes only, like 1234-56789.')
    if (ballWeight === null) found.push('Ball weight: whole pounds, 6-16.')
    setErrors(found)
    if (usbcNumber === null || ballWeight === null) return
    if (blockedForGuest()) return

    updateProfile({ usbcNumber, ballWeight, hand, style })
    onDone() // swaps back to the read-only view
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-lg font-semibold">Bowler info</h2>

      <Segmented label="Hand" labels={handLabels} value={hand} onChange={setHand} />
      <Segmented label="Style" labels={styleLabels} value={style} onChange={setStyle} />

      <label className="block">
        <span className="text-sm text-muted">USBC # (optional)</span>
        <input
          value={usbc}
          onChange={(e) => setUsbc(e.target.value)}
          placeholder="1234-56789"
          inputMode="numeric"
          autoComplete="off"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Ball weight (lbs, default for new balls)</span>
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="15"
          inputMode="numeric"
          className={inputClass}
        />
      </label>

      {errors.map((err) => (
        <p key={err} role="alert" className="text-sm text-danger">{err}</p>
      ))}

      <div className="flex gap-2">
        {canCancel && (
          <button type="button" onClick={onDone} className={`${secondaryButton} flex-1`}>
            Cancel
          </button>
        )}
        <button type="submit" className={`${primaryButton} flex-1`}>
          Save info
        </button>
      </div>
    </form>
  )
}
