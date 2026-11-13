import type { Game, Shot } from '../types'
import { pinsKnockedDown } from '../pins/pins'
import { gameToRolls } from '../game/gameToRolls'
import { frameScores } from '../scoring/scorer'
import { isSplit, leaveName } from '../pins/leaves'
import { frameFirstBalls } from '../stats/firstBalls'

const FULL_RACK = 1023

type ScoresheetProps = {
  game: Game
  currentFrame: number
  showLeaves?: boolean // extra row under each frame with the pins left after the first ball
}

// Display mark for one shot, like an alley scoresheet:
// X = strike, / = spare, - = gutter/miss, otherwise the count
function shotMark(shot: Shot): string {
  const freshRack = shot.pinsBefore === FULL_RACK
  if (shot.pinsAfter === 0) return freshRack ? 'X' : '/'
  const count = pinsKnockedDown(shot.pinsBefore, shot.pinsAfter)
  return count === 0 ? '-' : String(count)
}

// First ball at a full rack that left a split
function isSplitShot(shot: Shot): boolean {
  return shot.pinsBefore === FULL_RACK && isSplit(shot.pinsAfter)
}

export function Scoresheet({ game, currentFrame, showLeaves = false }: ScoresheetProps) {
  // Running totals for scorable frames only (blank until bonus balls exist)
  const totals = frameScores(gameToRolls(game))

  return (
    <div className="grid grid-cols-10 w-full max-w-md border border-gray-600 text-center">
      {Array.from({ length: 10 }, (_, i) => {
        const shots = game.frames[i]?.shots ?? []
        const slots = i === 9 ? 3 : 2 // 10th frame has room for 3 balls
        const isCurrent = i === currentFrame

        return (
          <div
            key={i}
            className={`border-r border-gray-600 last:border-r-0 ${
              isCurrent ? 'bg-blue-900/60' : ''
            }`}
          >
            <div className="text-[10px] text-gray-400 border-b border-gray-700">{i + 1}</div>
            <div className="flex justify-end text-xs h-5">
              {Array.from({ length: slots }, (_, s) => (
                <span key={s} className="flex-1 border-l border-gray-700 first:border-l-0">
                  {shots[s] &&
                    (isSplitShot(shots[s]) ? (
                      // Splits are circled, like on a paper sheet
                      <span className="inline-block w-4 h-4 leading-4 rounded-full ring-1 ring-red-400">
                        {shotMark(shots[s])}
                      </span>
                    ) : (
                      shotMark(shots[s])
                    ))}
                </span>
              ))}
            </div>
            <div className="text-sm font-bold h-6">{totals[i] ?? ''}</div>
            {showLeaves && (
              <div className="min-h-6 border-t border-gray-700 px-px text-[9px] leading-tight break-all">
                {game.frames[i] &&
                  frameFirstBalls(game.frames[i], i)
                    .filter((b) => b.leave !== 0)
                    .map((b, k) => (
                      <div key={k} className={isSplit(b.leave) ? 'text-red-400' : 'text-gray-300'}>
                        {leaveName(b.leave)}
                      </div>
                    ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
