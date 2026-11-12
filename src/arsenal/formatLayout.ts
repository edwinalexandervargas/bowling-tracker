import type { Layout } from '../types'
import { formatInches } from '../measure/inches'

// Three numbers, in the order the driller writes them.
export function formatLayout(layout: Layout): string {
  if (layout.system === '2ls') {
    return `${formatInches(layout.pinToPap)} x ${formatInches(layout.psaToPap)} x ${formatInches(layout.pinBuffer)}`
  }
  return `${layout.drillingAngle}° x ${formatInches(layout.pinToPap)} x ${layout.valAngle}°`
}
