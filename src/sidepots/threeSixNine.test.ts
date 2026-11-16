import { describe, it, expect } from 'vitest'
import { threeSixNine, type ThreeSixNine } from './threeSixNine'
import { game } from './fixtures'

const displays = (pot: ThreeSixNine) => pot.squares.map((sq) => sq.display)
const g1 = game('X X X X X X X X X X')   // game 1 never matters

describe('threeSixNine', () => {
  it('uses frames 3, 6 and 9 of game 2', () => {
    const pot = threeSixNine([])
    expect(pot.squares.map((sq) => [sq.gameIndex, sq.frameIndex])).toEqual([[1, 2], [1, 5], [1, 8]])
  })

  it('no game 2 yet: all three are targets and the pot is alive', () => {
    expect(threeSixNine([])).toMatchObject({ status: 'alive' })
    expect(displays(threeSixNine([]))).toEqual(['target', 'target', 'target'])
    expect(displays(threeSixNine([g1]))).toEqual(['target', 'target', 'target'])
  })

  it('game 2 under way but frame 3 not reached: still all targets', () => {
    expect(displays(threeSixNine([g1, game('- -')]))).toEqual(['target', 'target', 'target'])
  })

  it('lights each square as its frame is struck', () => {
    const pot = threeSixNine([g1, game('- - X - -')])
    expect(displays(pot)).toEqual(['lit', 'target', 'target'])
    expect(pot.status).toBe('alive')
  })

  it('three strikes secure the pot; other frames of game 2 do not matter', () => {
    const pot = threeSixNine([g1, game('- - X - - X - - X')])
    expect(displays(pot)).toEqual(['lit', 'lit', 'lit'])
    expect(pot.status).toBe('secured')
  })

  it('a spare is not a strike: it kills the pot', () => {
    const pot = threeSixNine([g1, game('X X /')])
    expect(displays(pot)).toEqual(['miss', 'dead', 'dead'])
    expect(pot.status).toBe('lost')
  })

  it('the first non-strike kills the pot and later squares never light, even on a strike', () => {
    const pot = threeSixNine([g1, game('X X X X X - X X X X')])
    expect(displays(pot)).toEqual(['lit', 'miss', 'dead'])
    expect(pot.status).toBe('lost')
  })

  it('a first ball that leaves pins kills the pot before the second ball is thrown', () => {
    const pot = threeSixNine([g1, game('X X ?')])
    expect(displays(pot)).toEqual(['miss', 'dead', 'dead'])
    expect(pot.status).toBe('lost')
  })

  it('only game 2 counts, however many games the session has', () => {
    const open = game('- - - - - - - - - -')
    const pot = threeSixNine([open, game('X X X X X X X X X X'), open, open])
    expect(pot.status).toBe('secured')
  })
})
