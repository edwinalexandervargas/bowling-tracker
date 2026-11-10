import { describe, it, expect } from 'vitest'
import { gameToRolls } from './gameToRolls'
import type { Game } from '../types'

describe('gameToRolls', () => {
  it('converts a single strike to [10]', () => {
    const game: Game = {
      id: 'g1',
      frames: [{ shots: [{ pinsBefore: 1023, pinsAfter: 0 }] }],
    }
    expect(gameToRolls(game)).toEqual([10])
  })
})