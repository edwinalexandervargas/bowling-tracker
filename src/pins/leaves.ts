import { isPinStanding, pinsStanding } from './pins'

// Pin positions on the deck: x = column (pins in a row are 2 apart), y = row.
//        7   8   9   10      y=3
//          4   5   6         y=2
//            2   3           y=1
//              1             y=0
export const PIN_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -1, y: 1 }, 3: { x: 1, y: 1 },
  4: { x: -2, y: 2 }, 5: { x: 0, y: 2 }, 6: { x: 2, y: 2 },
  7: { x: -3, y: 3 }, 8: { x: -1, y: 3 }, 9: { x: 1, y: 3 }, 10: { x: 3, y: 3 },
}

// Two pins "touch" (no gap between them) when they are side by side in a row,
// diagonal neighbours, or one directly behind the other (a sleeper, e.g. 2-8).
function touching(a: number, b: number): boolean {
  const dx = Math.abs(PIN_POSITIONS[a].x - PIN_POSITIONS[b].x)
  const dy = Math.abs(PIN_POSITIONS[a].y - PIN_POSITIONS[b].y)
  return (dy === 0 && dx === 2) || (dy === 1 && dx === 1) || (dy === 2 && dx === 0)
}

// Number of separate groups of standing pins.
function groups(pins: number[]): number {
  const seen = new Set<number>()
  let count = 0
  for (const start of pins) {
    if (seen.has(start)) continue
    count++
    const stack = [start]
    seen.add(start)
    while (stack.length) {
      const p = stack.pop()!
      for (const q of pins) {
        if (!seen.has(q) && touching(p, q)) {
          seen.add(q)
          stack.push(q)
        }
      }
    }
  }
  return count
}

// A split: the headpin is down and the standing pins have a gap between them
// (more than one group). 7-10, 4-6, 3-10 and 5-7 are splits; 2-8 and 4-5 are not.
export function isSplit(leave: number): boolean {
  if (leave === 0 || isPinStanding(leave, 1)) return false
  return groups(pinsStanding(leave)) > 1
}

export function isSinglePin(leave: number): boolean {
  return leave !== 0 && (leave & (leave - 1)) === 0 // exactly one bit set
}

// "7-10", "10", "1-2-4-7". Empty string for a strike.
export function leaveName(leave: number): string {
  return pinsStanding(leave).join('-')
}
