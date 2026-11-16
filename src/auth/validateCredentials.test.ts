import { describe, it, expect } from 'vitest'
import { validateCredentials, MIN_PASSWORD } from './validateCredentials'

describe('validateCredentials', () => {
  it('accepts a valid email and long-enough password', () => {
    expect(validateCredentials({ email: ' edwin@example.com ', password: 'x'.repeat(MIN_PASSWORD) })).toEqual({})
  })

  it('rejects a malformed email', () => {
    expect(validateCredentials({ email: 'edwin@', password: 'x'.repeat(MIN_PASSWORD) })).toHaveProperty('email')
  })

  it('rejects a short password', () => {
    expect(validateCredentials({ email: 'e@x.co', password: 'short' })).toHaveProperty('password')
  })
})
