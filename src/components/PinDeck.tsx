import { useState, useCallback } from 'react'
import { isPinStanding } from '../pins/pins'
import { primaryButton, secondaryButton, dangerButton, quietTextButton } from './styles'

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

  // One main action at a time: Strike/Spare until a pin is tapped, then Confirm.
  const allDownClass = hasTaps ? secondaryButton : primaryButton
  const confirmClass = hasTaps ? primaryButton : secondaryButton

  return (
    <div className="flex flex-col items-center gap-4 short:gap-3">
      {/* Pin triangle. Pins are 52px (44px sideways), big enough for a thumb. */}
      <div className="flex flex-col items-center gap-2 short:gap-1.5">
        {PIN_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2 short:gap-1.5">
            {row.map((pin) => {
              const inPlay = isPinStanding(pinsBefore, pin)
              const tapped = isPinStanding(standing, pin)
              return (
                <button
                  key={pin}
                  onClick={() => togglePin(pin)}
                  disabled={disabled || !inPlay}
                  aria-pressed={inPlay ? tapped : undefined}
                  // Tapped (still standing) is a filled white pin with a ring;
                  // untapped is a dark outline; already down is dashed.
                  className={`num h-13 w-13 rounded-full text-lg font-semibold transition-colors duration-150 short:h-tap short:w-tap short:text-base ${
                    !inPlay
                      ? 'border-2 border-dashed border-line text-muted/50'
                      : tapped
                        ? 'bg-ink text-page ring-2 ring-accent ring-offset-2 ring-offset-page'
                        : 'bg-surface text-ink ring-1 ring-line'
                  } ${disabled ? '' : 'active:scale-95'}`}
                  aria-label={`Pin ${pin}${!inPlay ? ' already down' : tapped ? ' standing' : ' down'}`}
                >
                  {pin}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex w-full max-w-xs gap-2">
        <button onClick={handleAllDown} disabled={disabled || hasTaps} className={`${allDownClass} min-h-13 flex-1 px-2 short:min-h-tap`}>
          {isFreshRack ? 'Strike' : 'Spare'}
        </button>
        {!isFreshRack && (
          <button onClick={handleMissed} disabled={disabled || hasTaps} className={`${dangerButton} min-h-13 flex-1 px-2 short:min-h-tap`}>
            Missed
          </button>
        )}
        <button onClick={handleConfirm} disabled={disabled} className={`${confirmClass} min-h-13 flex-1 px-2 short:min-h-tap`}>
          Confirm
        </button>
      </div>

      {/* Clear selection. Upright, the row keeps its height so nothing below it jumps. */}
      <div className="flex min-h-tap items-center short:min-h-0">
        {hasTaps && (
          <button onClick={() => setStanding(0)} disabled={disabled} className={quietTextButton}>
            Clear selection
          </button>
        )}
      </div>
    </div>
  )
}