import { useEffect, useState } from 'react'
import { Link } from 'react-router'

// Shown while the saved sign-in is being read. Nothing for the first moment,
// so a fast check doesn't flash; words if it drags; a way out if it hangs,
// because a page with nothing on it tells the person nothing.
export function CheckingSignIn() {
  const [stage, setStage] = useState<'quiet' | 'waiting' | 'stuck'>('quiet')

  useEffect(() => {
    const waiting = setTimeout(() => setStage('waiting'), 400)
    const stuck = setTimeout(() => setStage('stuck'), 6000)
    return () => {
      clearTimeout(waiting)
      clearTimeout(stuck)
    }
  }, [])

  if (stage === 'quiet') return null

  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-muted">Checking your sign-in…</p>
      {stage === 'stuck' && (
        <p className="text-sm">
          Taking longer than it should.{' '}
          <Link to="/login" className="font-medium text-accent underline">Go to sign in</Link>
        </p>
      )}
    </div>
  )
}
