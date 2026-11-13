import { PIN_POSITIONS, isSplit, leaveName } from '../pins/leaves'
import { isPinStanding } from '../pins/pins'

// Tiny pin deck for a scoresheet frame, from the bowler's view (head pin at the bottom).
// Standing pins are filled; knocked-down pins are faint outlines. Splits are red.
export function MiniDeck({ leave }: { leave: number }) {
  const split = isSplit(leave)
  return (
    <svg viewBox="0 0 28 16" className="mx-auto w-full max-w-7" role="img" aria-label={`Left ${leaveName(leave)}${split ? ' (split)' : ''}`}>
      {Object.entries(PIN_POSITIONS).map(([pin, { x, y }]) => {
        const standing = isPinStanding(leave, Number(pin))
        return (
          <circle
            key={pin}
            cx={(x + 3) * 4 + 2}
            cy={(3 - y) * 4 + 2}
            r={1.6}
            className={
              standing
                ? split ? 'fill-red-400' : 'fill-white'
                : 'fill-none stroke-gray-600'
            }
            strokeWidth={0.5}
          />
        )
      })}
    </svg>
  )
}
