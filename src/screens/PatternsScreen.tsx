import { useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  validatePatternDraft,
  patternToDraft,
  formatRatio,
  type PatternDraft,
  type PatternErrors,
} from '../patterns/validatePattern'
import type { Pattern } from '../types'
import { Page, Card } from '../components/ui'
import { Icon } from '../components/Icon'
import { dangerButton, inputClass, inputErrorClass, primaryButton, secondaryButton, toggleClass } from '../components/styles'

const EMPTY: PatternDraft = { kind: 'sport', name: '', length: '', ratio: '', volume: '', notes: '' }

const FIELDS: { key: Exclude<keyof PatternDraft, 'kind'>; label: string; placeholder: string; inputMode?: 'decimal' }[] = [
  { key: 'name', label: 'Name', placeholder: 'Kegel Middle Road' },
  { key: 'length', label: 'Length (ft)', placeholder: '41', inputMode: 'decimal' },
  { key: 'ratio', label: 'Ratio (X:1)', placeholder: '3.2', inputMode: 'decimal' },
  { key: 'volume', label: 'Volume (mL)', placeholder: '24.5', inputMode: 'decimal' },
  { key: 'notes', label: 'Notes', placeholder: 'house shot' },
]

// One form for adding and editing. Tapping a pattern in the list loads it into
// the form; saving then replaces that pattern instead of adding a new one.
export function PatternsScreen() {
  const patterns = useGameStore((s) => s.patterns)
  const addPattern = useGameStore((s) => s.addPattern)
  const updatePattern = useGameStore((s) => s.updatePattern)
  const removePattern = useGameStore((s) => s.removePattern)

  const [draft, setDraft] = useState<PatternDraft>(EMPTY)
  const [errors, setErrors] = useState<PatternErrors>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // If the pattern being edited was deleted on another device, fall back to adding
  const editing = patterns.find((p) => p.id === editingId)

  function setField(key: Exclude<keyof PatternDraft, 'kind'>, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined })) // clear that field's error as you fix it
  }

  function startAdding() {
    setEditingId(null)
    setDraft(EMPTY)
    setErrors({})
    setConfirmingDelete(false)
  }

  function startEditing(pattern: Pattern) {
    setEditingId(pattern.id)
    setDraft(patternToDraft(pattern))
    setErrors({})
    setConfirmingDelete(false)
    // On a phone the form is above the list, so bring it into view and move focus to it
    headingRef.current?.scrollIntoView({ block: 'start' })
    headingRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validatePatternDraft(draft)
    if (!result.ok) return setErrors(result.errors)

    if (editing) updatePattern({ id: editing.id, ...result.value })
    else addPattern({ id: crypto.randomUUID(), ...result.value })
    startAdding()
  }

  return (
    <Page title="Patterns" wide>
      {/* Form and list sit side by side from 1024px; stacked below that. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-4 text-lg font-semibold outline-none">
          {editing ? `Edit ${editing.name}` : 'Add a pattern'}
        </h2>
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

        {editing ? (
          <>
            <div className="flex gap-2">
              <button type="submit" className={`${primaryButton} flex-1`}>Save changes</button>
              <button type="button" onClick={startAdding} className={`${secondaryButton} flex-1`}>Cancel</button>
            </div>
            {confirmingDelete ? (
              <div className="space-y-3 rounded-xl bg-surface p-4 ring-1 ring-danger">
                <p role="alert" className="text-sm">
                  Delete {editing.name}? Nights bowled on it stay and count as house shot. This can't be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      removePattern(editing.id)
                      startAdding()
                    }}
                    className={`${dangerButton} flex-1`}
                  >
                    Delete pattern
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className={`${secondaryButton} flex-1`}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className={`${dangerButton} w-full`}>
                Delete pattern
              </button>
            )}
          </>
        ) : (
          <button type="submit" className={`${primaryButton} w-full`}>
            Add pattern
          </button>
        )}
      </form>

      {patterns.length === 0 ? (
        <Card className="p-6 text-muted">No patterns yet. House shot is always available without adding one.</Card>
      ) : (
        <ul className="space-y-2">
          {patterns.map((p) => (
            <li key={p.id}>
              {/* The whole card is the button. The one being edited is outlined. */}
              <button
                type="button"
                onClick={() => startEditing(p)}
                aria-current={p.id === editing?.id ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl bg-surface p-4 text-left transition active:bg-raised ${
                  p.id === editing?.id ? 'ring-2 ring-accent' : 'ring-1 ring-line'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {p.name}
                    {p.kind === 'house' && <span className="ml-2 text-xs text-muted">House</span>}
                  </span>
                  <span className="num block text-lg">
                    {[
                      p.length !== undefined && `${p.length} ft`,
                      p.ratio !== undefined && formatRatio(p.ratio),
                      p.volume !== undefined && `${p.volume} mL`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {p.notes && <span className="block text-sm text-muted">{p.notes}</span>}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-accent">
                  {p.id === editing?.id ? 'Editing' : 'Edit'}
                  <Icon name="back" className="h-4 w-4 rotate-180" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
    </Page>
  )
}
