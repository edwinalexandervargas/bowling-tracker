import { describe, it, expect } from 'vitest'
import { removeLastShot } from './removeLastShot'
import type { Game } from '../types'

const strike = { pinsBefore: 1023, pinsAfter: 0 }
const leave710 = { pinsBefore: 1023, pinsAfter: 576 }
const spare = { pinsBefore: 576, pinsAfter: 0 }

describe('removeLastShot', () => {
  it('removes the only shot and drops the empty frame', () => {
    const game: Game = { id: 'g', frames: [{ shots: [strike] }] }
    expect(removeLastShot(game).frames).toEqual([])
  })

  it('removes the second ball and keeps the first', () => {
    const game: Game = { id: 'g', frames: [{ shots: [leave710, spare] }] }
    expect(removeLastShot(game).frames).toEqual([{ shots: [leave710] }])
  })

  it('only touches the last frame', () => {
    const game: Game = {
      id: 'g',
      frames: [{ shots: [strike] }, { shots: [strike] }, { shots: [leave710] }],
    }
    expect(removeLastShot(game).frames).toEqual([{ shots: [strike] }, { shots: [strike] }])
  })

  it('returns an empty game unchanged', () => {
    const game: Game = { id: 'g', frames: [] }
    expect(removeLastShot(game)).toEqual(game)
  })

  it('does not mutate the input', () => {
    const game: Game = { id: 'g', frames: [{ shots: [leave710, spare] }] }
    removeLastShot(game)
    expect(game.frames[0].shots).toHaveLength(2)
  })
})
