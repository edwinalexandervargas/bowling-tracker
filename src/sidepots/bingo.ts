import type { Game } from '../types'
import { frameMark } from './frameMark'

// Bingo side pot: a 5x5 board of the first 25 frames of a session, in bowling
// order. Everything here is derived from the games; nothing is stored.
//
//   row 1 = game 1 frames 1-5     row 2 = game 1 frames 6-10
//   row 3 = game 2 frames 1-5     row 4 = game 2 frames 6-10
//   row 5 = game 3 frames 1-5

const SIZE = 5
const SQUARES = SIZE * SIZE
const FRAMES_PER_GAME = 10

export type SquareResult = 'hit' | 'miss' | 'pending'
export type SquareDisplay = 'lit' | 'dim' | 'miss' | 'target' | 'idle'
export type LineStatus = 'won' | 'dead' | 'alive'
export type PotStatus = 'secured' | 'lost' | 'alive'

export type BingoSquare = {
  index: number        // 0-24, bowling order
  row: number          // 0-4
  col: number          // 0-4
  gameIndex: number    // 0-2
  frameIndex: number   // 0-9
  result: SquareResult
  display: SquareDisplay
}

export type BingoLine = {
  id: string           // 'row-1'..'row-5', 'col-1'..'col-5', 'diag-down', 'diag-up'
  squares: number[]    // the 5 square indexes on this line
  status: LineStatus
  hits: number         // 0-5
}

export type BingoBoard = {
  squares: BingoSquare[]
  lines: BingoLine[]
  status: PotStatus
  wonLineIds: string[]
  // The alive line(s) needing the fewest squares; null when no line is alive.
  closest: { lineIds: string[]; needed: number } | null
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

// The 12 lines as lists of square indexes. Built once: the board never changes shape.
const LINES: { id: string; squares: number[] }[] = [
  ...range(SIZE).map((r) => ({ id: `row-${r + 1}`, squares: range(SIZE).map((c) => r * SIZE + c) })),
  ...range(SIZE).map((c) => ({ id: `col-${c + 1}`, squares: range(SIZE).map((r) => r * SIZE + c) })),
  { id: 'diag-down', squares: range(SIZE).map((i) => i * SIZE + i) },                         // top-left to bottom-right
  { id: 'diag-up', squares: range(SIZE).map((i) => (SIZE - 1 - i) * SIZE + i) },              // bottom-left to top-right
]

function squareResult(games: Game[], gameIndex: number, frameIndex: number): SquareResult {
  const mark = frameMark(games[gameIndex]?.frames[frameIndex])
  if (mark === 'pending') return 'pending'
  return mark === 'open' ? 'miss' : 'hit'
}

function lineStatus(results: SquareResult[]): LineStatus {
  if (results.includes('miss')) return 'dead'
  return results.every((r) => r === 'hit') ? 'won' : 'alive'
}

export function bingoBoard(games: Game[]): BingoBoard {
  // 1. What happened on each square. Square 0-9 is game 1, 10-19 game 2, 20-24 game 3.
  const results = range(SQUARES).map((i) =>
    squareResult(games, Math.floor(i / FRAMES_PER_GAME), i % FRAMES_PER_GAME)
  )

  // 2. Each line's status comes only from its own five squares.
  const lines: BingoLine[] = LINES.map(({ id, squares }) => {
    const lineResults = squares.map((i) => results[i])
    return {
      id,
      squares,
      status: lineStatus(lineResults),
      hits: lineResults.filter((r) => r === 'hit').length,
    }
  })

  // 3. A square's display depends on the lines running through it.
  const squares: BingoSquare[] = results.map((result, index) => {
    const through = lines.filter((l) => l.squares.includes(index))
    const anyAlive = through.some((l) => l.status === 'alive')
    const anyWon = through.some((l) => l.status === 'won')

    let display: SquareDisplay
    if (result === 'miss') display = 'miss'
    else if (result === 'hit') display = anyAlive || anyWon ? 'lit' : 'dim'
    else display = anyAlive ? 'target' : 'idle'

    return {
      index,
      row: Math.floor(index / SIZE),
      col: index % SIZE,
      gameIndex: Math.floor(index / FRAMES_PER_GAME),
      frameIndex: index % FRAMES_PER_GAME,
      result,
      display,
    }
  })

  // 4. The pot: one won line secures it; it is lost only when all 12 are dead.
  const wonLineIds = lines.filter((l) => l.status === 'won').map((l) => l.id)
  const status: PotStatus =
    wonLineIds.length > 0 ? 'secured'
    : lines.every((l) => l.status === 'dead') ? 'lost'
    : 'alive'

  // 5. Closest win: the alive line(s) with the most hits.
  return { squares, lines, status, wonLineIds, closest: closestLines(lines) }
}

function closestLines(lines: BingoLine[]): BingoBoard['closest'] {
  const alive = lines.filter((l) => l.status === 'alive')
  if (alive.length === 0) return null

  const mostHits = Math.max(...alive.map((l) => l.hits))
  return {
    lineIds: alive.filter((l) => l.hits === mostHits).map((l) => l.id),
    needed: SIZE - mostHits,
  }
}
