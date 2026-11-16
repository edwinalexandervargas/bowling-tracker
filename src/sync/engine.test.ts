import { describe, it, expect } from 'vitest'
import { syncOnce } from './engine'
import { pendingCount } from './tracker'
import { PROFILE_ID } from './tables'
import { FakeServer, Device } from './fakes'

const sync = (device: Device, server: FakeServer) =>
  syncOnce({ remote: server.remote, local: device.local, state: device.store, now: device.now })

const night = (id: string, eventName = 'Brunswick') => ({ id, date: '2026-11-16T03:00:00.000Z', type: 'league', eventName, games: [] })

describe('syncOnce: one device', () => {
  it('uploads what the device already had before sync was switched on', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.data = { ...phone.data, sessions: [night('n1')], balls: [{ id: 'b1', specId: 's1', surface: '2000', layout: {} }] }

    const result = await sync(phone, server)

    expect(result).toEqual({ pulled: 0, pushed: 2 })
    expect(server.row('sessions', 'n1')).toMatchObject({ event_name: 'Brunswick', deleted_at: null })
    expect(pendingCount(phone.state.meta)).toBe(0)
  })

  it('a second sync with no changes writes nothing', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.edit(1, () => ({ sessions: [night('n1')] }))
    await sync(phone, server)
    const writesBefore = server.writes

    expect(await sync(phone, server)).toEqual({ pulled: 0, pushed: 0 })
    expect(server.writes).toBe(writesBefore)
  })

  it('with no signal the sync fails and everything stays waiting; it uploads once signal is back', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.edit(1, () => ({ sessions: [night('n1')] }))

    server.online = false
    await expect(sync(phone, server)).rejects.toThrow('Failed to fetch')
    expect(pendingCount(phone.state.meta)).toBe(1)
    expect(phone.ids('sessions')).toEqual(['n1'])   // nothing lost locally

    server.online = true
    await sync(phone, server)
    expect(pendingCount(phone.state.meta)).toBe(0)
    expect(server.row('sessions', 'n1')).toBeDefined()
  })

  it('a tap that lands while an upload is in flight is not marked as uploaded', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.edit(1, () => ({ sessions: [night('n1', 'first')] }))
    server.duringUpload = () => {
      server.duringUpload = null
      phone.edit(2, () => ({ sessions: [night('n1', 'second')] }))
    }

    await sync(phone, server)
    expect(server.row('sessions', 'n1')!.event_name).toBe('first')
    expect(pendingCount(phone.state.meta)).toBe(1)   // the second edit is still waiting

    await sync(phone, server)
    expect(server.row('sessions', 'n1')!.event_name).toBe('second')
    expect(pendingCount(phone.state.meta)).toBe(0)
  })

  it('asks the server only for what changed since last time, re-reading the last 30 seconds', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.edit(1, () => ({ sessions: [night('n1')] }))
    await sync(phone, server)   // first sync: nothing known yet, so it asks for everything
    await sync(phone, server)   // picks up its own upload and remembers how far it has read
    server.pulls = []
    await sync(phone, server)

    const asked = server.pulls.find((p) => p.table === 'sessions')!
    const newestSeen = Date.parse(server.row('sessions', 'n1')!.synced_at!)
    expect(Date.parse(asked.since!)).toBe(newestSeen - 30_000)
    // tables with nothing on the server yet are still asked for in full
    expect(server.pulls.find((p) => p.table === 'balls')!.since).toBeNull()
  })

  it('the profile syncs as a single record', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.edit(1, () => ({ profiles: [{ id: PROFILE_ID, papOver: 4.5, papUp: 0.625 }] }))
    await sync(phone, server)
    expect(server.row('profiles', PROFILE_ID)).toMatchObject({ pap_over: 4.5, pap_up: 0.625 })
  })
})

describe('syncOnce: two devices', () => {
  it('a night bowled on the phone appears on the laptop', async () => {
    const server = new FakeServer()
    const phone = new Device(), laptop = new Device()
    phone.edit(1, () => ({ sessions: [night('n1')] }))
    await sync(phone, server)

    expect(await sync(laptop, server)).toEqual({ pulled: 1, pushed: 0 })
    expect(laptop.data.sessions).toEqual([night('n1')])
  })

  it('downloaded records are not uploaded back (no ping-pong)', async () => {
    const server = new FakeServer()
    const phone = new Device(), laptop = new Device()
    phone.edit(1, () => ({ sessions: [night('n1')] }))
    await sync(phone, server)
    await sync(laptop, server)
    const writesBefore = server.writes

    await sync(laptop, server)
    await sync(phone, server)
    expect(server.writes).toBe(writesBefore)
  })

  it('first sign-in on a device that already has data: both sets are kept', async () => {
    const server = new FakeServer()
    const phone = new Device(), laptop = new Device()
    phone.data = { ...phone.data, sessions: [night('phone-night')] }
    laptop.data = { ...laptop.data, sessions: [night('laptop-night')] }

    await sync(phone, server)
    await sync(laptop, server)
    await sync(phone, server)

    expect(phone.ids('sessions')).toEqual(['laptop-night', 'phone-night'])
    expect(laptop.ids('sessions')).toEqual(['laptop-night', 'phone-night'])
  })

  it('same night edited on both: the newer edit wins on both, whoever syncs first', async () => {
    for (const firstToSync of ['older', 'newer'] as const) {
      const server = new FakeServer()
      const phone = new Device(), laptop = new Device()
      phone.edit(1, () => ({ sessions: [night('n1', 'original')] }))
      await sync(phone, server)
      await sync(laptop, server)

      phone.edit(10, () => ({ sessions: [night('n1', 'older edit')] }))    // 20:10
      laptop.edit(20, () => ({ sessions: [night('n1', 'newer edit')] }))   // 20:20

      const [first, second] = firstToSync === 'older' ? [phone, laptop] : [laptop, phone]
      await sync(first, server)
      await sync(second, server)
      await sync(first, server)

      expect(phone.data.sessions[0].eventName, firstToSync).toBe('newer edit')
      expect(laptop.data.sessions[0].eventName, firstToSync).toBe('newer edit')
      expect(server.row('sessions', 'n1')!.event_name, firstToSync).toBe('newer edit')
      expect(pendingCount(phone.state.meta) + pendingCount(laptop.state.meta), firstToSync).toBe(0)
    }
  })

  it('edits to different nights never collide', async () => {
    const server = new FakeServer()
    const phone = new Device(), laptop = new Device()
    phone.edit(1, () => ({ sessions: [night('n1'), night('n2')] }))
    await sync(phone, server)
    await sync(laptop, server)

    phone.edit(10, (d) => ({ sessions: d.sessions.map((s) => (s.id === 'n1' ? night('n1', 'phone edit') : s)) }))
    laptop.edit(20, (d) => ({ sessions: d.sessions.map((s) => (s.id === 'n2' ? night('n2', 'laptop edit') : s)) }))
    await sync(phone, server)
    await sync(laptop, server)
    await sync(phone, server)

    for (const device of [phone, laptop]) {
      expect(device.data.sessions.map((s) => s.eventName).sort()).toEqual(['laptop edit', 'phone edit'])
    }
  })

  it('a ball removed on one device disappears from the other and does not come back', async () => {
    const server = new FakeServer()
    const phone = new Device(), laptop = new Device()
    phone.edit(1, () => ({ balls: [{ id: 'b1' }, { id: 'b2' }] }))
    await sync(phone, server)
    await sync(laptop, server)

    phone.edit(5, (d) => ({ balls: d.balls.filter((b) => b.id !== 'b1') }))
    await sync(phone, server)
    await sync(laptop, server)
    await sync(phone, server)

    expect(phone.ids('balls')).toEqual(['b2'])
    expect(laptop.ids('balls')).toEqual(['b2'])
    expect(server.row('balls', 'b1')!.deleted_at).not.toBeNull()
    expect(pendingCount(phone.state.meta)).toBe(0)
  })

  it('a record created and removed before it ever uploaded leaves no trace', async () => {
    const server = new FakeServer()
    const phone = new Device()
    phone.edit(1, () => ({ balls: [{ id: 'b1' }] }))
    phone.edit(2, () => ({ balls: [] }))

    await sync(phone, server)
    expect(server.row('balls', 'b1')).toBeUndefined()
    expect(phone.state.meta).toEqual({})
  })
})
