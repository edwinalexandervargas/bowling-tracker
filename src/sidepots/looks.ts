import type { BingoBoard } from './bingo'
import type { ThreeSixNine } from './threeSixNine'

// How a square is drawn. This sits between the pot logic and the screen:
// the logic says what happened, this says what the bowler should see.
//
//   won     = a hit on a completed line
//   lit     = a hit that can still help
//   dim     = a hit that can no longer help
//   miss    = the frame that broke a line (or killed 3-6-9)
//   closest = not bowled yet, on the line nearest to winning
//   target  = not bowled yet, on some line that can still win
//   idle    = nothing to chase here
export type SquareLook = 'won' | 'lit' | 'dim' | 'miss' | 'closest' | 'target' | 'idle'

// `live` is false for a finished night: there is nothing left to chase, so
// unbowled squares are idle instead of glowing as targets.
export function bingoLooks(board: BingoBoard, live: boolean): SquareLook[] {
  const squaresOn = (lineIds: string[]) =>
    new Set(board.lines.filter((l) => lineIds.includes(l.id)).flatMap((l) => l.squares))

  const won = squaresOn(board.wonLineIds)
  // A line only counts as "closest" once it has a hit. Before that every line
  // needs all five, and emphasising all of them would emphasise nothing.
  const hasLeader = board.closest !== null && board.closest.needed < 5
  const closest = squaresOn(hasLeader ? board.closest!.lineIds : [])
  const chasing = live && board.status === 'alive'

  return board.squares.map((sq) => {
    if (sq.result === 'miss') return 'miss'
    if (sq.result === 'hit') {
      if (won.has(sq.index)) return 'won'
      return sq.display === 'lit' ? 'lit' : 'dim'
    }
    if (!chasing || sq.display === 'idle') return 'idle'
    return closest.has(sq.index) ? 'closest' : 'target'
  })
}

export function threeSixNineLooks(pot: ThreeSixNine, live: boolean): SquareLook[] {
  let nextFound = false
  return pot.squares.map((sq) => {
    if (sq.display === 'lit') {
      if (pot.status === 'secured') return 'won'
      return pot.status === 'lost' ? 'dim' : 'lit'
    }
    if (sq.display === 'miss') return 'miss'
    if (sq.display === 'dead' || !live) return 'idle'

    // Frames must be struck in order, so the first one still to bowl is the one that matters now.
    if (nextFound) return 'target'
    nextFound = true
    return 'closest'
  })
}

export function lineLabel(lineId: string): string {
  if (lineId === 'diag-down') return 'Diagonal, top left to bottom right'
  if (lineId === 'diag-up') return 'Diagonal, bottom left to top right'
  const [kind, n] = lineId.split('-')
  return `${kind === 'row' ? 'Row' : 'Column'} ${n}`
}

// "Row 2 complete." Past two lines a list gets long, so it becomes a count.
export function wonLinesText(lineIds: string[]): string {
  if (lineIds.length > 2) return `${lineIds.length} lines complete.`
  return `${lineIds.map(lineLabel).join(' and ')} complete.`
}
