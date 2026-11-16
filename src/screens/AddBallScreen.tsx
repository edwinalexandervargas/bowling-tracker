import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { parseInches } from '../measure/inches'
import { findSpec } from '../arsenal/specs'
import type { Ball, Layout } from '../types'
import { ballToDraft, emptyBallDraft } from '../arsenal/ballDraft'
import { parseBallWeight } from '../profile/profileFields'
import { Page, Card } from '../components/ui'
import { dangerButton, inputClass, primaryButton, secondaryButton, toggleClass } from '../components/styles'

type System = Layout['system']

// Field labels per system, in the order the driller writes them.
const FIELDS: Record<System, { label: string; placeholder: string; unit: 'in' | 'deg' }[]> = {
  '2ls': [
    { label: 'Pin to PAP', placeholder: '5', unit: 'in' },
    { label: 'PSA to PAP', placeholder: '4', unit: 'in' },
    { label: 'Pin buffer', placeholder: '3', unit: 'in' },
  ],
  'dual-angle': [
    { label: 'Drilling angle', placeholder: '45', unit: 'deg' },
    { label: 'Pin to PAP', placeholder: '4 1/2', unit: 'in' },
    { label: 'VAL angle', placeholder: '30', unit: 'deg' },
  ],
}

function parseAngle(s: string): number | null {
  const n = Number(s.trim().replace(/°$/, ''))
  return s.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 180 ? n : null
}

const optionalNumber = (s: string) => (s.trim() === '' ? undefined : Number(s))

const BACK = { to: '/arsenal', label: 'Arsenal' }

export function AddBallScreen() {
  return <BallForm />
}

export function EditBallScreen() {
  const { ballId } = useParams()
  const ball = useGameStore((s) => s.balls.find((b) => b.id === ballId))
  if (!ball) {
    return (
      <Page title="Ball not found" back={BACK}>
        <Card className="p-6 text-muted">That ball doesn't exist anymore.</Card>
      </Page>
    )
  }
  // key: opening a different ball starts the form fresh
  return <BallForm key={ball.id} ball={ball} />
}

// One form for both jobs. With no `ball` it adds a new one; with a `ball` it
// opens filled in and saves over it.
function BallForm({ ball }: { ball?: Ball }) {
  const ballSpecs = useGameStore((s) => s.ballSpecs)
  const addBallSpec = useGameStore((s) => s.addBallSpec)
  const updateBallSpec = useGameStore((s) => s.updateBallSpec)
  const addBall = useGameStore((s) => s.addBall)
  const updateBall = useGameStore((s) => s.updateBall)
  const removeBall = useGameStore((s) => s.removeBall)
  const defaultWeight = useGameStore((s) => s.profile?.ballWeight ?? 15)
  const navigate = useNavigate()

  // Worked out once, when the form opens
  const [initial] = useState(() =>
    ball ? ballToDraft(ball, ballSpecs.find((s) => s.id === ball.specId)) : emptyBallDraft(defaultWeight),
  )

  // Ball model
  const [brand, setBrand] = useState(initial.brand)
  const [name, setName] = useState(initial.name)
  const [rg, setRg] = useState(initial.rg)
  const [differential, setDifferential] = useState(initial.differential)
  const [massBiasDiff, setMassBiasDiff] = useState(initial.massBiasDiff)
  const [coverstock, setCoverstock] = useState(initial.coverstock)

  // Your copy
  const [nickname, setNickname] = useState(initial.nickname)
  const [weight, setWeight] = useState(initial.weight)
  const [surface, setSurface] = useState(initial.surface)

  // Layout: three raw strings, meaning depends on system
  const [system, setSystem] = useState<System>(initial.system)
  const [layoutValues, setLayoutValues] = useState<string[]>(initial.layoutValues)

  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Brand + name identify a model. If they match a model already saved (other
  // than this ball's own), the ball uses that model's numbers instead of asking again.
  const match = brand && name ? findSpec(ballSpecs, brand, name) : undefined
  const otherModel = match && match.id !== ball?.specId ? match : undefined

  function setLayoutValue(i: number, value: string) {
    setLayoutValues((vals) => vals.map((v, j) => (j === i ? value : v)))
  }

  function buildLayout(): Layout | null {
    const parsed = FIELDS[system].map((f, i) =>
      f.unit === 'in' ? parseInches(layoutValues[i]) : parseAngle(layoutValues[i]),
    )
    if (parsed.some((v) => v === null)) return null
    const [a, b, c] = parsed as number[]
    return system === '2ls'
      ? { system, pinToPap: a, psaToPap: b, pinBuffer: c }
      : { system, drillingAngle: a, pinToPap: b, valAngle: c }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand.trim() || !name.trim()) return setError('Brand and ball name are required.')
    if (!surface.trim()) return setError('Surface is required, e.g. 2000 Abralon.')

    const layout = buildLayout()
    if (!layout) return setError('Layout: inches in 1/16 steps (4 1/2), angles 0-180.')

    const lbs = parseBallWeight(weight)
    if (lbs === null) return setError('Weight: whole pounds, 6-16.')

    const modelFields = {
      brand: brand.trim(),
      name: name.trim(),
      rg: optionalNumber(rg),
      differential: optionalNumber(differential),
      massBiasDiff: optionalNumber(massBiasDiff),
      coverstock: coverstock.trim() || undefined,
    }
    let specId: string
    if (otherModel) {
      specId = otherModel.id
    } else if (ball && ballSpecs.some((s) => s.id === ball.specId)) {
      // Editing this ball's own model changes it for every copy of that ball
      updateBallSpec(ball.specId, modelFields)
      specId = ball.specId
    } else {
      specId = crypto.randomUUID()
      addBallSpec({ id: specId, ...modelFields })
    }

    const copyFields = { specId, nickname: nickname.trim() || undefined, weight: lbs, surface: surface.trim(), layout }
    if (ball) updateBall(ball.id, copyFields)
    else addBall({ id: crypto.randomUUID(), ...copyFields })
    navigate('/arsenal')
  }

  return (
    <Page title={ball ? 'Edit ball' : 'Add ball'} back={BACK}>
    <form onSubmit={handleSubmit} className="space-y-6">

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ball</h2>
        <label className="block">
          <span className="text-sm text-muted">Brand</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Storm" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Phase II" className={inputClass} />
        </label>

        {otherModel ? (
          <p className="text-sm text-muted">
            {ball ? "Already in your specs. This ball will use that model's numbers." : 'Already in your specs. This adds another copy.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-sm text-muted">RG</span>
              <input value={rg} onChange={(e) => setRg(e.target.value)} placeholder="2.48" inputMode="decimal" className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Differential</span>
              <input value={differential} onChange={(e) => setDifferential(e.target.value)} placeholder="0.051" inputMode="decimal" className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Mass bias</span>
              <input value={massBiasDiff} onChange={(e) => setMassBiasDiff(e.target.value)} placeholder="—" inputMode="decimal" className={inputClass} />
            </label>
            <label className="col-span-3 block">
              <span className="text-sm text-muted">Coverstock (optional)</span>
              <input value={coverstock} onChange={(e) => setCoverstock(e.target.value)} className={inputClass} />
            </label>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your copy</h2>
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-2 block">
            <span className="text-sm text-muted">Nickname (optional)</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Phase II #2" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Weight (lbs)</span>
            <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="numeric" className={inputClass} />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-muted">Surface</span>
          <input value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="2000 Abralon" className={inputClass} />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Layout</h2>
        <div className="flex gap-2">
          {(['2ls', 'dual-angle'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={system === s}
              onClick={() => { setSystem(s); setLayoutValues(['', '', '']) }}
              className={toggleClass(system === s)}
            >
              {s === '2ls' ? '2LS' : 'Dual angle'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {FIELDS[system].map((f, i) => (
            <label key={f.label} className="block">
              <span className="text-xs text-muted">
                {f.label} {f.unit === 'deg' ? '(°)' : '(in)'}
              </span>
              <input
                value={layoutValues[i]}
                onChange={(e) => setLayoutValue(i, e.target.value)}
                placeholder={f.placeholder}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <button type="submit" className={`${primaryButton} w-full`}>
        {ball ? 'Save changes' : 'Save ball'}
      </button>
    </form>

    {ball && (
      <section className="space-y-3 border-t border-line pt-6">
        {confirmingDelete ? (
          <div className="space-y-3 rounded-xl bg-surface p-4 ring-1 ring-danger">
            <p role="alert" className="text-sm">Delete this ball? This can't be undone.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  removeBall(ball.id)
                  navigate('/arsenal')
                }}
                className={`${dangerButton} flex-1`}
              >
                Delete ball
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className={`${secondaryButton} flex-1`}>
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} className={`${dangerButton} w-full`}>
            Delete ball
          </button>
        )}
      </section>
    )}
    </Page>
  )
}
