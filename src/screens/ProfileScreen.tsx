import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { parseInches, formatInches } from '../measure/inches'
import { parseBallWeight, parseUsbcNumber } from '../profile/profileFields'
import type { BowlingStyle, Hand } from '../types'

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
      <span className="text-sm text-gray-400">{label}</span>
      <div className="mt-1 flex gap-2">
        {(Object.keys(labels) as T[]).map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(value === opt ? undefined : opt)}
            className={`flex-1 rounded py-2 text-sm ${
              value === opt ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  )
}

const inputClass = 'mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white'
const saveClass = 'w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-500'

export function ProfileScreen() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <PapSection />
      <BowlerInfoSection />
    </div>
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
        <div className="flex items-center justify-between rounded bg-gray-800 px-3 py-3">
          <span>
            {formatInches(profile.papOver!)}" over, {formatInches(Math.abs(up))}" {up < 0 ? 'down' : 'up'}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-blue-400">
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
    updateProfile({ papOver, papUp: direction === 'down' ? -papUp : papUp })
    onDone() // swaps back to the read-only line
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-lg font-semibold">PAP</h2>

      <label className="block">
        <span className="text-sm text-gray-400">Over (inches)</span>
        <input value={over} onChange={(e) => setOver(e.target.value)} placeholder="4 1/2" className={inputClass} />
      </label>

      <div>
        <span className="text-sm text-gray-400">Vertical (inches)</span>
        <div className="mt-1 mb-2 flex gap-2">
          {(['up', 'down'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              aria-pressed={direction === d}
              className={`flex-1 rounded py-1 text-sm capitalize ${
                direction === d ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        {canCancel && (
          <button type="button" onClick={onDone} className="flex-1 rounded bg-gray-700 py-2 font-medium">
            Cancel
          </button>
        )}
        <button type="submit" className={`${saveClass} flex-1`}>
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
        <div className="flex items-start justify-between rounded bg-gray-800 px-3 py-3">
          <dl className="space-y-1">
            <div className="flex gap-2">
              <dt className="text-gray-400">Bowls</dt>
              <dd>
                {[profile?.hand && handLabels[profile.hand], profile?.style && styleLabels[profile.style]]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-400">USBC #</dt>
              <dd>{profile?.usbcNumber ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-400">Ball weight</dt>
              <dd>{profile?.ballWeight !== undefined ? `${profile.ballWeight} lbs` : '—'}</dd>
            </div>
          </dl>
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-blue-400">
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

    updateProfile({ usbcNumber, ballWeight, hand, style })
    onDone() // swaps back to the read-only view
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-lg font-semibold">Bowler info</h2>

      <Segmented label="Hand" labels={handLabels} value={hand} onChange={setHand} />
      <Segmented label="Style" labels={styleLabels} value={style} onChange={setStyle} />

      <label className="block">
        <span className="text-sm text-gray-400">USBC # (optional)</span>
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
        <span className="text-sm text-gray-400">Ball weight (lbs, default for new balls)</span>
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="15"
          inputMode="numeric"
          className={inputClass}
        />
      </label>

      {errors.map((err) => (
        <p key={err} className="text-sm text-red-400">{err}</p>
      ))}

      <div className="flex gap-2">
        {canCancel && (
          <button type="button" onClick={onDone} className="flex-1 rounded bg-gray-700 py-2 font-medium">
            Cancel
          </button>
        )}
        <button type="submit" className={`${saveClass} flex-1`}>
          Save info
        </button>
      </div>
    </form>
  )
}
