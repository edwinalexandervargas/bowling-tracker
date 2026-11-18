import type { Session } from '../types'
import { summarize, type Summary } from '../stats/slices'
import { leaveStats, type LeaveStat } from '../stats/stats'
import { isSampleId } from './sampleData'

// Stats for the games a guest bowled this visit, leaving out the sample nights
// that fill the rest of the Stats screen.
export type VisitStats = Summary & { leaves: LeaveStat[] }

export function visitStats(sessions: Session[], topLeaves = 5): VisitStats {
  const own = sessions.filter((s) => !isSampleId(s.id))
  const frames = own.flatMap((s) => s.games.flatMap((g) => g.frames))
  return { ...summarize(own), leaves: leaveStats(frames).slice(0, topLeaves) }
}
