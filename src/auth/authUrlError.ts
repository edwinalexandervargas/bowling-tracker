// Supabase sends failures back in the URL, in the hash or the query string,
// after an email link is followed. Nothing reads them by default, so the
// person lands on a sign-in form with no idea why they are there.

const USED_UP =
  'That email link has already been used or has expired. Some mail providers open links to scan them, ' +
  'which uses the link up. Sign up again to get a new one.'

export function authUrlError(search: string, hash: string): string | null {
  const params = new URLSearchParams(
    `${search.replace(/^\?/, '')}&${hash.replace(/^#/, '')}`
  )
  const code = params.get('error_code')
  const description = params.get('error_description')
  const error = params.get('error')
  if (!code && !description && !error) return null

  if (code === 'otp_expired') return USED_UP
  return description ?? `Sign-in failed: ${error}`
}
