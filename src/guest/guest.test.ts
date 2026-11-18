import { afterEach, describe, it, expect, vi } from 'vitest'
import { gameScore } from '../stats/stats'
import { bingoBoard } from '../sidepots/bingo'
import { threeSixNine } from '../sidepots/threeSixNine'
import type { Session } from '../types'
import { openApp, MemoryStorage, startNight, bowlPerfectGame, bowlAllSpares } from './testEnv'
import { sampleData, sampleFrame, isSampleId } from './sampleData'
import { visitStats } from './visitStats'

afterEach(() => vi.unstubAllGlobals())

const accountNight: Session = { id: 'account-night', date: '2026-11-01T03:00:00.000Z', type: 'league', eventName: 'Thursday', games: [] }

// A device that was signed in before: the account's nights are saved under the normal key.
function deviceWithAccountData() {
  const storage = new MemoryStorage()
  storage.setItem('bowling-tracker', JSON.stringify({ state: { sessions: [accountNight], balls: [], ballSpecs: [], patterns: [], seasonCloses: [], profile: null, activeEntry: null }, version: 0 }))
  return storage
}

async function bowlThreeGameNight(app: Awaited<ReturnType<typeof openApp>>) {
  const { useGameStore } = app
  startNight(useGameStore)
  bowlPerfectGame(useGameStore)
  useGameStore.getState().nextGame()
  bowlAllSpares(useGameStore)
  useGameStore.getState().nextGame()
  bowlPerfectGame(useGameStore)
  useGameStore.getState().endSession()
  return useGameStore.getState().sessions.find((s) => s.id === 'guest-night')!
}

describe('guest scoring', () => {
  it('a guest can score a full 3-game league night', async () => {
    const app = await openApp()
    app.enterGuest()

    const night = await bowlThreeGameNight(app)

    expect(night.games.map(gameScore)).toEqual([300, 190, 300])
    expect(app.useGameStore.getState().activeEntry).toBeNull()
  })

  it('shows the guest their own stats for the visit, without the sample nights', async () => {
    const app = await openApp()
    app.enterGuest()
    await bowlThreeGameNight(app)

    const visit = visitStats(app.useGameStore.getState().sessions)

    expect(visit.sessions).toBe(1)
    expect(visit.score.games).toBe(3)
    // 12 + 12 strikes from 34 fresh racks (12 + 10 frames and the fill ball + 12)
    expect(visit.shots.strikes).toBe(24)
    expect(visit.shots.spareChances).toBe(10)
    expect(visit.shots.spares).toBe(10)
    expect(visit.leaves[0]).toMatchObject({ leave: 512, attempts: 10, converted: 10 })
  })

  it('keeps a game in progress through a refresh', async () => {
    const storage = new MemoryStorage()
    const first = await openApp(storage)
    first.enterGuest()
    startNight(first.useGameStore)
    first.useGameStore.getState().recordShot(0)
    first.useGameStore.getState().recordShot(0)

    const reopened = await openApp(storage)

    expect(reopened.useGuestStore.getState().active).toBe(true)
    expect(reopened.useGameStore.getState().activeEntry).toMatchObject({ sessionId: 'guest-night', frameIndex: 2 })
  })
})

describe('guest side pots', () => {
  it('runs bingo and 3-6-9 on the night the guest bowled', async () => {
    const app = await openApp()
    app.enterGuest()
    const night = await bowlThreeGameNight(app)

    // Game 1 is all strikes, so its row of the board is five strikes.
    expect(bingoBoard(night.games).status).toBe('secured')
    // Game 2 has no strikes, so frame 3 ends 3-6-9.
    expect(threeSixNine(night.games).status).toBe('lost')
  })

  it('has sample nights for the side pots screen to show before the guest bowls', async () => {
    const app = await openApp()
    app.enterGuest()
    const sample = app.useGameStore.getState().sessions
    expect(sample.length).toBeGreaterThan(0)
    for (const night of sample) {
      expect(night.games).toHaveLength(3)
      expect(night.games.every((g) => gameScore(g) !== null)).toBe(true) // every sample game is complete
    }
  })
})

describe('blocked actions show the sign-up prompt', () => {
  const ball = { id: 'b1', specId: 's1', surface: '2000', layout: { system: '2ls' as const, pinToPap: 5, psaToPap: 4, pinBuffer: 3 } }
  const pattern = { id: 'p1', kind: 'house' as const, name: 'Pinz' }

  type App = Awaited<ReturnType<typeof openApp>>
  const actions: [string, (app: App) => void][] = [
    ['add a ball', (a) => a.useGameStore.getState().addBall(ball)],
    ['edit a ball', (a) => a.useGameStore.getState().updateBall('sample-ball-1', { surface: '500' })],
    ['delete a ball', (a) => a.useGameStore.getState().removeBall('sample-ball-1')],
    ['add a ball model', (a) => a.useGameStore.getState().addBallSpec({ id: 's9', brand: 'X', name: 'Y' })],
    ['edit a ball model', (a) => a.useGameStore.getState().updateBallSpec('sample-spec-1', { rg: 2.5 })],
    ['add a pattern', (a) => a.useGameStore.getState().addPattern(pattern)],
    ['edit a pattern', (a) => a.useGameStore.getState().updatePattern({ ...pattern, id: 'sample-pattern-house' })],
    ['delete a pattern', (a) => a.useGameStore.getState().removePattern('sample-pattern-house')],
    ['save a PAP or profile', (a) => a.useGameStore.getState().updateProfile({ papOver: 4 })],
    ['close a season', (a) => a.useGameStore.getState().closeSeason('thursday night mixed')],
    ['reopen a season', (a) => a.useGameStore.getState().undoCloseSeason('thursday night mixed')],
    ['reset nights', (a) => a.useGameStore.getState().resetNights()],
  ]

  it.each(actions)('trying to %s changes nothing and opens the prompt', async (_name, act) => {
    const app = await openApp()
    app.enterGuest()
    const before = app.useGameStore.getState()

    act(app)

    const after = app.useGameStore.getState()
    for (const key of ['profile', 'balls', 'ballSpecs', 'patterns', 'sessions', 'seasonCloses'] as const) {
      expect(after[key]).toBe(before[key])
    }
    expect(app.useGuestStore.getState().promptOpen).toBe(true)
  })

  it('the same actions work as normal outside guest mode', async () => {
    const app = await openApp()
    app.useGameStore.getState().addBall(ball)
    app.useGameStore.getState().addPattern(pattern)
    expect(app.useGameStore.getState().balls).toEqual([ball])
    expect(app.useGameStore.getState().patterns).toEqual([pattern])
    expect(app.useGuestStore.getState().promptOpen).toBe(false)
  })

  it('blockedForGuest says stop only in guest mode', async () => {
    const app = await openApp()
    expect(app.blockedForGuest()).toBe(false)
    app.enterGuest()
    expect(app.blockedForGuest()).toBe(true)
    app.useGuestStore.getState().closePrompt()
    expect(app.useGuestStore.getState().promptOpen).toBe(false)
  })
})

describe('guest data stays apart from the account on this device', () => {
  it("a guest sees sample data, never the account's nights", async () => {
    const app = await openApp(deviceWithAccountData())
    expect(app.useGameStore.getState().sessions.map((s) => s.id)).toEqual(['account-night'])

    app.enterGuest()

    const ids = app.useGameStore.getState().sessions.map((s) => s.id)
    expect(ids).not.toContain('account-night')
    expect(ids.every(isSampleId)).toBe(true)
  })

  it("what a guest does never touches the account's saved copy, and leaving brings it back", async () => {
    const storage = deviceWithAccountData()
    const saved = storage.getItem('bowling-tracker')
    const app = await openApp(storage)
    app.enterGuest()
    await bowlThreeGameNight(app)

    expect(storage.getItem('bowling-tracker')).toBe(saved)

    await app.leaveGuest()

    expect(app.useGuestStore.getState().active).toBe(false)
    expect(app.useGameStore.getState().sessions.map((s) => s.id)).toEqual(['account-night'])
    expect(storage.getItem('bowling-tracker-guest')).toBeNull()
  })

  it('leaving on a fresh device leaves an empty app, not the sample data', async () => {
    const app = await openApp()
    app.enterGuest()
    await app.leaveGuest()
    const s = app.useGameStore.getState()
    expect([s.sessions, s.balls, s.patterns]).toEqual([[], [], []])
    expect(s.profile).toBeNull()
  })
})

describe('keeping guest data on sign-up', () => {
  it('keeps the nights the guest bowled and leaves the sample ones behind', async () => {
    const app = await openApp()
    app.enterGuest()
    await bowlThreeGameNight(app)

    const kept = app.guestNightsToKeep(app.useGameStore.getState().sessions)

    expect(kept.map((s) => s.id)).toEqual(['guest-night'])
  })

  it('drops empty nights, and turns a sample pattern into house shot', () => {
    const played = { id: 'n1', date: '2026-11-18T03:00:00.000Z', type: 'practice' as const, patternId: 'sample-pattern-sport', games: [{ id: 'g', frames: [sampleFrame('X')] }] }
    const empty = { id: 'n2', date: '2026-11-18T04:00:00.000Z', type: 'practice' as const, games: [{ id: 'g2', frames: [] }] }
    return openApp().then((app) => {
      const kept = app.guestNightsToKeep([played, empty])
      expect(kept).toHaveLength(1)
      expect(kept[0]).not.toHaveProperty('patternId')
    })
  })

  it("carries the kept nights across the email confirmation into the account's nights", async () => {
    const storage = deviceWithAccountData()
    const app = await openApp(storage)
    app.enterGuest()
    await bowlThreeGameNight(app)

    // Sign up, keep ticked: the nights wait on the device.
    app.saveCarry(app.guestNightsToKeep(app.useGameStore.getState().sessions))
    // Later, after clicking the email link, the app opens again and the account signs in.
    const later = await openApp(storage)
    await later.leaveGuest()
    const added = later.claimCarry()

    expect(added).toBe(1)
    expect(later.useGameStore.getState().sessions.map((s) => s.id)).toEqual(['account-night', 'guest-night'])
    expect(storage.getItem(later.CARRY_KEY)).toBeNull()
  })

  it('claims nothing while still in guest mode', async () => {
    const app = await openApp()
    app.enterGuest()
    await bowlThreeGameNight(app)
    app.saveCarry(app.guestNightsToKeep(app.useGameStore.getState().sessions))
    expect(app.claimCarry()).toBe(0)
  })

  it('drops kept nights that waited more than two days', async () => {
    const app = await openApp()
    app.saveCarry([accountNight], new Date('2026-11-01T00:00:00Z'))
    expect(app.readCarry(new Date('2026-11-04T00:00:00Z'))).toEqual([])
    expect(app.storage.getItem(app.CARRY_KEY)).toBeNull()
  })

  it('never adds a night twice', async () => {
    const app = await openApp()
    expect(app.mergeNights([accountNight], [accountNight])).toEqual([accountNight])
  })
})

describe('sample data', () => {
  it('every sample id is marked as sample', () => {
    const data = sampleData(new Date('2026-11-18T00:00:00Z'))
    const ids = [
      ...data.ballSpecs, ...data.balls, ...data.patterns, ...data.sessions,
      ...data.sessions.flatMap((s) => s.games),
    ].map((r) => r.id)
    expect(ids.every(isSampleId)).toBe(true)
    for (const ball of data.balls) expect(data.ballSpecs.some((s) => s.id === ball.specId)).toBe(true)
    for (const s of data.sessions) if (s.patternId) expect(data.patterns.some((p) => p.id === s.patternId)).toBe(true)
  })

  it('reads frames ball by ball', () => {
    expect(sampleFrame('X').shots).toEqual([{ pinsBefore: 1023, pinsAfter: 0 }])
    expect(sampleFrame('7.10,-').shots).toEqual([{ pinsBefore: 1023, pinsAfter: 576 }, { pinsBefore: 576, pinsAfter: 576 }])
    expect(sampleFrame('X,X,7').shots.map((s) => s.pinsBefore)).toEqual([1023, 1023, 1023])
  })
})
