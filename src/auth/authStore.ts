import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  session: Session | null
  loading: boolean           // true until the saved session has been checked
  init: () => () => void     // returns an unsubscribe for useEffect cleanup
  signIn: (email: string, password: string) => Promise<string | null>   // error message or null
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

// Not persisted here: Supabase keeps the session in localStorage itself,
// so a signed-in user stays signed in at the alley with no signal.
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, loading: false }))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => set({ session, loading: false }))
    return () => data.subscription.unsubscribe()
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error?.message ?? null
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) return error.message
    // With email confirmation on, there's no session until the link is clicked.
    return data.session ? null : 'Check your email to confirm your account, then sign in.'
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
