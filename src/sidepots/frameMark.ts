import type { Frame } from '../types'
import { isFrameComplete } from '../scoring/frame'

export type FrameMark = 'strike' | 'spare' | 'open' | 'pending'

// The mark a frame earns on the scoresheet, judged on its first rack only.
//
// isFrameComplete is called with index 0 on purpose: it asks "is the first rack
// settled?" by frame 1-9 rules, whichever frame this is. That makes the 10th
// need no special case. A first-ball strike there is a strike before the fill
// balls are thrown, and the mark only ever reads balls 1 and 2, so nothing the
// fill balls do can change it.
export function frameMark(frame: Frame | undefined): FrameMark {
  const shots = frame?.shots ?? []
  if (!isFrameComplete(shots, 0)) return 'pending'

  if (shots[0].pinsAfter === 0) return 'strike'
  return shots[1].pinsAfter === 0 ? 'spare' : 'open'
}
