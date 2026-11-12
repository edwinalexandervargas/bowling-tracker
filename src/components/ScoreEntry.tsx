import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { nextShotContext } from '../game/game'
import { pinsStanding } from '../pins/pins'
import { isFrameComplete } from '../scoring/frame'
import { gameToRolls } from '../game/gameToRolls'
import { score } from '../scoring/scorer'
import { PinDeck } from './PinDeck'
import { Scoresheet } from './Scoresheet'
import { BallPicker } from './BallPicker'

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
  const startSession = useGameStore((s) => s.startSession)
  const startGame = useGameStore((s) => s.startGame)
  const recordShot = useGameStore((s) => s.recordShot)
  const nextGame = useGameStore((s) => s.nextGame)
  const undoShot = useGameStore((s) => s.undoShot)
  const balls = useGameStore((s) => s.balls)
  const ballSpecs = useGameStore((s) => s.ballSpecs)
  const changeBall = useGameStore((s) => s.changeBall)

  const [error, setError] = useState<string | null>(null)

  // Temporary dev entry point until the session-setup screen exists
  const handleStart = () => {
    startSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'practice',
      games: [],
    })
    startGame()
  }

  if (!activeEntry || !game) {
    return (
      <button onClick={handleStart} className="py-3 px-6 bg-blue-600 rounded-lg font-bold">
        Start practice game
      </button>
    )
  }

  const { frameIndex, gameIndex } = activeEntry

  // Game is over when the 10th frame is complete (derived, not stored)
  const isGameOver = isFrameComplete(game.frames[9]?.shots ?? [], 9)

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <Scoresheet game={game} currentFrame={-1} />
        <p className="text-gray-400">Game {gameIndex + 1} complete</p>
        <p className="text-5xl font-bold">{score(gameToRolls(game))}</p>
        <button
          onClick={nextGame}
          className="py-3 px-6 bg-blue-600 rounded-lg font-bold active:scale-95"
        >
          Next game
        </button>
        <button
          onClick={() => {
            undoShot()
            setError(null)
          }}
          className="text-sm text-gray-400 underline"
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
    <div className="flex flex-col items-center gap-4 w-full">
      <Scoresheet game={game} currentFrame={frameIndex} />

      <p className="text-lg">
        Game {gameIndex + 1} · Frame {frameIndex + 1} · Ball {shotNumber}
      </p>
      <BallPicker
        balls={balls}
        ballSpecs={ballSpecs}
        currentBallId={activeEntry.currentBallId}
        onChange={changeBall}
      />

      <p className="text-xs text-gray-400">
        {isFreshRack ? 'Fresh rack' : `Pins up: ${pinsStanding(pinsBefore).join(', ')}`}
      </p>

      {/* key forces a fresh PinDeck (cleared taps) for every new ball */}
      <PinDeck
        key={`${game.id}-${frameIndex}-${shotNumber}`}
        onConfirm={handleConfirm}
        pinsBefore={pinsBefore}
        isFreshRack={isFreshRack}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {game.frames.length > 0 && (
          <button
            onClick={() => {
              undoShot()
              setError(null)
            }}
            className="text-sm text-gray-400 underline"
          >
            Undo last shot
          </button>
      )}
    </div>
  )
}
