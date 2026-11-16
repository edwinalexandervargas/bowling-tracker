import { describe, it, expect } from 'vitest'
import type { Ball, BallSpec } from '../types'
import { ballToDraft, emptyBallDraft } from './ballDraft'

const spec: BallSpec = { id: 's1', brand: 'Storm', name: 'Phase II', rg: 2.48, differential: 0.051, coverstock: 'TX-16' }

describe('ballToDraft', () => {
  it('fills the form from a 2LS ball, writing inches the way they were typed', () => {
    const ball: Ball = { id: 'b1', specId: 's1', nickname: 'Phase II #2', weight: 15, surface: '2000 Abralon', layout: { system: '2ls', pinToPap: 4.5, psaToPap: 4, pinBuffer: 0.625 } }
    expect(ballToDraft(ball, spec)).toEqual({
      brand: 'Storm', name: 'Phase II', rg: '2.48', differential: '0.051', massBiasDiff: '', coverstock: 'TX-16',
      nickname: 'Phase II #2', weight: '15', surface: '2000 Abralon',
      system: '2ls', layoutValues: ['4 1/2', '4', '5/8'],
    })
  })

  it('fills a dual angle layout: degrees, inches, degrees', () => {
    const ball: Ball = { id: 'b1', specId: 's1', surface: '500 Polished', layout: { system: 'dual-angle', drillingAngle: 45, pinToPap: 4.5, valAngle: 30 } }
    expect(ballToDraft(ball, spec)).toMatchObject({ system: 'dual-angle', layoutValues: ['45', '4 1/2', '30'] })
  })

  it('leaves optional fields blank when the ball has none', () => {
    const ball: Ball = { id: 'b1', specId: 's1', surface: '2000', layout: { system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 } }
    expect(ballToDraft(ball, { id: 's1', brand: 'Storm', name: 'Phase II' })).toMatchObject({ rg: '', differential: '', massBiasDiff: '', coverstock: '', nickname: '', weight: '' })
  })

  it('still opens when the ball model has gone missing', () => {
    const ball: Ball = { id: 'b1', specId: 'gone', surface: '2000', layout: { system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 } }
    expect(ballToDraft(ball, undefined)).toMatchObject({ brand: '', name: '', surface: '2000' })
  })
})

describe('emptyBallDraft', () => {
  it('starts a new ball with the default weight and an empty 2LS layout', () => {
    expect(emptyBallDraft(15)).toMatchObject({ brand: '', weight: '15', system: '2ls', layoutValues: ['', '', ''] })
  })
})
