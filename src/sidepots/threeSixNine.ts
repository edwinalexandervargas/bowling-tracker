import type { Game } from '../types'
import type { PotStatus } from './bingo'

// 3-6-9 side pot: frames 3, 6 and 9 of game 2 must all be strikes.
// Derived from the games; nothing is stored.

const GAME_INDEX = 1
const FRAME_INDEXES = [2, 5, 8]

// lit    = struck, and the pot was still alive when it was bowled
// miss   = the frame that killed the pot (anything but a strike)
// dead   = comes after the miss: never lights, even on a strike
// target = not bowled yet, pot still alive
export type ThreeSixNineDisplay = 'lit' | 'miss' | 'dead' | 'target'

export type ThreeSixNineSquare = {
  gameIndex: number
  frameIndex: number
  display: ThreeSixNineDisplay
}

export type ThreeSixNine = {
  squares: ThreeSixNineSquare[]
  status: PotStatus
}

export function threeSixNine(games: Game[]): ThreeSixNine {
  const frames = games[GAME_INDEX]?.frames ?? []
  let killed = false

  const squares = FRAME_INDEXES.map((frameIndex): ThreeSixNineSquare => {
    const square = (display: ThreeSixNineDisplay) => ({ gameIndex: GAME_INDEX, frameIndex, display })
    if (killed) return square('dead')

    // Only the first ball matters: a strike needs nothing else, and a first
    // ball that leaves pins has already lost the pot before the second is thrown.
    const firstBall = frames[frameIndex]?.shots[0]
    if (!firstBall) return square('target')
    if (firstBall.pinsAfter === 0) return square('lit')

    killed = true
    return square('miss')
  })

  const status: PotStatus =
    killed ? 'lost'
    : squares.every((sq) => sq.display === 'lit') ? 'secured'
    : 'alive'

  return { squares, status }
}
