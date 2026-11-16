import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabaseConfigured, supabaseProblem } from '../lib/supabaseConfig'

type AuthState = {
  session: Session | null
  loading: boolean           // true until the saved session has been checked
  init: () => () => void     // returns an unsubscribe for useEffect cleanup
  signIn: (email: string, password: string) => Promise<string | null>   // error message or null
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

// The Supabase library is loaded on demand, so the first screen never waits for it.
const loadSupabase = () => import('../lib/supabase').then((m) => m.supabase)

// Not persisted here: Supabase keeps the session in localStorage itself,
// so a signed-in user stays signed in at the alley with no signal.
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  loading: true,

  init: () => {
    if (!supabaseConfigured) {
      set({ loading: false })
      return () => {}
    }
    let cancelled = false
    let unsubscribe = () => {}
    loadSupabase().then((supabase) => {
      if (cancelled) return
      supabase.auth.getSession().then(({ data }) => set({ session: data.session, loading: false }))
      const { data } = supabase.auth.onAuthStateChange((_event, session) => set({ session, loading: false }))
      unsubscribe = () => data.subscription.unsubscribe()
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
  },
}))
