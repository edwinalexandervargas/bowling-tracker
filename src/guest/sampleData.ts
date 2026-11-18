import type { Frame, Game, Session } from '../types'
import type { Collections } from '../sync/tables'

// What a guest sees on arrival, so Arsenal, Patterns, Stats and Nights aren't
// empty. Lives here, never in the database. Every id starts with "sample-",
// which is how keeping guest games on sign-up knows to leave these behind.

export const SAMPLE_PREFIX = 'sample-'
export const isSampleId = (id: string) => id.startsWith(SAMPLE_PREFIX)

const FULL = 1023
const mask = (pins: number[]) => pins.reduce((m, p) => m | (1 << (p - 1)), 0)

// One frame, ball by ball, comma separated:
//   X   every pin down from a full rack     /   the rest down (a spare)
//   -   nothing more down (a miss)          2.8 the pins left standing
// A rack that is cleared resets to full, which covers the 10th frame's fill balls.
export function sampleFrame(token: string): Frame {
  let before = FULL
  return {
    shots: token.split(',').map((ball) => {
      const after = ball === 'X' || ball === '/' ? 0 : ball === '-' ? before : mask(ball.split('.').map(Number))
      const shot = { pinsBefore: before, pinsAfter: after }
      before = after === 0 ? FULL : after
      return shot
    }),
  }
}

const sampleGame = (id: string, frames: string): Game => ({
  id: `${SAMPLE_PREFIX}${id}`,
  frames: frames.trim().split(/\s+/).map(sampleFrame),
})

const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()

function sampleNights(now: Date): Session[] {
  return [
    {
      id: `${SAMPLE_PREFIX}night-1`,
      date: daysAgo(now, 14),
      type: 'league',
      eventName: 'Thursday Night Mixed',
      games: [
        sampleGame('n1g1', 'X 10,/ X X 7,/ 2.8,/ X 10,- X X,7,/'),
        sampleGame('n1g2', '7,/ X 4.7,- X X 10,/ 3.6.10,- X 6,/ X,X,X'),
        sampleGame('n1g3', 'X X 7.10,- 10,/ X X 7,/ X 2.4.5,/ 10,/,X'),
      ],
    },
    {
      id: `${SAMPLE_PREFIX}night-2`,
      date: daysAgo(now, 7),
      type: 'league',
      eventName: 'Thursday Night Mixed',
      patternId: `${SAMPLE_PREFIX}pattern-sport`,
      games: [
        sampleGame('n2g1', '10,/ 7,- X 4.9,- 10,/ X 6.10,/ 7,/ X X,10,/'),
        sampleGame('n2g2', 'X 10,/ 2.4.5.8,- 7,/ X X X 10,- 3.10,/ X,X,7'),
        sampleGame('n2g3', '7,/ 10,/ X 8.10,- X 7,/ X X 4,/ X,9.10,-'),
      ],
    },
    {
      id: `${SAMPLE_PREFIX}night-3`,
      date: daysAgo(now, 2),
      type: 'practice',
      games: [
        sampleGame('n3g1', 'X X X 9,/ X 7,/ X X 10,/ X,X,9'),
        sampleGame('n3g2', '9,/ X X 8,/ X X 7,- X X X,X,X'),
        sampleGame('n3g3', '8,/ X 7,- 9,/ X 10,/ 6,- X 8,/ 9,/,X'),
      ],
    },
  ]
}

// A fresh demo every time, built at the moment guest mode starts.
export function sampleData(now = new Date()): Collections {
  return {
    profile: { papOver: 5, papUp: 0.5, ballWeight: 15, hand: 'right', style: 'one-handed' },
    ballSpecs: [
      { id: `${SAMPLE_PREFIX}spec-1`, brand: 'Storm', name: 'Phase II', rg: 2.48, differential: 0.051, coverstock: 'Solid reactive' },
      { id: `${SAMPLE_PREFIX}spec-2`, brand: 'Sample', name: 'Spare ball', coverstock: 'Polyester' },
    ],
    balls: [
      {
        id: `${SAMPLE_PREFIX}ball-1`,
        specId: `${SAMPLE_PREFIX}spec-1`,
        weight: 15,
        surface: '2000 Abralon',
        layout: { system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 },
      },
      {
        id: `${SAMPLE_PREFIX}ball-2`,
        specId: `${SAMPLE_PREFIX}spec-2`,
        weight: 15,
        surface: 'Factory polish',
        layout: { system: 'dual-angle', drillingAngle: 45, pinToPap: 4.5, valAngle: 30 },
      },
    ],
    patterns: [
      { id: `${SAMPLE_PREFIX}pattern-house`, kind: 'house', name: 'House shot (sample)' },
      { id: `${SAMPLE_PREFIX}pattern-sport`, kind: 'sport', name: 'Sport 41 (sample)', length: 41, ratio: 3.2, volume: 24.5 },
    ],
    sessions: sampleNights(now),
    seasonCloses: [],
  }
}
