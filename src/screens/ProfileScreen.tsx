import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { parseInches, formatInches } from '../measure/inches'

export function ProfileScreen() {
  const profile = useGameStore((s) => s.profile)
  const setProfile = useGameStore((s) => s.setProfile)

  // Text inputs hold what the user types; we only parse on save.
  const [over, setOver] = useState(profile ? formatInches(profile.papOver) : '')
  // Vertical is stored signed: positive = up, negative = down. The input holds the size only.
  const [up, setUp] = useState(profile ? formatInches(Math.abs(profile.papUp)) : '')
  const [direction, setDirection] = useState<'up' | 'down'>(
    profile && profile.papUp < 0 ? 'down' : 'up',
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const papOver = parseInches(over)
    const papUp = parseInches(up)

    if (papOver === null || papUp === null) {
      setError('Use inches in 1/16 steps, like 4 1/2 or 5/8.')
      setSaved(false)
      return
    }

    const signedUp = direction === 'down' ? -papUp : papUp
    setProfile({ papOver, papUp: signedUp })
    setOver(formatInches(papOver)) // normalize, e.g. "4.5" -> "4 1/2"
    setUp(formatInches(papUp))
    setError(null)
    setSaved(true)
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <h2 className="text-lg font-semibold">PAP</h2>

        <label className="block">
          <span className="text-sm text-gray-400">Over (inches)</span>
          <input
            value={over}
            onChange={(e) => { setOver(e.target.value); setSaved(false) }}
            placeholder="4 1/2"
            inputMode="text"
            className="mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white"
          />
        </label>

        <div>
          <span className="text-sm text-gray-400">Vertical (inches)</span>
          <div className="mt-1 mb-2 flex gap-2">
            {(['up', 'down'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDirection(d); setSaved(false) }}
                className={`flex-1 rounded py-1 text-sm capitalize ${
                  direction === d ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="sr-only">Vertical distance</span>
          <input
            value={up}
            onChange={(e) => { setUp(e.target.value); setSaved(false) }}
            placeholder="5/8"
            inputMode="text"
            className="mt-1 w-full rounded bg-gray-800 px-3 py-2 text-white"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-400">Saved</p>}

        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-500"
        >
          Save PAP
        </button>
      </form>

      {profile && (
        <p className="mt-6 text-gray-300">
          Current PAP: {formatInches(profile.papOver)}" over,{' '}
          {formatInches(Math.abs(profile.papUp))}" {profile.papUp < 0 ? 'down' : 'up'}
        </p>
      )}
    </div>
  )
}
