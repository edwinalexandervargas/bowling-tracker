import { useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { bingoBoard, type BingoBoard, type PotStatus } from '../sidepots/bingo'
import { threeSixNine, type ThreeSixNine } from '../sidepots/threeSixNine'
import { bingoLooks, threeSixNineLooks, wonLinesText, closestNeed } from '../sidepots/looks'
import { frameMark } from '../sidepots/frameMark'
import type { Game, Session } from '../types'
import { Page, Card } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { PotSquare, PotLegend } from '../components/PotSquare'
import { inputClass, labelClass } from '../components/styles'

const TYPE_LABEL = { league: 'League', tournament: 'Tournament', practice: 'Practice' } as const

const nightName = (s: Session) =>
  `${s.eventName ?? TYPE_LABEL[s.type]}, ${new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

// X or / for a frame that earned a mark; nothing otherwise.
function markText(games: Game[], gameIndex: number, frameIndex: number): string | undefined {
  const mark = frameMark(games[gameIndex]?.frames[frameIndex])
  return mark === 'strike' ? 'X' : mark === 'spare' ? '/' : undefined
}

// A pot that is still alive on a finished night was simply not won.
type Outcome = PotStatus | 'not-won'
const outcome = (status: PotStatus, live: boolean): Outcome => (status === 'alive' && !live ? 'not-won' : status)

const OUTCOME: Record<Outcome, { title: string; icon: IconName; className: string }> = {
  secured: { title: 'Secured', icon: 'check', className: 'bg-accent text-on-accent' },
  lost: { title: 'Lost', icon: 'close', className: 'text-danger ring-1 ring-danger' },
  alive: { title: 'Alive', icon: 'target', className: 'bg-surface text-ink ring-1 ring-line' },
  'not-won': { title: 'Not won', icon: 'close', className: 'bg-surface text-muted ring-1 ring-line' },
}

// The pot's state in words and with an icon, so it never rests on colour.
function PotBanner({ state, detail }: { state: Outcome; detail: string }) {
  const { title, icon, className } = OUTCOME[state]
  return (
    <p role="status" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${className}`}>
      <Icon name={icon} />
      <span>
        <span className="font-semibold">{title}.</span> {detail}
      </span>
    </p>
  )
}

function bingoDetail(board: BingoBoard, state: Outcome): string {
  if (state === 'secured') return wonLinesText(board.wonLineIds)
  if (state === 'lost') return 'No line can be five strikes or five spares now.'
  if (state === 'not-won') return 'The night ended before a line was completed.'
  const open = board.lines.filter((l) => l.status === 'alive').length
  const need = closestNeed(board)
  return need ? `${open} of 12 lines open. The closest needs ${need}.` : `${open} of 12 lines open.`
}

function BingoSection({ games, live }: { games: Game[]; live: boolean }) {
  const board = useMemo(() => bingoBoard(games), [games])
  const looks = useMemo(() => bingoLooks(board, live), [board, live])
  const state = outcome(board.status, live)

  return (
    <section aria-labelledby="bingo-title" className="space-y-3">
      <h2 id="bingo-title" className="text-lg font-semibold">Bingo</h2>
      <PotBanner state={state} detail={bingoDetail(board, state)} />
      {/* A lost board fades as a whole; the banner above says why. */}
      <ul aria-label="Bingo board, 5 by 5" className={`grid max-w-md grid-cols-5 gap-1.5 sm:gap-2 ${state === 'lost' ? 'opacity-70' : ''}`}>
        {board.squares.map((sq) => (
          <PotSquare
            key={sq.index}
            look={looks[sq.index]}
            label={`G${sq.gameIndex + 1} F${sq.frameIndex + 1}`}
            mark={markText(games, sq.gameIndex, sq.frameIndex)}
          />
        ))}
      </ul>
      <PotLegend />
      <p className="text-xs text-muted">Five strikes or five spares in a row, column or diagonal secures the pot. A line holding one of each is dead.</p>
    </section>
  )
}

function threeSixNineDetail(pot: ThreeSixNine, state: Outcome): string {
  if (state === 'secured') return 'Strikes in frames 3, 6 and 9.'
  if (state === 'not-won') return 'The night ended before frame 9 of game 2.'
  const frameOf = (display: string) => pot.squares.find((sq) => sq.display === display)
  if (state === 'lost') return `Frame ${frameOf('miss')!.frameIndex + 1} wasn't a strike.`
  return `Next: a strike in frame ${frameOf('target')!.frameIndex + 1} of game 2.`
}

function ThreeSixNineSection({ games, live }: { games: Game[]; live: boolean }) {
  const pot = useMemo(() => threeSixNine(games), [games])
  const looks = useMemo(() => threeSixNineLooks(pot, live), [pot, live])
  const state = outcome(pot.status, live)

  return (
    <section aria-labelledby="three-six-nine-title" className="space-y-3">
      <h2 id="three-six-nine-title" className="text-lg font-semibold">3-6-9</h2>
      <PotBanner state={state} detail={threeSixNineDetail(pot, state)} />
      <ul aria-label="3-6-9 board" className={`grid max-w-xs grid-cols-3 gap-2 ${state === 'lost' ? 'opacity-70' : ''}`}>
        {pot.squares.map((sq, i) => (
          <PotSquare
            key={sq.frameIndex}
            look={looks[i]}
            label={`G2 F${sq.frameIndex + 1}`}
            mark={markText(games, sq.gameIndex, sq.frameIndex)}
          />
        ))}
      </ul>
      <p className="text-xs text-muted">Frames 3, 6 and 9 of game 2 must all be strikes. The first one that isn't ends it.</p>
    </section>
  )
}

// Both pots for one night. Follows the active session; with none, shows the
// most recent night. Everything is derived from the stored shots at render.
export function SidePotsScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const liveId = useGameStore((s) => s.activeEntry?.sessionId)
  // null = follow the default (the live night, else the newest one)
  const [pickedId, setPickedId] = useState<string | null>(null)

  const newestFirst = useMemo(() => [...sessions].sort((a, b) => b.date.localeCompare(a.date)), [sessions])
  const session =
    newestFirst.find((s) => s.id === pickedId) ?? newestFirst.find((s) => s.id === liveId) ?? newestFirst[0]

  if (!session) {
    return (
      <Page title="Side pots" wide>
        <Card className="p-6 text-muted">No nights yet. Start one on the Score tab and the boards fill in as you bowl.</Card>
      </Page>
    )
  }

  const live = session.id === liveId

  return (
    <Page title="Side pots" wide>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block w-full max-w-sm">
          <span className={labelClass}>Night</span>
          <select value={session.id} onChange={(e) => setPickedId(e.target.value)} className={inputClass}>
            {newestFirst.map((s) => (
              <option key={s.id} value={s.id}>
                {nightName(s)}{s.id === liveId ? ' (live)' : ''}
              </option>
            ))}
          </select>
        </label>
        <p className="flex min-h-tap items-center gap-2 text-sm font-medium">
          {/* filled dot = live, hollow dot = finished */}
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${live ? 'bg-accent' : 'ring-1 ring-muted'}`} />
          {live ? 'Live: updates as you score' : 'Finished night'}
        </p>
      </div>

      {/* Stacked on phones and tablets; side by side from 1024px and on a phone held sideways. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start short:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] short:items-start">
        <BingoSection games={session.games} live={live} />
        <ThreeSixNineSection games={session.games} live={live} />
      </div>
    </Page>
  )
}
