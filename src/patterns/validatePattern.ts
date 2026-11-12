import type { Pattern } from '../types'

// Raw strings, exactly as typed in the form or read from a CSV row.
export type PatternDraft = {
  kind: 'house' | 'sport'
  name: string
  length: string
  ratio: string
  volume: string
  notes: string
}

type Field = Exclude<keyof PatternDraft, 'kind'>
export type PatternErrors = Partial<Record<Field, string>>

// Pattern without an id: the caller decides the id (new pattern vs. import).
// Omit distributes poorly over intersections with unions, so spell both branches out.
export type ValidPattern =
  | Omit<Extract<Pattern, { kind: 'house' }>, 'id'>
  | Omit<Extract<Pattern, { kind: 'sport' }>, 'id'>

export type ValidationResult =
  | { ok: true; value: ValidPattern }
  | { ok: false; errors: PatternErrors }

// '' -> undefined (optional field left blank); bad number -> NaN
function toNumber(s: string): number | undefined {
  const t = s.trim()
  return t === '' ? undefined : Number(t)
}

export function validatePatternDraft(draft: PatternDraft): ValidationResult {
  const errors: PatternErrors = {}

  const name = draft.name.trim()
  if (!name) errors.name = 'Name is required.'

  // Length is required for sport patterns, optional for a house shot
  const length = toNumber(draft.length)
  if (length === undefined) {
    if (draft.kind === 'sport') errors.length = 'Length in feet is required.'
  } else if (Number.isNaN(length)) errors.length = 'Length must be a number of feet.'
  else if (length < 20 || length > 70) errors.length = 'Length should be 20-70 ft.'

  const ratio = toNumber(draft.ratio.replace(/:\s*1\s*$/, ''))
  if (ratio !== undefined && (Number.isNaN(ratio) || ratio < 1)) {
    errors.ratio = 'Ratio is the X in X:1, at least 1.'
  }

  const volume = toNumber(draft.volume)
  if (volume !== undefined && (Number.isNaN(volume) || volume <= 0)) {
    errors.volume = 'Volume is total oil in mL, above 0.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const notes = draft.notes.trim()
  const common = {
    name,
    ...(ratio !== undefined && { ratio }),
    ...(volume !== undefined && { volume }),
    ...(notes && { notes }),
  }
  return {
    ok: true,
    value:
      draft.kind === 'sport'
        ? { kind: 'sport', length: length!, ...common }
        : { kind: 'house', ...(length !== undefined && { length }), ...common },
  }
}

export const formatRatio = (ratio: number) => `${ratio}:1`
