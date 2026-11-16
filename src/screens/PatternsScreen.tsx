import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  validatePatternDraft,
  formatRatio,
  type PatternDraft,
  type PatternErrors,
} from '../patterns/validatePattern'
import { Page, Card } from '../components/ui'
import { inputClass, inputErrorClass, primaryButton, toggleClass } from '../components/styles'

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
    <Page title="Patterns" wide>
      {/* Form and list sit side by side from 1024px; stacked below that. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          {(['house', 'sport'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={draft.kind === k}
              onClick={() => {
                setDraft((d) => ({ ...d, kind: k }))
                setErrors((e) => ({ ...e, length: undefined }))
              }}
              className={toggleClass(draft.kind === k)}
            >
              {k === 'house' ? 'House shot' : 'Sport / named'}
            </button>
          ))}
        </div>
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm text-muted">
              {f.label}
              {draft.kind === 'house' && f.key !== 'name' && ' (optional)'}
            </span>
            <input
              value={draft[f.key]}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              inputMode={f.inputMode}
              className={`${inputClass} ${errors[f.key] ? inputErrorClass : ''}`}
            />
            {errors[f.key] && <span className="text-xs text-danger">{errors[f.key]}</span>}
          </label>
        ))}
        <button type="submit" className={`${primaryButton} w-full`}>
          Add pattern
        </button>
      </form>

      {patterns.length === 0 ? (
        <Card className="p-6 text-muted">No patterns yet. House shot is always available without adding one.</Card>
      ) : (
        <ul className="space-y-2">
          {patterns.map((p) => (
            <li key={p.id} className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="font-medium">
                {p.name}
                {p.kind === 'house' && <span className="ml-2 text-xs text-muted">House</span>}
              </p>
              <p className="num text-lg">
                {[
                  p.length !== undefined && `${p.length} ft`,
                  p.ratio !== undefined && formatRatio(p.ratio),
                  p.volume !== undefined && `${p.volume} mL`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {p.notes && <p className="text-sm text-muted">{p.notes}</p>}
            </li>
          ))}
        </ul>
      )}
      </div>
    </Page>
  )
}
