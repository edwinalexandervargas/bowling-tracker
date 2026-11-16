import { describe, it, expect } from 'vitest'
import type { Game } from '../types'
import { bingoBoard, type BingoBoard } from './bingo'
import { FULL, TEN_PIN, s, game, gameOf, frames } from './fixtures'

const line = (board: BingoBoard, id: string) => {
  const found = board.lines.find((l) => l.id === id)
  if (!found) throw new Error(`No line ${id}`)
  return found
}
const statuses = (board: BingoBoard) => Object.fromEntries(board.lines.map((l) => [l.id, l.status]))
const displays = (board: BingoBoard) => board.squares.map((sq) => sq.display)
const ALL_LINE_IDS = [
  'row-1', 'row-2', 'row-3', 'row-4', 'row-5',
  'col-1', 'col-2', 'col-3', 'col-4', 'col-5',
  'diag-down', 'diag-up',
]

describe('bingoBoard: layout', () => {
  const board = bingoBoard([])

  it('has 25 squares in bowling order: 10 from game 1, 10 from game 2, 5 from game 3', () => {
    expect(board.squares).toHaveLength(25)
    expect(board.squares[0]).toMatchObject({ index: 0, row: 0, col: 0, gameIndex: 0, frameIndex: 0 })
    expect(board.squares[4]).toMatchObject({ row: 0, col: 4, gameIndex: 0, frameIndex: 4 })
    expect(board.squares[5]).toMatchObject({ row: 1, col: 0, gameIndex: 0, frameIndex: 5 })
    expect(board.squares[9]).toMatchObject({ row: 1, col: 4, gameIndex: 0, frameIndex: 9 })
    expect(board.squares[10]).toMatchObject({ row: 2, col: 0, gameIndex: 1, frameIndex: 0 })
    expect(board.squares[19]).toMatchObject({ row: 3, col: 4, gameIndex: 1, frameIndex: 9 })
    expect(board.squares[20]).toMatchObject({ row: 4, col: 0, gameIndex: 2, frameIndex: 0 })
    expect(board.squares[24]).toMatchObject({ row: 4, col: 4, gameIndex: 2, frameIndex: 4 })
  })

  it('has 12 lines: 5 rows, 5 columns, 2 diagonals', () => {
    expect(board.lines.map((l) => l.id)).toEqual(ALL_LINE_IDS)
    expect(line(board, 'row-2').squares).toEqual([5, 6, 7, 8, 9])
    expect(line(board, 'col-2').squares).toEqual([1, 6, 11, 16, 21])
    expect(line(board, 'diag-down').squares).toEqual([0, 6, 12, 18, 24])
    expect(line(board, 'diag-up').squares).toEqual([20, 16, 12, 8, 4])
  })

  it('nothing bowled: every square is a target, every line alive, all 12 tied for closest', () => {
    expect(board.status).toBe('alive')
    expect(displays(board)).toEqual(Array(25).fill('target'))
    expect(board.lines.every((l) => l.status === 'alive' && l.hits === 0)).toBe(true)
    expect(board.closest).toEqual({ lineIds: ALL_LINE_IDS, needed: 5 })
  })
})

describe('bingoBoard: squares', () => {
  it('strike and spare are hits, an open frame is a miss', () => {
    const board = bingoBoard([game('X / -')])
    expect(board.squares.slice(0, 4).map((sq) => sq.result)).toEqual(['hit', 'hit', 'miss', 'pending'])
  })

  it('a frame with only its first ball thrown is still pending', () => {
    const board = bingoBoard([game('X ?')])
    expect(board.squares[1]).toMatchObject({ result: 'pending', display: 'target' })
    expect(board.lines.every((l) => l.status === 'alive')).toBe(true)
  })

  it('open in game 1 frame 1 kills row 1, column 1 and the down diagonal, nothing else', () => {
    const board = bingoBoard([game('-')])
    expect(board.squares[0]).toMatchObject({ result: 'miss', display: 'miss' })
    const dead = board.lines.filter((l) => l.status === 'dead').map((l) => l.id)
    expect(dead).toEqual(['row-1', 'col-1', 'diag-down'])
    expect(board.lines.filter((l) => l.status === 'alive')).toHaveLength(9)
    expect(board.status).toBe('alive')
    // Square 1 lost row 1 but column 2 is alive, so it is still worth hitting.
    expect(board.squares[1].display).toBe('target')
  })

  it('a hit is lit while any line through it is alive, dim once they are all dead', () => {
    // Square 0 open kills row 1; square 6 open kills column 2.
    const board = bingoBoard([game('- X X X X X -')])
    expect(board.squares[1]).toMatchObject({ result: 'hit', display: 'dim' })   // row 1 + col 2, both dead
    expect(board.squares[2]).toMatchObject({ result: 'hit', display: 'lit' })   // col 3 still alive
  })

  it('a pending square is idle when every line through it is dead, even if the pot is alive', () => {
    // Square 4 open kills column 5, square 5 open kills row 2: square 9 (game 1 frame 10) has no line left.
    const board = bingoBoard([game('X X X X - - X X X')])
    expect(board.squares[9]).toMatchObject({ result: 'pending', display: 'idle' })
    expect(board.squares[10].display).toBe('target')
    expect(board.status).toBe('alive')
  })
})

describe('bingoBoard: winning', () => {
  it('row 1 wins after 5 frames and secures the pot', () => {
    const board = bingoBoard([game('X X / / X')])
    expect(line(board, 'row-1')).toMatchObject({ status: 'won', hits: 5 })
    expect(board.status).toBe('secured')
    expect(board.wonLineIds).toEqual(['row-1'])
    expect(displays(board).slice(0, 5)).toEqual(Array(5).fill('lit'))
  })

  it('a won line is not offered as the closest line', () => {
    const board = bingoBoard([game('X X / / X')])
    expect(board.closest?.lineIds).not.toContain('row-1')
    expect(board.closest?.needed).toBe(4)   // each column and both diagonals have 1 hit
  })

  it('down diagonal wins even when every row and column is dead', () => {
    // Hits only on squares 0, 6, 12, 18, 24.
    const board = bingoBoard([
      game('X - - - - - X - - -'),
      game('- - X - - - - - X -'),
      game('- - - - X'),
    ])
    expect(line(board, 'diag-down').status).toBe('won')
    expect(board.status).toBe('secured')
    expect(board.wonLineIds).toEqual(['diag-down'])
    expect(board.lines.filter((l) => l.status === 'dead')).toHaveLength(11)
    expect([0, 6, 12, 18, 24].map((i) => board.squares[i].display)).toEqual(Array(5).fill('lit'))
    expect(board.closest).toBeNull()
  })

  it('up diagonal wins through game 3 frame 1', () => {
    // Hits only on squares 4, 8, 12, 16, 20.
    const board = bingoBoard([
      game('- - - - X - - - X -'),
      game('- - X - - - X - - -'),
      game('X'),
    ])
    expect(line(board, 'diag-up').status).toBe('won')
    expect(board.status).toBe('secured')
  })

  it('two lines can be won at once', () => {
    const board = bingoBoard([game('X X X X X X X X X X')])
    expect(board.wonLineIds).toEqual(['row-1', 'row-2'])
  })
})

describe('bingoBoard: losing', () => {
  // Opens on squares 0, 1, 7, 13, 19, 20 put a miss on all 12 lines.
  const lost = bingoBoard([
    game('- - X X X X X - X X'),
    game('X X X - X X X X X -'),
    game('-'),
  ])

  it('the pot is lost once all 12 lines are dead', () => {
    expect(Object.values(statuses(lost))).toEqual(Array(12).fill('dead'))
    expect(lost.status).toBe('lost')
    expect(lost.wonLineIds).toEqual([])
    expect(lost.closest).toBeNull()
  })

  it('on a lost board hits go dim and unbowled squares go idle', () => {
    expect(lost.squares[2].display).toBe('dim')
    expect(lost.squares[0].display).toBe('miss')
    expect(displays(lost).slice(21)).toEqual(['idle', 'idle', 'idle', 'idle'])
  })

  it('11 dead lines is not lost yet', () => {
    // Same as above without the open on square 0: the down diagonal survives.
    const board = bingoBoard([
      game('X - X X X X X - X X'),
      game('X X X - X X X X X -'),
      game('-'),
    ])
    expect(board.status).toBe('alive')
    expect(board.closest).toEqual({ lineIds: ['diag-down'], needed: 1 })
    expect(board.squares[24].display).toBe('target')
    expect(board.squares[21].display).toBe('idle')
  })
})

describe('bingoBoard: closest line', () => {
  it('is the alive line needing the fewest squares', () => {
    const board = bingoBoard([game('X X X')])
    expect(board.closest).toEqual({ lineIds: ['row-1'], needed: 2 })
  })

  it('returns every line tied for fewest', () => {
    const board = bingoBoard([game('X')])
    expect(board.closest).toEqual({ lineIds: ['row-1', 'col-1', 'diag-down'], needed: 4 })
  })

  it('ignores a dead line however many hits it has', () => {
    const board = bingoBoard([game('X X X X -')])
    expect(line(board, 'row-1')).toMatchObject({ status: 'dead', hits: 4 })
    expect(board.closest?.lineIds).not.toContain('row-1')
    expect(board.closest?.needed).toBe(4)
  })
})

describe('bingoBoard: 10th frame (game 1 frame 10 is square 9)', () => {
  const nine = 'X X X X X X X X X'
  const withTenth = (shots: { pinsBefore: number; pinsAfter: number }[]): Game =>
    gameOf([...frames(nine), { shots }])

  it('strike on the first ball is a hit before the fill balls, and wins row 2', () => {
    const board = bingoBoard([withTenth([s(FULL, 0)])])
    expect(board.squares[9].result).toBe('hit')
    expect(line(board, 'row-2').status).toBe('won')
  })

  it('strike then open fill balls is still a hit', () => {
    const board = bingoBoard([withTenth([s(FULL, 0), s(FULL, TEN_PIN), s(TEN_PIN, TEN_PIN)])])
    expect(board.squares[9].result).toBe('hit')
  })

  it('spare with the first two balls is a hit whatever the fill ball does', () => {
    const board = bingoBoard([withTenth([s(FULL, TEN_PIN), s(TEN_PIN, 0), s(FULL, FULL)])])
    expect(board.squares[9].result).toBe('hit')
  })

  it('gutter then all ten in the 10th is a spare, so a hit', () => {
    const board = bingoBoard([withTenth([s(FULL, FULL), s(FULL, 0)])])
    expect(board.squares[9].result).toBe('hit')
    expect(line(board, 'row-2').status).toBe('won')
  })

  it('open 10th is a miss and kills row 2 and column 5', () => {
    const board = bingoBoard([withTenth([s(FULL, TEN_PIN), s(TEN_PIN, TEN_PIN)])])
    expect(board.squares[9].result).toBe('miss')
    expect(line(board, 'row-2').status).toBe('dead')
    expect(line(board, 'col-5').status).toBe('dead')
  })

  it('first ball only in the 10th is pending', () => {
    const board = bingoBoard([withTenth([s(FULL, TEN_PIN)])])
    expect(board.squares[9].result).toBe('pending')
    expect(line(board, 'row-2')).toMatchObject({ status: 'alive', hits: 4 })
  })
})

describe('bingoBoard: number of games', () => {
  const allStrikes = 'X X X X X X X X X X'
  const allOpens = '- - - - - - - - - -'

  it('one game bowled: games 2 and 3 are pending targets', () => {
    const board = bingoBoard([game(allStrikes)])
    expect(displays(board).slice(10)).toEqual(Array(15).fill('target'))
    expect(board.status).toBe('secured')
  })

  it('two games bowled: row 5 is all pending and cannot be dead', () => {
    const board = bingoBoard([game(allOpens), game(allOpens)])
    expect(line(board, 'row-5')).toMatchObject({ status: 'alive', hits: 0 })
    expect(board.status).toBe('alive')
    expect(board.closest).toEqual({ lineIds: ['row-5'], needed: 5 })
  })

  it('game 3 frames 6-10 are not on the board', () => {
    const board = bingoBoard([game(allStrikes), game(allStrikes), game('X X X X X - - - - -')])
    expect(board.lines.every((l) => l.status === 'won')).toBe(true)
  })

  it('games after the third are ignored', () => {
    const three = [game(allStrikes), game('X X - X X X X X X X'), game('X X X')]
    const withFourth = [...three, game(allOpens), game(allStrikes)]
    const strip = (b: BingoBoard) => ({ d: displays(b), s: statuses(b), status: b.status, closest: b.closest })
    expect(strip(bingoBoard(withFourth))).toEqual(strip(bingoBoard(three)))
  })
})
