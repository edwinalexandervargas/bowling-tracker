import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { parseInches } from '../measure/inches'
import { findSpec } from '../arsenal/specs'
import type { Layout } from '../types'

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

const inputClass = 'mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white'

export function AddBallScreen() {
  const ballSpecs = useGameStore((s) => s.ballSpecs)
  const addBallSpec = useGameStore((s) => s.addBallSpec)
  const addBall = useGameStore((s) => s.addBall)
  const navigate = useNavigate()

  // Ball model
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [rg, setRg] = useState('')
  const [differential, setDifferential] = useState('')
  const [massBiasDiff, setMassBiasDiff] = useState('')
  const [coverstock, setCoverstock] = useState('')

  // Your copy
  const [nickname, setNickname] = useState('')
  const [weight, setWeight] = useState('15')
  const [surface, setSurface] = useState('')

  // Layout: three raw strings, meaning depends on system
  const [system, setSystem] = useState<System>('2ls')
  const [layoutValues, setLayoutValues] = useState(['', '', ''])

  const [error, setError] = useState<string | null>(null)

  // Show an existing spec's numbers instead of asking again
  const existing = brand && name ? findSpec(ballSpecs, brand, name) : undefined

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

    const lbs = Number(weight)
    if (!Number.isInteger(lbs) || lbs < 6 || lbs > 16) return setError('Weight: whole pounds, 6-16.')

    let spec = existing
    if (!spec) {
      spec = {
        id: crypto.randomUUID(),
        brand: brand.trim(),
        name: name.trim(),
        rg: optionalNumber(rg),
        differential: optionalNumber(differential),
        massBiasDiff: optionalNumber(massBiasDiff),
        coverstock: coverstock.trim() || undefined,
      }
      addBallSpec(spec)
    }

    addBall({
      id: crypto.randomUUID(),
      specId: spec.id,
      nickname: nickname.trim() || undefined,
      weight: lbs,
      surface: surface.trim(),
      layout,
    })
    navigate('/arsenal')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Add ball</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ball</h2>
        <label className="block">
          <span className="text-sm text-gray-400">Brand</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Storm" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Phase II" className={inputClass} />
        </label>

        {existing ? (
          <p className="text-sm text-gray-400">Already in your specs — this adds another copy.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-sm text-gray-400">RG</span>
              <input value={rg} onChange={(e) => setRg(e.target.value)} placeholder="2.48" inputMode="decimal" className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Diff</span>
              <input value={differential} onChange={(e) => setDifferential(e.target.value)} placeholder="0.051" inputMode="decimal" className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">MB diff</span>
              <input value={massBiasDiff} onChange={(e) => setMassBiasDiff(e.target.value)} placeholder="—" inputMode="decimal" className={inputClass} />
            </label>
            <label className="col-span-3 block">
              <span className="text-sm text-gray-400">Coverstock (optional)</span>
              <input value={coverstock} onChange={(e) => setCoverstock(e.target.value)} className={inputClass} />
            </label>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your copy</h2>
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-2 block">
            <span className="text-sm text-gray-400">Nickname (optional)</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Phase II #2" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Weight (lbs)</span>
            <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="numeric" className={inputClass} />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-gray-400">Surface</span>
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
              onClick={() => { setSystem(s); setLayoutValues(['', '', '']) }}
              className={`flex-1 rounded py-1 text-sm ${
                system === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {s === '2ls' ? '2LS' : 'Dual angle'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {FIELDS[system].map((f, i) => (
            <label key={f.label} className="block">
              <span className="text-xs text-gray-400">
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" className="w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-500">
        Save ball
      </button>
    </form>
  )
}
