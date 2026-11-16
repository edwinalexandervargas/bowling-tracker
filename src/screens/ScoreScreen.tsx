import { ScoreEntry } from '../components/ScoreEntry'

export function ScoreScreen() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 short:max-w-none short:space-y-2">
      {/* Sideways on a phone every pixel of height goes to the pins, so the title is for screen readers only. */}
      <h1 className="display text-2xl short:sr-only">Score</h1>
      <ScoreEntry />
    </div>
  )
}
