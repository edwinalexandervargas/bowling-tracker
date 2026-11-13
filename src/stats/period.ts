import type { Session } from '../types'

export type Period = 'week' | 'month' | 'year'

// TODO(Edwin): write this test-first in period.test.ts.
// Return only the sessions whose date falls in the current week / month / year
// relative to `now`. Decide: is "week" the last 7 days or since Monday?
// Stub: returns everything so the Home screen renders meanwhile.
export function sessionsInPeriod(sessions: Session[], _period: Period, _now: Date = new Date()): Session[] {
  return sessions
}
