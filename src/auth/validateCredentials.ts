export type Credentials = { email: string; password: string }
export type CredentialErrors = Partial<Record<keyof Credentials, string>>

export const MIN_PASSWORD = 8

// Client-side checks before calling Supabase. Returns {} when valid.
export function validateCredentials({ email, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email'
  if (password.length < MIN_PASSWORD) errors.password = `At least ${MIN_PASSWORD} characters`
  return errors
}
