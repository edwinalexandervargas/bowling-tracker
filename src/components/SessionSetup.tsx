import { useState, type FormEvent } from 'react'
import { useGameStore } from '../store/gameStore'
import type { SessionType } from '../types'
import { validateSessionDraft, type SessionDraft, type SessionErrors } from '../sessions/validateSession'
import { inputClass, inputErrorClass, primaryButton, toggleClass } from './styles'

const TYPES: { value: SessionType; label: string }[] = [
  { value: 'league', label: 'League' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'practice', label: 'Practice' },
]

const EMPTY: SessionDraft = { type: 'league', eventName: '', patternId: '' }

// Shown on the Score tab when no session is active.
export function SessionSetup() {
  const patterns = useGameStore((s) => s.patterns)
  const startSession = useGameStore((s) => s.startSession)
  const startGame = useGameStore((s) => s.startGame)

  const [draft, setDraft] = useState<SessionDraft>(EMPTY)
  const [errors, setErrors] = useState<SessionErrors>({})

  function setField(key: 'eventName' | 'patternId', value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined })) // clear that field's error on edit
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = validateSessionDraft(draft, patterns.map((p) => p.id))
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    // The validator returns setup fields only; id/date/games are filled here.
    startSession({
      ...result.value,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      games: [],
    })
    startGame()
  }

  const nameOptional = draft.type === 'practice'

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4">
      <h2 className="text-lg font-semibold">New session</h2>

      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={draft.type === t.value}
            onClick={() => {
              setDraft((d) => ({ ...d, type: t.value }))
              setErrors((e) => ({ ...e, eventName: undefined }))
            }}
            className={toggleClass(draft.type === t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-sm text-muted">
          Event name{nameOptional && ' (optional)'}
        </span>
        <input
          value={draft.eventName}
          onChange={(e) => setField('eventName', e.target.value)}
          placeholder={nameOptional ? 'Spare drills' : 'Thursday Night Mixed'}
          className={`${inputClass} ${errors.eventName ? inputErrorClass : ''}`}
        />
        {errors.eventName && <span className="text-xs text-danger">{errors.eventName}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-muted">Pattern</span>
        <select
          value={draft.patternId}
          onChange={(e) => setField('patternId', e.target.value)}
          className={`${inputClass} ${errors.patternId ? inputErrorClass : ''}`}
        >
          <option value="">House shot</option>
          {patterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.length !== undefined && ` (${p.length} ft)`}
            </option>
          ))}
        </select>
        {errors.patternId && <span className="text-xs text-danger">{errors.patternId}</span>}
      </label>

      <button type="submit" className={`${primaryButton} w-full`}>
        Start session
      </button>
    </form>
  )
}
