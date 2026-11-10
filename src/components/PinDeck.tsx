import { useState, useCallback } from 'react'
import { isPinStanding } from '../pins/pins'

type PinDeckProps = {
  onConfirm: (pinsStanding: number) => void
  disabled?: boolean
  pinsBefore?: number   // mask of pins in play; pins not in it can't be tapped
  isFreshRack?: boolean // true → Strike button; false → Spare / Missed buttons
}

// Pin layout from bowler's perspective, drawn top to bottom on screen
// Back row (top of screen):  7  8  9  10
//                             4  5  6
//                              2  3
// Head pin (bottom):            1
const PIN_ROWS = [[7, 8, 9, 10], [4, 5, 6], [2, 3], [1]]

export function PinDeck({
  onConfirm,
  disabled = false,
  pinsBefore = 1023,
  isFreshRack = true,
}: PinDeckProps) {
  // Bitmask of pins the bowler has tapped as "still standing"
  const [standing, setStanding] = useState(0)

  const togglePin = useCallback(
    (pin: number) => {
      if (disabled) return
      if (!isPinStanding(pinsBefore, pin)) return // already down, not in play
      // XOR flips the bit: standing becomes down, down becomes standing
      setStanding((prev) => prev ^ (1 << (pin - 1)))
    },
    [disabled, pinsBefore]
  )

  const handleConfirm = () => {
    onConfirm(standing)
    setStanding(0) // reset for next shot
  }

  // Any tap means a partial result, so the shortcuts (Strike/Spare/Missed) would contradict it
  const hasTaps = standing !== 0

  // Strike (fresh rack) and Spare (second ball) both mean "nothing left standing"
  const handleAllDown = () => {
    onConfirm(0)
    setStanding(0)
  }

  // Missed: every pin that was up is still up
  const handleMissed = () => {
    onConfirm(pinsBefore)
    setStanding(0)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pin triangle */}
      <div className="flex flex-col items-center gap-2">
        {PIN_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((pin) => {
              const inPlay = isPinStanding(pinsBefore, pin)
              return (
              <button
                key={pin}
                onClick={() => togglePin(pin)}
                disabled={disabled || !inPlay}
                className={`
                  w-12 h-12 rounded-full text-sm font-bold
                  transition-colors duration-150
                  ${
                    !inPlay
                      ? 'bg-transparent text-gray-600 border-2 border-dashed border-gray-700'
                      : isPinStanding(standing, pin)
                        ? 'bg-white text-gray-900 border-2 border-gray-900 shadow-md'
                        : 'bg-gray-300 text-gray-500 border-2 border-gray-300'
                  }
                  ${disabled ? '' : 'active:scale-95'}
                `}
                aria-label={`Pin ${pin}${!inPlay ? ' already down' : isPinStanding(standing, pin) ? ' standing' : ' down'}`}
              >
                {pin}
              </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={handleAllDown}
          disabled={disabled || hasTaps}
          className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-lg
                     active:scale-95 transition-transform disabled:opacity-50"
        >
          {isFreshRack ? 'Strike' : 'Spare'}
        </button>
        {!isFreshRack && (
          <button
            onClick={handleMissed}
            disabled={disabled || hasTaps}
            className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-lg
                       active:scale-95 transition-transform disabled:opacity-50"
          >
            Missed
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={disabled}
          className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-lg
                     active:scale-95 transition-transform disabled:opacity-50"
        >
          Confirm
        </button>
      </div>

      {/* Clear selection */}
      {standing !== 0 && (
        <button
          onClick={() => setStanding(0)}
          disabled={disabled}
          className="text-sm text-gray-500 underline disabled:opacity-50"
        >
          Clear selection
        </button>
      )}
    </div>
  )
}