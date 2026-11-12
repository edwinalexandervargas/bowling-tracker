import type { Session, SessionType } from '../types'

// Raw form values. patternId '' means "house shot" (no pattern picked).
export type SessionDraft = {
  type: SessionType
  eventName: string
  patternId: string
}

export type SessionErrors = Partial<Record<'eventName' | 'patternId', string>>

// Session without id/date/games: the caller fills those in when starting.
type Setup<S> = S extends Session ? Omit<S, 'id' | 'date' | 'games'> : never
export type ValidSession = Setup<Session>

export type SessionValidationResult =
  | { ok: true; value: ValidSession }
  | { ok: false; errors: SessionErrors }

export function validateSessionDraft(
  draft: SessionDraft,
  knownPatternIds: readonly string[],
): SessionValidationResult {
  const errors: SessionErrors = {}

  const eventName = draft.eventName.trim()
  if (!eventName && draft.type !== 'practice') {
    errors.eventName = `Event name is required for ${draft.type}.`
  }

  // Blank = house shot. A non-blank id must point at a saved pattern.
  const patternId = draft.patternId.trim() || undefined
  if (patternId && !knownPatternIds.includes(patternId)) {
    errors.patternId = 'That pattern no longer exists.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  if (draft.type === 'practice') {
    return {
      ok: true,
      value: { type: 'practice', ...(eventName && { eventName }), ...(patternId && { patternId }) },
    }
  }
  return {
    ok: true,
    value: { type: draft.type, eventName, ...(patternId && { patternId }) },
  }
}
