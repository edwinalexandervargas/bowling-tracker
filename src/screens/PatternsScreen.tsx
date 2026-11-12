import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  validatePatternDraft,
  formatRatio,
  type PatternDraft,
  type PatternErrors,
} from '../patterns/validatePattern'

const EMPTY: PatternDraft = { kind: 'sport', name: '', length: '', ratio: '', volume: '', notes: '' }

const FIELDS: { key: Exclude<keyof PatternDraft, 'kind'>; label: string; placeholder: string; inputMode?: 'decimal' }[] = [
  { key: 'name', label: 'Name', placeholder: 'Kegel Middle Road' },
  { key: 'length', label: 'Length (ft)', placeholder: '41', inputMode: 'decimal' },
  { key: 'ratio', label: 'Ratio (X:1)', placeholder: '3.2', inputMode: 'decimal' },
  { key: 'volume', label: 'Volume (mL)', placeholder: '24.5', inputMode: 'decimal' },
  { key: 'notes', label: 'Notes', placeholder: 'house shot' },
]

export function PatternsScreen() {
  const patterns = useGameStore((s) => s.patterns)
  const addPattern = useGameStore((s) => s.addPattern)

  const [draft, setDraft] = useState<PatternDraft>(EMPTY)
  const [errors, setErrors] = useState<PatternErrors>({})

  function setField(key: Exclude<keyof PatternDraft, 'kind'>, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined })) // clear that field's error as you fix it
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validatePatternDraft(draft)
    if (!result.ok) return setErrors(result.errors)

    addPattern({ id: crypto.randomUUID(), ...result.value })
    setDraft(EMPTY)
    setErrors({})
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Patterns</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          {(['house', 'sport'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setDraft((d) => ({ ...d, kind: k }))
                setErrors((e) => ({ ...e, length: undefined }))
              }}
              className={`flex-1 rounded py-1 text-sm ${
                draft.kind === k ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {k === 'house' ? 'House shot' : 'Sport / named'}
            </button>
          ))}
        </div>
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm text-gray-400">
              {f.label}
              {draft.kind === 'house' && f.key !== 'name' && ' (optional)'}
            </span>
            <input
              value={draft[f.key]}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              inputMode={f.inputMode}
              className={`mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white ${
                errors[f.key] ? 'ring-1 ring-red-400' : ''
              }`}
            />
            {errors[f.key] && <span className="text-xs text-red-400">{errors[f.key]}</span>}
          </label>
        ))}
        <button type="submit" className="w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-500">
          Add pattern
        </button>
      </form>

      {patterns.length === 0 ? (
        <p className="text-gray-400">No patterns yet.</p>
      ) : (
        <ul className="space-y-2">
          {patterns.map((p) => (
            <li key={p.id} className="rounded bg-gray-800 p-3">
              <p className="font-medium">
                {p.name}
                {p.kind === 'house' && <span className="ml-2 text-xs text-gray-400">House</span>}
              </p>
              <p className="text-sm text-gray-300">
                {[
                  p.length !== undefined && `${p.length} ft`,
                  p.ratio !== undefined && formatRatio(p.ratio),
                  p.volume !== undefined && `${p.volume} mL`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {p.notes && <p className="text-sm text-gray-400">{p.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
