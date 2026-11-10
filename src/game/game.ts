import type { Game, Shot } from '../types'
import { isFrameComplete } from '../scoring/frame'
import { isValidShot } from '../pins/pins'

const FULL_RACK = 1023

export type ShotContext = {
  pinsBefore: number  // mask of pins in play for the next ball
  isFreshRack: boolean // true → first-ball entry (Strike / tap leave)
}

// What the next ball in this frame faces. Used by addShot AND the UI,
// so the rule lives in exactly one place.
export function nextShotContext(game: Game, frameIndex: number): ShotContext {
  const shots = game.frames[frameIndex]?.shots ?? []
  const lastShot = shots[shots.length - 1]

  // No shots yet: full rack
  if (!lastShot) return { pinsBefore: FULL_RACK, isFreshRack: true }

  // 10th frame: rack resets after a strike or spare
  if (frameIndex === 9 && lastShot.pinsAfter === 0) {
    return { pinsBefore: FULL_RACK, isFreshRack: true }
  }

  // Otherwise the next ball faces whatever was left
  return { pinsBefore: lastShot.pinsAfter, isFreshRack: false }
}

export function addShot(
  game: Game,
  frameIndex: number,
  pinsAfter: number,
  ballId?: string
): Game {
  if (frameIndex < 0 || frameIndex > 9) {
    throw new Error(`Invalid frame index: ${frameIndex}`)
  }

  const frame = game.frames[frameIndex] ?? { shots: [], ballId }

  if (isFrameComplete(frame.shots, frameIndex)) {
    throw new Error(`Frame ${frameIndex + 1} is already complete`)
  }

  const { pinsBefore } = nextShotContext(game, frameIndex)

  if (!isValidShot(pinsBefore, pinsAfter)) {
    throw new Error(`Impossible shot: ${pinsAfter} standing after ${pinsBefore}`)
  }

  // Copy every level on the path to the change; never mutate the input
  const shot: Shot = { pinsBefore, pinsAfter }
  const newFrame = { ...frame, shots: [...frame.shots, shot] }
  const newFrames = [...game.frames]
  newFrames[frameIndex] = newFrame

  return { ...game, frames: newFrames }
}