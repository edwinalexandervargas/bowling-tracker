import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabaseConfigured, supabaseProblem } from '../lib/supabaseConfig'
import { authUrlError } from './authUrlError'

type AuthState = {
  session: Session | null
  loading: boolean           // true until the saved session has been checked
  problem: string | null     // why the check failed, if it did
  init: () => () => void     // returns an unsubscribe for useEffect cleanup
  signIn: (email: string, password: string) => Promise<string | null>   // error message or null
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

// Read at module load: an email link that failed comes back with the reason in
// the URL, and the Supabase client wipes the URL as soon as it is created.
const fromEmailLink = authUrlError(window.location.search, window.location.hash)
if (fromEmailLink) {
  // Don't let the error survive a refresh, or stick to a link they share.
  window.history.replaceState(null, '', window.location.pathname)
}

// The Supabase library is loaded on demand, so the first screen never waits for it.
const loadSupabase = () => import('../lib/supabase').then((m) => m.supabase)

// Not persisted here: Supabase keeps the session in localStorage itself,
// so a signed-in user stays signed in at the alley with no signal.
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  loading: true,
  problem: fromEmailLink,

  init: () => {
    if (!supabaseConfigured) {
      set({ loading: false })
      return () => {}
    }
    let cancelled = false
    let unsubscribe = () => {}
    loadSupabase()
      .then(async (supabase) => {
        if (cancelled) return
        const { data } = supabase.auth.onAuthStateChange((_event, session) => set({ session, loading: false }))
        unsubscribe = () => data.subscription.unsubscribe()
        const { data: current } = await supabase.auth.getSession()
        set({ session: current.session, loading: false })
      })
      // Never leave `loading` true: the app shows nothing while it is, and a
      // failed chunk fetch or a blocked request would hang there for good.
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('Sign-in check failed:', error)
        set({ loading: false, problem: fromEmailLink ?? "Couldn't reach the sign-in service. Your scores are still on this device." })
      })
    return () => {
      cancelled = true
      unsubscribe()
    }
  },

  signIn: async (email, password) => {
    if (!supabaseConfigured) return supabaseProblem
    const supabase = await loadSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error?.message ?? null
  },

  signUp: async (email, password) => {
    if (!supabaseConfigured) return supabaseProblem
    const supabase = await loadSupabase()
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) return error.message
    // With email confirmation on, there's no session until the link is clicked.
    return data.session ? null : 'Check your email to confirm your account, then sign in.'
  },

  signOut: async () => {
    if (!supabaseConfigured) return
    const supabase = await loadSupabase()
    await supabase.auth.signOut()
    // Read back what Supabase now holds, so the store is up to date by the time
    // this resolves (callers navigate straight after).
    const { data } = await supabase.auth.getSession()
    set({ session: data.session })
  },
}))
