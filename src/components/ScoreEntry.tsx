import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { nextShotContext } from '../game/game'
import { pinsStanding } from '../pins/pins'
import { PinDeck } from './PinDeck'

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

  const { frameIndex } = activeEntry
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
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg">
        Frame {frameIndex + 1} · Ball {shotNumber}
      </p>
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
    </div>
  )
}
