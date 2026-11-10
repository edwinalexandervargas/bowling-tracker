import type { Shot } from '../types'

export function isFrameComplete(shots: Shot[], frameIndex: number): boolean {
  // No shots taken yet
  if (shots.length === 0) return false

  const isTenth = frameIndex === 9

  if (!isTenth) {
    // Strike: one shot, all pins down
    if (shots.length === 1 && shots[0].pinsAfter === 0) return true

    // Two shots always completes frames 1-9 (spare or open)
    if (shots.length >= 2) return true

    // Only one non-strike shot: waiting for the second ball
    return false
  }

  // 10th frame: 3 shots is always done (max possible)
  if (shots.length >= 3) return true

  // 10th frame with 2 shots:
  // Only done if the first ball wasn't a strike AND the second left pins standing (open)
  // A first-ball strike earns 2 bonus shots, so you always get a third
  // A spare (second ball clears) also earns a bonus shot
  if (shots.length === 2 && shots[0].pinsAfter !== 0 && shots[1].pinsAfter > 0) return true

  // Waiting for more shots
  return false
}