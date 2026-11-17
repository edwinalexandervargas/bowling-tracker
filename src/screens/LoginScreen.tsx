import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuthStore } from '../auth/authStore'
import { validateCredentials, type CredentialErrors } from '../auth/validateCredentials'
import { supabaseConfigured, supabaseProblem } from '../lib/supabaseConfig'
import { Card, PinRack, Segmented } from '../components/ui'
import { Icon } from '../components/Icon'
import { inputClass, primaryButton } from '../components/styles'

type Mode = 'signin' | 'signup'

export function LoginScreen() {
  const location = useLocation()
  const session = useAuthStore((s) => s.session)
  const problem = useAuthStore((s) => s.problem)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<CredentialErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const found = validateCredentials({ email, password })
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    setMessage(result)
  }

  // Already signed in (or just finished): carry on to wherever they were headed.
  // RequireAuth puts that path in the location state when it sends someone here.
  const sentFrom = (location.state as { from?: string } | null)?.from
  const from = sentFrom?.startsWith('/') && sentFrom !== '/login' ? sentFrom : '/'
  if (session) return <Navigate to={from} replace />

  // This screen stands on its own: no sidebar, no tab bar, so it needs its
  // own page padding and a way back into the app, which works signed out.
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
      {/* Only a build without Supabase keys can use the app signed out. */}
      {!supabaseConfigured && (
        <Link to="/" className="-ml-2 inline-flex min-h-tap w-fit items-center gap-1 px-2 text-sm font-medium text-accent">
          <Icon name="back" className="h-4 w-4" />
          Back to the app
        </Link>
      )}
      <div className="mx-auto my-auto w-full max-w-md space-y-6 py-6">
        <div className="text-center">
          <PinRack className="mx-auto h-12 w-12 text-accent" />
          <h1 className="display mt-3 text-2xl">{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>
          <p className="mt-1 text-sm text-muted">
            {supabaseConfigured
              ? 'Scores are saved on this device and backed up to your account, so they are there on every device you sign in on.'
              : 'Optional. Scores are always saved on this device. Signing in also backs them up and keeps your devices in step.'}
          </p>
        </div>

        {(supabaseProblem ?? problem) && (
          <Card className="p-4 text-sm text-accent">
            <p role="alert">{supabaseProblem ?? problem}</p>
          </Card>
        )}

        <Segmented label="Mode" value={mode} onChange={(m) => { setMode(m); setMessage(null); setErrors({}) }}
          options={[{ key: 'signin', label: 'Sign in' }, { key: 'signup', label: 'Sign up' }]} />

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Email</span>
            <input type="email" autoComplete="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} className={inputClass} />
            {errors.email && <span className="text-xs text-danger">{errors.email}</span>}
          </label>
          <label className="block">
            <span className="text-sm text-muted">Password</span>
            <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password}
              onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} className={inputClass} />
            {errors.password && <span className="text-xs text-danger">{errors.password}</span>}
          </label>

          {message && <p role="status" className="rounded-lg bg-raised p-3 text-sm ring-1 ring-line">{message}</p>}

          <button type="submit" disabled={busy || !supabaseConfigured} className={`${primaryButton} w-full`}>
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
