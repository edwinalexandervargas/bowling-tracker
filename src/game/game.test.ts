import { describe, it, expect } from 'vitest'
import type { Game } from '../types'
import { addShot, nextShotContext } from './game'

const emptyGame = (): Game => ({ id: 'g1', frames: [] })

describe('addShot', () => {
  it('records the first shot of a frame against a full rack', () => {
    const next = addShot(emptyGame(), 0, 512)
    expect(next.frames[0].shots).toEqual([{ pinsBefore: 1023, pinsAfter: 512 }])
  })

  it('does not mutate the original game', () => {
    const game = emptyGame()
    const next = addShot(game, 0, 512)
    expect(game.frames).toEqual([])
    expect(next).not.toBe(game)
  })

  it('starts the second ball from where the first one left off', () => {
    const afterFirst = addShot(emptyGame(), 0, 576)  // 7-10 split
    const afterSecond = addShot(afterFirst, 0, 512)  // picked up the 7
    expect(afterSecond.frames[0].shots[1]).toEqual({ pinsBefore: 576, pinsAfter: 512 })
  })

  it('resets the rack in the 10th after a strike', () => {
    const afterStrike = addShot(emptyGame(), 9, 0)
    const afterSecond = addShot(afterStrike, 9, 512)
    expect(afterSecond.frames[9].shots[1].pinsBefore).toBe(1023)
  })

  it('resets the rack in the 10th after a spare', () => {
    let game = addShot(emptyGame(), 9, 512) // leave the 10
    game = addShot(game, 9, 0)              // spare
    game = addShot(game, 9, 0)              // fill-ball strike
    expect(game.frames[9].shots[2].pinsBefore).toBe(1023)
  })

  it('rejects a second ball after a strike in frames 1-9', () => {
    const afterStrike = addShot(emptyGame(), 0, 0)
    expect(() => addShot(afterStrike, 0, 0)).toThrow('already complete')
  })

  it('rejects a third ball in an open 10th', () => {
    let game = addShot(emptyGame(), 9, 576) // 7-10
    game = addShot(game, 9, 576)            // missed both
    expect(() => addShot(game, 9, 0)).toThrow('already complete')
  })

  it('rejects an impossible shot', () => {
    const afterFirst = addShot(emptyGame(), 0, 576) // 7-10 left
    expect(() => addShot(afterFirst, 0, 128)).toThrow('Impossible shot') // 8-pin was down
  })

  it('rejects an out-of-range frame', () => {
    expect(() => addShot(emptyGame(), 10, 0)).toThrow('Invalid frame index')
  })
})

describe('nextShotContext', () => {
  it('is a fresh rack before the first ball', () => {
    expect(nextShotContext(emptyGame(), 0)).toEqual({ pinsBefore: 1023, isFreshRack: true })
  })

  it('faces the leave on the second ball', () => {
    const game = addShot(emptyGame(), 0, 576)
    expect(nextShotContext(game, 0)).toEqual({ pinsBefore: 576, isFreshRack: false })
  })

  it('is a fresh rack after a strike in the 10th', () => {
    const game = addShot(emptyGame(), 9, 0)
    expect(nextShotContext(game, 9)).toEqual({ pinsBefore: 1023, isFreshRack: true })
  })

  it('faces the leave after strike-then-leave in the 10th', () => {
    let game = addShot(emptyGame(), 9, 0)
    game = addShot(game, 9, 512)
    expect(nextShotContext(game, 9)).toEqual({ pinsBefore: 512, isFreshRack: false })
  })
})