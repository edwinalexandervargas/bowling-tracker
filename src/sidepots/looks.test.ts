import { describe, it, expect } from 'vitest'
import { bingoBoard } from './bingo'
import { threeSixNine } from './threeSixNine'
import { bingoLooks, threeSixNineLooks, lineLabel, wonLinesText, closestNeed } from './looks'
import { game } from './fixtures'

const allStrikes = 'X X X X X X X X X X'

describe('bingoLooks: live night', () => {
  it('nothing bowled: every square is a plain target, none singled out', () => {
    expect(bingoLooks(bingoBoard([]), true)).toEqual(Array(25).fill('target'))
  })

  it('once a line has a mark, its unbowled squares become the closest ones', () => {
    // Three strikes: row 1 needs 2 more and is the only closest line.
    const looks = bingoLooks(bingoBoard([game('X X X')]), true)
    expect(looks.slice(0, 5)).toEqual(['lit', 'lit', 'lit', 'closest', 'closest'])
    expect(looks[5]).toBe('target')   // column 1 is alive but further away
  })

  it('every line tied for closest is emphasised', () => {
    // One strike: row 1, column 1 and the down diagonal all need 4.
    const looks = bingoLooks(bingoBoard([game('X')]), true)
    expect(looks[1]).toBe('closest')    // row 1
    expect(looks[5]).toBe('closest')    // column 1
    expect(looks[6]).toBe('closest')    // down diagonal
    expect(looks[7]).toBe('target')     // on none of them
  })

  it('an open frame is a miss; a mark with no line left is dim', () => {
    const looks = bingoLooks(bingoBoard([game('- X X X X X -')]), true)
    expect(looks[0]).toBe('miss')
    expect(looks[1]).toBe('dim')
    expect(looks[2]).toBe('lit')
  })

  it('a pending square with no line left is idle', () => {
    const looks = bingoLooks(bingoBoard([game('X X X X - - X X X')]), true)
    expect(looks[9]).toBe('idle')
  })
})

describe('bingoLooks: secured and lost', () => {
  it('squares on a won line are marked won, and nothing is chased afterwards', () => {
    const looks = bingoLooks(bingoBoard([game('X X X X X')]), true)
    expect(looks.slice(0, 5)).toEqual(Array(5).fill('won'))
    expect(looks.slice(5)).toEqual(Array(20).fill('idle'))
  })

  it('marks off the winning line stay lit or dim, not won', () => {
    // Row 2 is won; square 1 (row 1 dead by the open in frame 1, column 2 alive) is lit.
    const looks = bingoLooks(bingoBoard([game('- X X X X X X X X X')]), true)
    expect(looks[0]).toBe('miss')
    expect(looks[1]).toBe('lit')
    expect(looks.slice(5, 10)).toEqual(Array(5).fill('won'))
  })

  it('a lost board has only misses, dim marks and idle squares', () => {
    const lost = bingoBoard([
      game('- - X X X X X - X X'),
      game('X X X - X X X X X -'),
      game('-'),
    ])
    expect(new Set(bingoLooks(lost, true))).toEqual(new Set(['miss', 'dim', 'idle']))
  })
})

describe('bingoLooks: finished night', () => {
  it('unbowled squares are idle, not targets, when the night is not live', () => {
    const looks = bingoLooks(bingoBoard([game('X X X')]), false)
    expect(looks.slice(0, 5)).toEqual(['lit', 'lit', 'lit', 'idle', 'idle'])
    expect(looks.slice(5)).toEqual(Array(20).fill('idle'))
  })
})

describe('threeSixNineLooks', () => {
  const g1 = game(allStrikes)

  it('live: the next frame needed is the closest, later ones are plain targets', () => {
    expect(threeSixNineLooks(threeSixNine([g1]), true)).toEqual(['closest', 'target', 'target'])
    expect(threeSixNineLooks(threeSixNine([g1, game('- - X')]), true)).toEqual(['lit', 'closest', 'target'])
  })

  it('secured: all three are won', () => {
    expect(threeSixNineLooks(threeSixNine([g1, game(allStrikes)]), true)).toEqual(['won', 'won', 'won'])
  })

  it('lost: earlier strikes go dim, the killer is a miss, the rest are idle', () => {
    expect(threeSixNineLooks(threeSixNine([g1, game('X X X X X - X X X X')]), true)).toEqual(['dim', 'miss', 'idle'])
  })

  it('finished night: unbowled frames are idle', () => {
    expect(threeSixNineLooks(threeSixNine([g1, game('- - X')]), false)).toEqual(['lit', 'idle', 'idle'])
  })
})

describe('lineLabel', () => {
  it('names rows, columns and diagonals in plain words', () => {
    expect(lineLabel('row-2')).toBe('Row 2')
    expect(lineLabel('col-5')).toBe('Column 5')
    expect(lineLabel('diag-down')).toBe('Diagonal, top left to bottom right')
    expect(lineLabel('diag-up')).toBe('Diagonal, bottom left to top right')
  })
})

describe('wonLinesText', () => {
  it('names one or two lines', () => {
    expect(wonLinesText(['row-2'])).toBe('Row 2 complete.')
    expect(wonLinesText(['row-2', 'col-3'])).toBe('Row 2 and Column 3 complete.')
  })

  it('counts them once there are more than two', () => {
    expect(wonLinesText(['row-1', 'row-2', 'col-1'])).toBe('3 lines complete.')
  })
})

describe('closestNeed', () => {
  it('names the kind the closest line is chasing', () => {
    expect(closestNeed(bingoBoard([game('X X X')]))).toBe('2 more strikes')
    expect(closestNeed(bingoBoard([game('/ / / /')]))).toBe('1 more spare')
  })

  it('says nothing while every line still needs all five', () => {
    expect(closestNeed(bingoBoard([]))).toBeNull()
  })

  it('falls back to neutral words when the closest lines are chasing different kinds', () => {
    // Row 1 is dead; column 1 chases spares and column 2 strikes, both needing 4.
    expect(closestNeed(bingoBoard([game('/ X')]))).toBe('4 more marks of one kind')
  })

  it('is null once no line is alive', () => {
    const lost = bingoBoard([
      game('- - X X X X X - X X'),
      game('X X X - X X X X X -'),
      game('-'),
    ])
    expect(closestNeed(lost)).toBeNull()
  })
})
