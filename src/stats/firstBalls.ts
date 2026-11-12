import type { Game } from '../types'

const FULL_RACK = 0b1111111111 // 1023: all 10 pins standing

// One entry per first ball thrown at a fresh rack. This includes 10th-frame
// fill balls after a strike or spare, so a perfect game has 12 entries.
export type FirstBall = {
  frameIndex: number
  leave: number           // pins standing after the shot (0 = strike)
  converted?: boolean     // leave picked up? undefined for strikes, or if the second ball isn't thrown yet
}

export function firstBalls(game: Game): FirstBall[] {
  const result: FirstBall[] = []

  game.frames.forEach((frame, frameIndex) => {
    frame.shots.forEach((shot, i) => {
      if (shot.pinsBefore !== FULL_RACK) return // not a fresh rack: a spare attempt

      const entry: FirstBall = { frameIndex, leave: shot.pinsAfter }
      const next = frame.shots[i + 1]
      // A spare attempt is the next shot in the same frame at this leave.
      if (shot.pinsAfter !== 0 && next) entry.converted = next.pinsAfter === 0
      result.push(entry)
    })
  })

  return result
}
