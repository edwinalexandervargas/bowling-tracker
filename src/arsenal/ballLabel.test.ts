import { describe, it, expect } from 'vitest'
import type { Ball, BallSpec } from '../types'
import { ballName } from './ballLabel'

const specs: BallSpec[] = [{ id: 's1', name: 'Phase II', brand: 'Storm' }]
const ball = (o: Partial<Ball> = {}): Ball => ({
  id: 'b1', specId: 's1', surface: '500', layout: { system: '2ls', pinToPap: 5, psaToPap: 4, pinBuffer: 3 }, ...o,
})

describe('ballName', () => {
  it('prefers nickname, then spec name, then Unknown ball', () => {
    expect(ballName(ball({ nickname: 'Phase #2' }), specs)).toBe('Phase #2')
    expect(ballName(ball(), specs)).toBe('Phase II')
    expect(ballName(ball({ specId: 'gone' }), specs)).toBe('Unknown ball')
    expect(ballName(undefined, specs)).toBe('Unknown ball')
  })
})
