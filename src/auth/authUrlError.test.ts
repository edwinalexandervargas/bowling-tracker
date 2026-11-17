import { describe, it, expect } from 'vitest'
import { authUrlError } from './authUrlError'

describe('authUrlError', () => {
  it('finds nothing in a plain URL', () => {
    expect(authUrlError('', '')).toBeNull()
    expect(authUrlError('?night=3', '#top')).toBeNull()
  })

  it('explains a link that was already used, which is what a mail scanner leaves behind', () => {
    const hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    expect(authUrlError('', hash)).toBe(
      'That email link has already been used or has expired. Some mail providers open links to scan them, which uses the link up. Sign up again to get a new one.'
    )
  })

  it('reads the same error from the query string, not just the hash', () => {
    expect(authUrlError('?error_code=otp_expired', '')).toMatch(/already been used/)
  })

  it('passes through an error it has no better words for', () => {
    const hash = '#error=server_error&error_description=Database+error+saving+new+user'
    expect(authUrlError('', hash)).toBe('Database error saving new user')
  })

  it('decodes a description with escaped characters', () => {
    expect(authUrlError('', '#error_description=Signups+not+allowed+for+this+instance')).toBe(
      'Signups not allowed for this instance'
    )
  })

  it('falls back to the code when there is no description', () => {
    expect(authUrlError('', '#error=access_denied')).toBe('Sign-in failed: access_denied')
  })
})
