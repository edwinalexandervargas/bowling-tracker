import type { Ball, BallSpec, Layout } from '../types'
import { formatInches } from '../measure/inches'

// The ball form's fields, as text, exactly as typed.
export type BallDraft = {
  // the model: shared by every copy of this ball
  brand: string
  name: string
  rg: string
  differential: string
  massBiasDiff: string
  coverstock: string
  // this copy
  nickname: string
  weight: string
  surface: string
  system: Layout['system']
  layoutValues: [string, string, string]   // in the order the driller writes them
}

export function emptyBallDraft(defaultWeight: number): BallDraft {
  return {
    brand: '', name: '', rg: '', differential: '', massBiasDiff: '', coverstock: '',
    nickname: '', weight: String(defaultWeight), surface: '',
    system: '2ls', layoutValues: ['', '', ''],
  }
}

const text = (value: number | string | undefined) => (value === undefined ? '' : String(value))

// A saved ball back into form fields, for editing. Inches are written as
// fractions again ("4 1/2"), the way they were entered.
export function ballToDraft(ball: Ball, spec: BallSpec | undefined): BallDraft {
  const { layout } = ball
  return {
    brand: spec?.brand ?? '',
    name: spec?.name ?? '',
    rg: text(spec?.rg),
    differential: text(spec?.differential),
    massBiasDiff: text(spec?.massBiasDiff),
    coverstock: spec?.coverstock ?? '',
    nickname: ball.nickname ?? '',
    weight: text(ball.weight),
    surface: ball.surface,
    system: layout.system,
    layoutValues:
      layout.system === '2ls'
        ? [formatInches(layout.pinToPap), formatInches(layout.psaToPap), formatInches(layout.pinBuffer)]
        : [String(layout.drillingAngle), formatInches(layout.pinToPap), String(layout.valAngle)],
  }
}
