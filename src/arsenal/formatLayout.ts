import type { Layout } from '../types'
import { formatInches } from '../measure/inches'

// Three numbers, in the order the driller writes them.
// A real multiplication sign, not the letter x: the app's font turns an x
// between two digits into one on its own, but not next to a degree sign,
// which left a mix of both on screen.
export function formatLayout(layout: Layout): string {
  if (layout.system === '2ls') {
    return `${formatInches(layout.pinToPap)} × ${formatInches(layout.psaToPap)} × ${formatInches(layout.pinBuffer)}`
  }
  return `${layout.drillingAngle}° × ${formatInches(layout.pinToPap)} × ${layout.valAngle}°`
}
