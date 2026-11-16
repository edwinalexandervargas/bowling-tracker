import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../auth/authStore'
import { validateCredentials, type CredentialErrors } from '../auth/validateCredentials'
import { supabaseConfigured, supabaseProblem } from '../lib/supabaseConfig'
import { Card, PinRack, Segmented } from '../components/ui'
import { inputClass, primaryButton } from '../components/styles'

type Mode = 'signin' | 'signup'

export function LoginScreen() {
  const session = useAuthStore((s) => s.session)
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

  // Already signed in (or just finished): nothing to do here.
  if (session) return <Navigate to="/" replace />

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pt-4">
      <div className="text-center">
        <PinRack className="mx-auto h-12 w-12 text-accent" />
        <h1 className="display mt-3 text-2xl">{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>
        <p className="mt-1 text-sm text-muted">Optional. Scores are always saved on this device. Signing in also backs them up and keeps your devices in step.</p>
      </div>

      {supabaseProblem && (
        <Card className="p-4 text-sm text-accent">
          <p role="alert">{supabaseProblem}</p>
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
  )
}
