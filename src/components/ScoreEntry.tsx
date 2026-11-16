import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { nextShotContext } from '../game/game'
import { pinsStanding } from '../pins/pins'
import { isFrameComplete } from '../scoring/frame'
import { gameToRolls } from '../game/gameToRolls'
import { score } from '../scoring/scorer'
import { PinDeck } from './PinDeck'
import { Scoresheet } from './Scoresheet'
import { SessionSetup } from './SessionSetup'
import { primaryButton, secondaryButton, quietTextButton } from './styles'

// Layer 3, step 1: connect the EXISTING PinDeck to the store.
// PinDeck itself is unchanged; this component is the only thing that knows about Zustand.
export function ScoreEntry() {
  // Select only what we render, so unrelated store changes don't re-render us
  const activeEntry = useGameStore((s) => s.activeEntry)
  const game = useGameStore((s) => {
    const e = s.activeEntry
    if (!e) return null
    return s.sessions.find((x) => x.id === e.sessionId)?.games[e.gameIndex] ?? null
  })
  const recordShot = useGameStore((s) => s.recordShot)
  const nextGame = useGameStore((s) => s.nextGame)
  const endSession = useGameStore((s) => s.endSession)
  const undoShot = useGameStore((s) => s.undoShot)

  const [error, setError] = useState<string | null>(null)

  if (!activeEntry || !game) {
    return <SessionSetup />
  }

  const { frameIndex, gameIndex } = activeEntry

  // Game is over when the 10th frame is complete (derived, not stored)
  const isGameOver = isFrameComplete(game.frames[9]?.shots ?? [], 9)

  if (isGameOver) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <Scoresheet game={game} currentFrame={-1} />
        <p className="text-muted">Game {gameIndex + 1} complete</p>
        <p className="num text-7xl font-semibold text-accent">{score(gameToRolls(game))}</p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <button onClick={nextGame} className={primaryButton}>
            Next game
          </button>
          <button onClick={endSession} className={secondaryButton}>
            End session
          </button>
        </div>
        <button
          onClick={() => {
            undoShot()
            setError(null)
          }}
          className={quietTextButton}
        >
          Undo last shot
        </button>
      </div>
    )
  }

  const { pinsBefore, isFreshRack } = nextShotContext(game, frameIndex)
  const shotNumber = (game.frames[frameIndex]?.shots.length ?? 0) + 1

  // addShot throws on impossible shots / complete frames; surface it instead of crashing
  const handleConfirm = (pinsAfter: number) => {
    try {
      recordShot(pinsAfter)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    // Phone held upright: the column fills the screen and the pins sit at the bottom,
    // inside thumb reach (9rem = the padding, title and bottom bar around this block).
    // Sideways there is no height to spare, so the sheet goes left and the pins right.
    <div className="flex min-h-[calc(100dvh-9rem-env(safe-area-inset-bottom))] w-full flex-col gap-4 md:min-h-0 short:grid short:min-h-0 short:grid-cols-2 short:items-center short:gap-6">
      <div className="space-y-3 short:space-y-2">
        <Scoresheet game={game} currentFrame={frameIndex} />

        <div className="text-center">
          <p className="text-lg font-medium short:text-base">
            Game {gameIndex + 1} · Frame {frameIndex + 1} · Ball {shotNumber}
          </p>
          <p className="text-sm text-muted">
            {isFreshRack ? 'Fresh rack' : `Pins up: ${pinsStanding(pinsBefore).join(', ')}`}
          </p>
        </div>

        {error && <p role="alert" className="text-center text-sm text-danger">{error}</p>}
      </div>

      <div className="mt-auto flex flex-col items-center md:mt-0 short:mt-0">
        {/* key forces a fresh PinDeck (cleared taps) for every new ball */}
        <PinDeck
          key={`${game.id}-${frameIndex}-${shotNumber}`}
          onConfirm={handleConfirm}
          pinsBefore={pinsBefore}
          isFreshRack={isFreshRack}
        />

        {game.frames.length > 0 && (
          <button
            onClick={() => {
              undoShot()
              setError(null)
            }}
            className={quietTextButton}
          >
            Undo last shot
          </button>
        )}
      </div>
    </div>
  )
}
