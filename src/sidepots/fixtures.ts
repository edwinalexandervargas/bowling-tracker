// Test builders for side pots. Not imported by the app, so it never reaches the bundle.
import type { Frame, Game } from '../types'

export const FULL = 1023
export const TEN_PIN = 512
export const s = (pinsBefore: number, pinsAfter: number) => ({ pinsBefore, pinsAfter })

// One frame per token, in bowling order:
//   X = strike   / = spare (9 /)   - = open (9 -)   ? = first ball only (9, waiting on the second)
// A 10th-frame token only holds the balls that decide the mark; tests that care
// about fill balls build that frame by hand.
const TOKENS: Record<string, () => Frame> = {
  'X': () => ({ shots: [s(FULL, 0)] }),
  '/': () => ({ shots: [s(FULL, TEN_PIN), s(TEN_PIN, 0)] }),
  '-': () => ({ shots: [s(FULL, TEN_PIN), s(TEN_PIN, TEN_PIN)] }),
  '?': () => ({ shots: [s(FULL, TEN_PIN)] }),
}

export function frames(marks: string): Frame[] {
  return marks.trim().split(/\s+/).map((token) => {
    const build = TOKENS[token]
    if (!build) throw new Error(`Unknown frame token: ${token}`)
    return build()
  })
}

export const game = (marks: string): Game => ({ id: crypto.randomUUID(), frames: frames(marks) })
export const gameOf = (list: Frame[]): Game => ({ id: crypto.randomUUID(), frames: list })
