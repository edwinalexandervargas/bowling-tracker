import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// The anon key is safe in the browser; row-level security in Supabase protects the data.
export const supabaseConfigured = Boolean(url && anonKey)

// `||`, not `??`: an env var set to an empty string must fall back too, or createClient
// throws at import and the whole app fails to start.
export const supabase = createClient(url || 'http://localhost', anonKey || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
})
