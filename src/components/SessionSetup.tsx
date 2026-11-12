import { useState, type FormEvent } from 'react'
import { useGameStore } from '../store/gameStore'
import type { SessionType } from '../types'
import { validateSessionDraft, type SessionDraft, type SessionErrors } from '../sessions/validateSession'

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
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">New session</h1>

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
            className={`flex-1 rounded py-2 text-sm ${
              draft.type === t.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-sm text-gray-400">
          Event name{nameOptional && ' (optional)'}
        </span>
        <input
          value={draft.eventName}
          onChange={(e) => setField('eventName', e.target.value)}
          placeholder={nameOptional ? 'e.g. Spare drills' : 'e.g. Thursday Night Mixed'}
          className={`mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white ${
            errors.eventName ? 'ring-1 ring-red-500' : ''
          }`}
        />
        {errors.eventName && <span className="text-xs text-red-400">{errors.eventName}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-gray-400">Pattern</span>
        <select
          value={draft.patternId}
          onChange={(e) => setField('patternId', e.target.value)}
          className={`mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white ${
            errors.patternId ? 'ring-1 ring-red-500' : ''
          }`}
        >
          <option value="">House shot</option>
          {patterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.length !== undefined && ` (${p.length} ft)`}
            </option>
          ))}
        </select>
        {errors.patternId && <span className="text-xs text-red-400">{errors.patternId}</span>}
      </label>

      <button type="submit" className="w-full rounded bg-blue-600 py-3 font-bold hover:bg-blue-500">
        Start session
      </button>
    </form>
  )
}
