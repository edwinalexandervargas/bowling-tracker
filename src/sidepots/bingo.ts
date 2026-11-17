import type { Game } from '../types'
import { frameMark, type FrameMark } from './frameMark'

// Bingo side pot: a 5x5 board of the first 25 frames of a session, in bowling
// order. Everything here is derived from the games; nothing is stored.
//
//   row 1 = game 1 frames 1-5     row 2 = game 1 frames 6-10
//   row 3 = game 2 frames 1-5     row 4 = game 2 frames 6-10
//   row 5 = game 3 frames 1-5
//
// A line wins only if its five frames are all the same mark: five strikes or
// five spares. One of each kills the line, the same as an open frame does.

const SIZE = 5
const SQUARES = SIZE * SIZE
const FRAMES_PER_GAME = 10

export type LineKind = 'strikes' | 'spares'
export type SquareDisplay = 'lit' | 'dim' | 'miss' | 'target' | 'idle'
export type LineStatus = 'won' | 'dead' | 'alive'
export type PotStatus = 'secured' | 'lost' | 'alive'

export type BingoSquare = {
  index: number        // 0-24, bowling order
  row: number          // 0-4
  col: number          // 0-4
  gameIndex: number    // 0-2
  frameIndex: number   // 0-9
  mark: FrameMark
  display: SquareDisplay
}

export type BingoLine = {
  id: string           // 'row-1'..'row-5', 'col-1'..'col-5', 'diag-down', 'diag-up'
  squares: number[]    // the 5 square indexes on this line
  status: LineStatus
  kinds: LineKind[]    // what it can still win with, or did win with; empty once dead
  hits: number         // 0-5, counting only the kind it is closest to winning with
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

const kindOf = (mark: FrameMark): LineKind | null =>
  mark === 'strike' ? 'strikes' : mark === 'spare' ? 'spares' : null

type LineState = Pick<BingoLine, 'status' | 'kinds' | 'hits'>
const DEAD: LineState = { status: 'dead', kinds: [], hits: 0 }

function lineState(marks: FrameMark[]): LineState {
  if (marks.includes('open')) return DEAD

  const count = (kind: LineKind) => marks.filter((m) => kindOf(m) === kind).length
  const strikes = count('strikes')
  const spares = count('spares')

  // A kind stays possible only while nothing of the other kind is on the line.
  const kinds: LineKind[] = []
  if (spares === 0) kinds.push('strikes')
  if (strikes === 0) kinds.push('spares')
  if (kinds.length === 0) return DEAD

  // Both counts can't be above zero here: a line holding one of each is dead.
  const hits = kinds[0] === 'strikes' ? strikes : spares
  return { status: hits === SIZE ? 'won' : 'alive', kinds, hits }
}

export function bingoBoard(games: Game[]): BingoBoard {
  // 1. The mark on each square. Square 0-9 is game 1, 10-19 game 2, 20-24 game 3.
  const marks = range(SQUARES).map((i) =>
    frameMark(games[Math.floor(i / FRAMES_PER_GAME)]?.frames[i % FRAMES_PER_GAME])
  )

  // 2. Each line's state comes only from its own five squares.
  const lines: BingoLine[] = LINES.map(({ id, squares }) => ({
    id,
    squares,
    ...lineState(squares.map((i) => marks[i])),
  }))

  // 3. A square's display depends on the lines running through it. A line
  //    holding this mark can only ever win with this mark's kind, so any line
  //    through it that is not dead is one this mark is helping.
  const squares: BingoSquare[] = marks.map((mark, index) => {
    const through = lines.filter((l) => l.squares.includes(index))
    const kind = kindOf(mark)
    const helping = through.some((l) => l.status !== 'dead')

    let display: SquareDisplay
    if (mark === 'open') display = 'miss'
    else if (kind !== null) display = helping ? 'lit' : 'dim'
    else display = through.some((l) => l.status === 'alive') ? 'target' : 'idle'

    return {
      index,
      row: Math.floor(index / SIZE),
      col: index % SIZE,
      gameIndex: Math.floor(index / FRAMES_PER_GAME),
      frameIndex: index % FRAMES_PER_GAME,
      mark,
      display,
    }
  })

  // 4. The pot: one won line secures it; it is lost only when all 12 are dead.
  const wonLineIds = lines.filter((l) => l.status === 'won').map((l) => l.id)
  const status: PotStatus =
    wonLineIds.length > 0 ? 'secured'
    : lines.every((l) => l.status === 'dead') ? 'lost'
    : 'alive'

  // 5. Closest win: the alive line(s) with the most marks of one kind.
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
