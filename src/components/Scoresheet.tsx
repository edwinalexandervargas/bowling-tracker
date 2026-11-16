import type { Game, Shot } from '../types'
import { pinsKnockedDown } from '../pins/pins'
import { gameToRolls } from '../game/gameToRolls'
import { frameScores } from '../scoring/scorer'
import { isSplit } from '../pins/leaves'
import { MiniDeck } from './MiniDeck'
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
    // The 10th frame is 1.5x as wide as the others because it holds three balls.
    <div className="num grid w-full grid-cols-[repeat(9,minmax(0,1fr))_minmax(0,1.5fr)] overflow-hidden rounded-lg bg-surface text-center ring-1 ring-line">
      {Array.from({ length: 10 }, (_, i) => {
        const shots = game.frames[i]?.shots ?? []
        const slots = i === 9 ? 3 : 2 // 10th frame has room for 3 balls
        const isCurrent = i === currentFrame

        return (
          <div
            key={i}
            aria-current={isCurrent ? 'step' : undefined}
            // The current frame is filled and outlined, not just tinted.
            className={`border-r border-line last:border-r-0 ${
              isCurrent ? 'bg-raised ring-2 ring-inset ring-accent' : ''
            }`}
          >
            <div className={`border-b border-line text-[11px] leading-5 sm:text-xs ${isCurrent ? 'font-semibold text-accent' : 'text-muted'}`}>
              {i + 1}
            </div>
            <div className="flex h-7 items-center text-sm sm:h-8 sm:text-base">
              {Array.from({ length: slots }, (_, s) => (
                <span key={s} className="flex h-full flex-1 items-center justify-center border-l border-line first:border-l-0">
                  {shots[s] &&
                    (isSplitShot(shots[s]) ? (
                      // Splits are circled, like on a paper sheet
                      <span className="inline-block h-5 w-5 rounded-full leading-5 ring-1 ring-danger">
                        {shotMark(shots[s])}
                      </span>
                    ) : (
                      shotMark(shots[s])
                    ))}
                </span>
              ))}
            </div>
            <div className="h-8 border-t border-line text-base leading-8 font-semibold sm:h-10 sm:text-xl sm:leading-10">
              {totals[i] ?? ''}
            </div>
            {showLeaves && (
              <div className="min-h-6 space-y-0.5 border-t border-line px-0.5 py-1">
                {game.frames[i] &&
                  frameFirstBalls(game.frames[i], i)
                    .filter((b) => b.leave !== 0)
                    .map((b, k) => <MiniDeck key={k} leave={b.leave} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
